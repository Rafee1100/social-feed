import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { cloudinary } from '../config/cloudinary.js';
import { createError } from '../middleware/error.js';
import { Readable } from 'stream';

const FEED_LIMIT = 10;

/**
 * GET /api/posts
 * Returns the paginated feed using cursor-based pagination.
 */
const getFeed = async (req, res, next) => {
  try {
    const { cursor } = req.query;

    const visibilityFilter = {
      $or: [{ visibility: 'public' }, { author: req.user._id, visibility: 'private' }],
    };

    const cursorFilter = cursor ? { createdAt: { $lt: new Date(cursor) } } : {};

    const posts = await Post.find({ ...visibilityFilter, ...cursorFilter })
      .sort({ createdAt: -1 })
      .limit(FEED_LIMIT + 1) 
      .populate('author', 'firstName lastName')
      .lean(); 

    const hasMore = posts.length > FEED_LIMIT;
    if (hasMore) posts.pop();
    
    const postIds = posts.map((p) => p._id);
    const commentCountsAgg = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]);
    const commentCountByPostId = commentCountsAgg.reduce((acc, row) => {
      acc[row._id.toString()] = row.count;
      return acc;
    }, {});

    const currentUserId = req.user._id.toString();
    const postsWithMeta = posts.map((post) => ({
      ...post,
      likeCount: post.likes.length,
      commentCount: commentCountByPostId[post._id.toString()] ?? 0,
      isLiked: post.likes.some((id) => id.toString() === currentUserId),
      likes: undefined,
    }));

    const nextCursor = hasMore ? posts[posts.length - 1].createdAt.toISOString() : null;

    res.json({ posts: postsWithMeta, nextCursor, hasMore });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/posts
 * Creates a post with optional image.
 * multer + Cloudinary runs before this controller via the route definition.
 */
const createPost = async (req, res, next) => {
  try {
    const { content, visibility } = req.body;

    const postData = {
      author: req.user._id,
      content,
      visibility: visibility || 'public',
    };

    let uploadedPublicId = null;

    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_UPLOADS === '1') {
      if (req.file) {
        console.log('[createPost] file meta:', {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        });
      }
    }

    if (!req.file && Object.prototype.hasOwnProperty.call(req.body || {}, 'image')) {
      return next(
        createError(
          400,
          "No file received. Send multipart/form-data with field name 'image'."
        )
      );
    }

    if (req.file) {
      if (!req.file.buffer) {
        return next(createError(400, 'Invalid image upload.'));
      }

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'social-feed/posts',
            transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }],
            resource_type: 'image',
          },
          (err, result) => {
            if (err) return reject(err);
            return resolve(result);
          }
        );

        Readable.from([req.file.buffer]).pipe(stream);
      });

      postData.imageUrl = uploadResult?.secure_url || uploadResult?.url || null;
      uploadedPublicId = uploadResult?.public_id || null;
      postData.imagePublicId = uploadedPublicId;

      if (!postData.imageUrl) {
        return next(createError(500, 'Image upload failed.'));
      }
    }

    const post = await Post.create(postData);
    await post.populate('author', 'firstName lastName');

    res.status(201).json({
      post: {
        ...post.toObject(),
        likeCount: post.likes.length,
        commentCount: 0,
        isLiked: false,
        likes: undefined,
      },
    });
  } catch (err) {
    // If Cloudinary upload succeeded but the DB write failed, clean up the uploaded asset.
    if (uploadedPublicId) {
      await cloudinary.uploader.destroy(uploadedPublicId).catch(() => {});
    }
    next(err);
  }
};

/**
 * GET /api/posts/:id
 * Returns a single post. Enforces visibility rules.
 */
const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'firstName lastName');

    if (!post) return next(createError(404, 'Post not found.'));

    if (post.visibility === 'private' && post.author._id.toString() !== req.user._id.toString()) {
      return next(createError(403, 'This post is private.'));
    }

    const commentCount = await Comment.countDocuments({ post: post._id });
    const currentUserId = req.user._id.toString();
    res.json({
      post: {
        ...post.toObject(),
        likeCount: post.likes.length,
        commentCount,
        isLiked: post.likes.some((id) => id.toString() === currentUserId),
        likes: undefined,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/posts/:id
 * Deletes a post and its image from Cloudinary. Owner only.
 */
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(createError(404, 'Post not found.'));

    if (post.author.toString() !== req.user._id.toString()) {
      return next(createError(403, 'You can only delete your own posts.'));
    }

    if (post.imagePublicId) {
      await cloudinary.uploader.destroy(post.imagePublicId).catch(() => {});
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.json({ message: 'Post deleted.' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/posts/:id/like
 * Toggles like on a post for the current user.
 */
const togglePostLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(createError(404, 'Post not found.'));

    if (post.visibility === 'private' && post.author.toString() !== req.user._id.toString()) {
      return next(createError(403, 'This post is private.'));
    }

    const userId = req.user._id;
    const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());

    const update = alreadyLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    const updated = await Post.findByIdAndUpdate(req.params.id, update, { new: true });

    res.json({
      isLiked: !alreadyLiked,
      likeCount: updated.likes.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/posts/:id/likes
 * Returns the list of users who liked a post (for the "who liked" modal).
 */
const getPostLikes = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .select('likes visibility author')
      .populate('likes', 'firstName lastName');

    if (!post) return next(createError(404, 'Post not found.'));

    if (post.visibility === 'private' && post.author.toString() !== req.user._id.toString()) {
      return next(createError(403, 'This post is private.'));
    }

    res.json({ likes: post.likes });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/posts/:id
 * Updates a post (content/visibility). Owner only.
 */
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'firstName lastName');
    if (!post) return next(createError(404, 'Post not found.'));

    if (post.author._id.toString() !== req.user._id.toString()) {
      return next(createError(403, 'You can only edit your own posts.'));
    }

    const { content, visibility } = req.body;

    if (typeof content === 'string') {
      const trimmed = content.trim();
      if (!trimmed && !post.imageUrl) {
        return next(createError(400, 'Post content cannot be empty.'));
      }
      post.content = trimmed;
    }

    if (typeof visibility === 'string') {
      if (!['public', 'private'].includes(visibility)) {
        return next(createError(400, 'Invalid visibility.'));
      }
      post.visibility = visibility;
    }

    await post.save();

    const commentCount = await Comment.countDocuments({ post: post._id });
    const currentUserId = req.user._id.toString();

    res.json({
      post: {
        ...post.toObject(),
        likeCount: post.likes.length,
        commentCount,
        isLiked: post.likes.some((id) => id.toString() === currentUserId),
        likes: undefined,
      },
    });
  } catch (err) {
    next(err);
  }
};

export { getFeed, createPost, getPost, updatePost, deletePost, togglePostLike, getPostLikes };

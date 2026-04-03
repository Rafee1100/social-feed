import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { cloudinary } from '../config/cloudinary.js';
import { createError } from '../middleware/error.js';

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

    const currentUserId = req.user._id.toString();
    const postsWithMeta = posts.map((post) => ({
      ...post,
      likeCount: post.likes.length,
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

    if (req.file) {
      postData.imageUrl = req.file.path;
      postData.imagePublicId = req.file.filename;
    }

    const post = await Post.create(postData);
    await post.populate('author', 'firstName lastName');

    res.status(201).json({ post });
  } catch (err) {
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
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

    const currentUserId = req.user._id.toString();
    res.json({
      post: {
        ...post.toObject(),
        likeCount: post.likes.length,
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

export { getFeed, createPost, getPost, deletePost, togglePostLike, getPostLikes };

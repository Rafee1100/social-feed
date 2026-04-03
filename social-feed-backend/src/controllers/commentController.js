import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import { createError } from '../middleware/error.js';

/**
 * GET /api/posts/:id/comments
 * Returns all top-level comments for a post, each with their replies nested.
 */
const getComments = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).select('visibility author');
    if (!post) return next(createError(404, 'Post not found.'));

    if (post.visibility === 'private' && post.author.toString() !== req.user._id.toString()) {
      return next(createError(403, 'This post is private.'));
    }

    const allComments = await Comment.find({ post: req.params.id })
      .sort({ createdAt: 1 })
      .populate('author', 'firstName lastName')
      .lean();

    const currentUserId = req.user._id.toString();

    const commentsWithMetaData = allComments.map((c) => ({
      ...c,
      likeCount: c.likes.length,
      isLiked: c.likes.some((id) => id.toString() === currentUserId),
      likes: undefined,
    }));

    const commentMap = {};
    const topLevel = [];

    commentsWithMetaData.forEach((c) => {
      commentMap[c._id.toString()] = { ...c, replies: [] };
    });

    commentsWithMetaData.forEach((c) => {
      if (c.parentComment) {
        const parent = commentMap[c.parentComment.toString()];
        if (parent) parent.replies.push(commentMap[c._id.toString()]);
      } else {
        topLevel.push(commentMap[c._id.toString()]);
      }
    });

    res.json({ comments: topLevel });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/posts/:id/comments
 * Creates a top-level comment or a reply.
 * Send { content, parentComment? } in the body.
 * parentComment = null or omitted → top-level comment
 * parentComment = <commentId>   → reply to that comment
 */
const createComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).select('visibility author');
    if (!post) return next(createError(404, 'Post not found.'));

    if (post.visibility === 'private' && post.author.toString() !== req.user._id.toString()) {
      return next(createError(403, 'This post is private.'));
    }

    const { content, parentComment } = req.body;

    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent) return next(createError(404, 'Parent comment not found.'));
      if (parent.post.toString() !== req.params.id) {
        return next(createError(400, 'Parent comment does not belong to this post.'));
      }
      if (parent.parentComment) {
        return next(createError(400, 'Cannot reply to a reply.'));
      }
    }

    const comment = await Comment.create({
      post: req.params.id,
      author: req.user._id,
      content,
      parentComment: parentComment || null,
    });

    await comment.populate('author', 'firstName lastName');

    res.status(201).json({
      comment: {
        ...comment.toObject(),
        likeCount: 0,
        isLiked: false,
        replies: [],
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/comments/:id
 * Deletes a comment and all its replies. Owner only.
 */
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(createError(404, 'Comment not found.'));

    if (comment.author.toString() !== req.user._id.toString()) {
      return next(createError(403, 'You can only delete your own comments.'));
    }

    if (!comment.parentComment) {
      await Comment.deleteMany({ parentComment: comment._id });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/comments/:id/like
 * Toggles like on a comment or reply.
 */
const toggleCommentLike = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(createError(404, 'Comment not found.'));

    const userId = req.user._id;
    const alreadyLiked = comment.likes.some((id) => id.toString() === userId.toString());

    const update = alreadyLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    const updated = await Comment.findByIdAndUpdate(req.params.id, update, { new: true });

    res.json({
      isLiked: !alreadyLiked,
      likeCount: updated.likes.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/comments/:id/likes
 * Returns who liked a specific comment (for the "who liked" modal).
 */
const getCommentLikes = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .select('likes')
      .populate('likes', 'firstName lastName');

    if (!comment) return next(createError(404, 'Comment not found.'));

    res.json({ likes: comment.likes });
  } catch (err) {
    next(err);
  }
};

export { getComments, createComment, deleteComment, toggleCommentLike, getCommentLikes };

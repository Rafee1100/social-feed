const express = require('express');
const { protect } = require('../middleware/auth');
const { createCommentRules } = require('../middleware/validate');
const {
  getComments,
  createComment,
  deleteComment,
  toggleCommentLike,
  getCommentLikes,
} = require('../controllers/commentController');

const router = express.Router();

router.use(protect);

router.get('/posts/:id/comments', getComments);
router.post('/posts/:id/comments', createCommentRules, createComment);

router.delete('/comments/:id', deleteComment);
router.patch('/comments/:id/like', toggleCommentLike);
router.get('/comments/:id/likes', getCommentLikes);

module.exports = router;

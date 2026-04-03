import express from 'express';
import { protect } from '../middleware/auth.js';
import { createCommentRules } from '../middleware/validate.js';
import {
  getComments,
  createComment,
  deleteComment,
  toggleCommentLike,
  getCommentLikes,
} from '../controllers/commentController.js';

const router = express.Router();

router.use(protect);

router.get('/posts/:id/comments', getComments);
router.post('/posts/:id/comments', createCommentRules, createComment);

router.delete('/comments/:id', deleteComment);
router.patch('/comments/:id/like', toggleCommentLike);
router.get('/comments/:id/likes', getCommentLikes);

export default router;

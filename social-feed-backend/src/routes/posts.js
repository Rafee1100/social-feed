import express from 'express';
import { protect } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';
import { createPostRules } from '../middleware/validate.js';
import {
  getFeed,
  createPost,
  getPost,
  deletePost,
  togglePostLike,
  getPostLikes,
} from '../controllers/postController.js';

const router = express.Router();

router.use(protect);

router.get('/', getFeed);
router.post('/', upload.single('image'), createPostRules, createPost);
router.get('/:id', getPost);
router.delete('/:id', deletePost);
router.patch('/:id/like', togglePostLike);
router.get('/:id/likes', getPostLikes);

export default router;

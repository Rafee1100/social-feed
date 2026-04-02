const express = require('express');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { createPostRules } = require('../middleware/validate');
const {
  getFeed,
  createPost,
  getPost,
  deletePost,
  togglePostLike,
  getPostLikes,
} = require('../controllers/postController');

const router = express.Router();

router.use(protect);

router.get('/', getFeed);
router.post('/', upload.single('image'), createPostRules, createPost);
router.get('/:id', getPost);
router.delete('/:id', deletePost);
router.patch('/:id/like', togglePostLike);
router.get('/:id/likes', getPostLikes);

module.exports = router;

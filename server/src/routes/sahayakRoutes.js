const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const sahayakController = require('../controllers/sahayakController');

// Memory storage for incoming audio recordings
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// All Sahayak endpoints are protected with artisan JWT session
router.use(protect);

router.post('/query', upload.single('audio'), sahayakController.querySahayak);
router.get('/quick-prompts', sahayakController.getQuickPrompts);

module.exports = router;

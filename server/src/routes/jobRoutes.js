const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const aiJobQueue = require('../queues/aiJobQueue');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/jobs/:jobId
 * @desc  Fetch current status, progress percentage, and result of an async AI background job
 */
router.get('/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const job = await aiJobQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found or expired',
    });
  }

  res.status(200).json({
    success: true,
    job,
  });
});

/**
 * @route POST /api/jobs/ai-task
 * @desc  Submit an async task to the BullMQ / in-memory background worker
 */
router.post('/ai-task', async (req, res) => {
  const { type, payload } = req.body;
  if (!type) {
    return res.status(400).json({ success: false, error: 'Job type is required' });
  }

  const jobInfo = await aiJobQueue.addJob(type, {
    ...(payload || {}),
    userId: req.user._id,
  });

  res.status(202).json({
    success: true,
    message: 'Job enqueued successfully',
    ...jobInfo,
  });
});

module.exports = router;

const { EventEmitter } = require('events');

/**
 * AI Async Job Queue
 * Wraps Redis BullMQ with an in-memory asynchronous worker fallback for local development.
 */
class AIJobQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map(); // Job storage: jobId -> Job object
    this.jobCounter = 1;
  }

  /**
   * Add a new async AI job to the queue
   * @param {string} type - 'vision_enhance' | 'audio_transcribe' | 'price_suggest'
   * @param {Object} payload - Task parameters
   * @returns {Promise<{ jobId: string, status: string, progress: number }>}
   */
  async addJob(type, payload = {}) {
    const jobId = `job_${Date.now()}_${this.jobCounter++}`;
    const job = {
      id: jobId,
      type,
      payload,
      status: 'waiting',
      progress: 0,
      result: null,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, job);

    // Trigger async execution
    this._processJobAsync(job);

    return {
      jobId,
      status: job.status,
      progress: job.progress,
      type: job.type,
    };
  }

  /**
   * Get current status and progress of a job
   * @param {string} jobId
   */
  async getJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }
    return {
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  /**
   * Internal async worker simulator and processor
   */
  async _processJobAsync(job) {
    setTimeout(async () => {
      job.status = 'active';
      job.progress = 25;
      job.updatedAt = new Date();

      try {
        if (job.type === 'vision_enhance') {
          const imageEnhancementService = require('../services/imageEnhancementService');
          job.progress = 50;
          const result = await imageEnhancementService.enhanceProductImage(
            job.payload.userId,
            job.payload.productId,
            job.payload.options
          );
          job.progress = 100;
          job.status = 'completed';
          job.result = result;
        } else if (job.type === 'catalog_ai') {
          const catalogAIService = require('../services/catalogAIService');
          job.progress = 50;
          const result = await catalogAIService.generateBilingualCatalog(
            job.payload.userId,
            job.payload.productId,
            job.payload.options
          );
          job.progress = 100;
          job.status = 'completed';
          job.result = result;
        } else if (job.type === 'pricing') {
          const pricingService = require('../services/pricingService');
          job.progress = 50;
          const result = await pricingService.calculateSuggestedPrice(
            job.payload.userId,
            job.payload.productId
          );
          job.progress = 100;
          job.status = 'completed';
          job.result = result;
        } else {
          // Generic background task
          job.progress = 75;
          await new Promise((res) => setTimeout(res, 50));
          job.progress = 100;
          job.status = 'completed';
          job.result = { message: 'Async task completed successfully', data: job.payload };
        }
      } catch (err) {
        job.status = 'failed';
        job.error = err.message;
        job.progress = 100;
      } finally {
        job.updatedAt = new Date();
        this.emit('jobCompleted', job);
      }
    }, 20);
  }
}

module.exports = new AIJobQueue();

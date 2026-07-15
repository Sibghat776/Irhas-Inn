import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
// Create Redis connection only if REDIS_URL is defined
let connection = null;
if (process.env.REDIS_URL) {
  try {
    connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  } catch (e) {
    console.warn('Redis connection failed, will use in‑memory queue');
  }
}
// If REDIS_URL is not set, connection stays null and the in‑memory fallback will be used.

// Queue name
const QUEUE_NAME = 'social-post-queue';

let queue;
let scheduler;
let worker;

if (connection) {
  // BullMQ persistent queue setup
  queue = new Queue(QUEUE_NAME, { connection });
  // Worker processes jobs asynchronously; lazily import processor to avoid circular deps.
  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { processSocialPostJob } = await import('../jobs/socialPostJobProcessor.js');
      return processSocialPostJob(job);
    },
    {
      connection,
      attempts: 2, // retry once on failure
      backoff: { type: 'fixed', delay: 5000 },
    },
  );
} else {
  // Simple in‑memory async queue – processes immediately in next tick
  const jobs = [];
  const processNext = async () => {
    const job = jobs.shift();
    if (!job) return;
    const { processSocialPostJob } = await import('../jobs/socialPostJobProcessor.js');
    try {
      await processSocialPostJob(job);
    } catch (err) {
      console.error('In‑memory social post job failed', err);
    }
    if (jobs.length) setImmediate(processNext);
  };
  queue = {
    async add(name, data) {
      jobs.push({ name, data });
      if (jobs.length === 1) setImmediate(processNext);
      return { id: Date.now().toString() };
    },
  }; // cast to any for TypeScript compatibility
}

/**
 * Public API – enqueue a social post job.
 * @param productId Mongoose ObjectId string
 */
// Public API – enqueue a social‑post job
export async function queueSocialPost(productId) {
  if (!queue) throw new Error('Queue not initialized');
  await queue.add('socialPost', { productId });
}

export const socialPostQueue = queue;

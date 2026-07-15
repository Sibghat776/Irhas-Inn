import { socialPostQueue } from '../queues/socialPostQueue.js';

/**
 * Simple controller that enqueues a social‑media posting job.
 * Called from the product creation flow.
 */
export async function queueSocialPost(productId) {
  // fire‑and‑forget – the caller does not await the result
  await socialPostQueue.add('socialPost', { productId });
}

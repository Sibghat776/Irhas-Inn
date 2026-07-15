import { Product } from '../Models/Product.js';
import { SocialPostLog } from '../Models/SocialPostLog.js';
import { postProductToSocial } from '../utils/socialMedia.js';

/**
 * BullMQ job processor for a social‑media post.
 * job.data = { productId }
 */
export async function processSocialPostJob(job) {
  console.log(`[SocialPostJob] Received job for product ${job.data.productId}`);
  const { productId } = job.data;
  const product = await Product.findById(productId);
  if (!product) {
    console.warn(`Social post job: product ${productId} not found`);
    return;
  }
  console.log(`[SocialPostJob] Processing product ${productId}`);
  const results = await postProductToSocial(product);
  console.log(`[SocialPostJob] Finished posting to platforms:`, results);
  // Save a log entry for each platform
  const platforms = Object.entries(results);
  for (const [platform, res] of platforms) {
    await SocialPostLog.create({
      product: product._id,
      platform,
      status: res.success ? 'success' : 'failed',
      postId: res.postId,
      errorMessage: res.error,
    });
    console.log(`[SocialPostJob] Logged ${platform} result: ${res.success ? 'success' : 'failed'}`);
  }
}

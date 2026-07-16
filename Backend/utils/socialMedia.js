import axios from 'axios';
import FormData from 'form-data';
import { config } from 'dotenv';

config(); // load .env variables

const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.META_PAGE_ID;
const IG_BUSINESS_ID = process.env.META_IG_BUSINESS_ID;
const IG_ACCESS_TOKEN = process.env.META_IG_ACCESS_TOKEN;
// Placeholder value used in the repo when the Instagram Business ID is not yet known
const IG_PLACEHOLDER = 'YOUR_INSTAGRAM_BUSINESS_ID_PLACEHOLDER';

if (!PAGE_ACCESS_TOKEN || !PAGE_ID || !IG_BUSINESS_ID) {
  console.warn('Meta API credentials are missing. Social posting will be disabled.');
}

/**
 * Post an image with caption to a Facebook Page.
 * Returns { success: boolean, postId?: string, error?: string }
 */
export async function postToFacebook(product) {
  try {
    const images = product.images?.map(img => img.url).filter(Boolean) || [];
    const frontendUrl = process.env.FRONTEND_URL || 'https://zeeftrendystore.vercel.app';
    const productLink = `${frontendUrl}/product/${product._id}`;

    // Build structured caption
    let caption = `${product.name}\n\n${product.description}`;

    if (Array.isArray(product.colors) && product.colors.length) {
      caption += `\n\nColor: ${product.colors.join(', ')}`;
    }
    if (Array.isArray(product.sizes) && product.sizes.length) {
      caption += `\nSize: ${product.sizes.join(', ')}`;
    }

    caption += `\n\n👉 Order Now: ${productLink}`;

    if (Array.isArray(product.tags) && product.tags.length) {
      const hashtags = product.tags
        .map(tag => `#${tag.toLowerCase().replace(/[^a-z0-9]/g, '')}`)
        .join(' ');
      caption += `\n\n${hashtags}`;
    }

    const uploadedMedia = [];

    console.log('[SocialMedia] Uploading', images.length, 'images to Facebook (unpublished) for product', product._id);

    for (let i = 0; i < images.length; i++) {
      const imgUrl = images[i];
      const endpoint = `https://graph.facebook.com/v21.0/${PAGE_ID}/photos`;
      const params = {
        url: imgUrl,
        published: false,
        access_token: PAGE_ACCESS_TOKEN,
      };
      console.log('[SocialMedia] Uploading image', i + 1, 'of', images.length, '-', imgUrl);
      const resp = await axios.post(endpoint, null, { params });
      console.log('[SocialMedia] Image', i + 1, 'upload response', resp.data);
      if (resp.data.id) {
        uploadedMedia.push({ media_fbid: resp.data.id });
        console.log('[SocialMedia] Collected photo ID for image', i + 1, ':', resp.data.id);
      } else {
        console.warn('[SocialMedia] No photo ID returned for image', i + 1, '-', imgUrl);
      }
    }

    if (uploadedMedia.length === 0) {
      return { success: false, error: 'Facebook: No images were successfully uploaded' };
    }

    // Create a single feed post with all uploaded media (multi-photo/carousel post)
    const feedEndpoint = `https://graph.facebook.com/v21.0/${PAGE_ID}/feed`;
    const feedParams = {
      message: caption,
      attached_media: JSON.stringify(uploadedMedia),
      access_token: PAGE_ACCESS_TOKEN,
    };
    console.log('[SocialMedia] Creating single feed post with', uploadedMedia.length, 'attached photos:', uploadedMedia);
    const feedResp = await axios.post(feedEndpoint, null, { params: feedParams });
    console.log('[SocialMedia] Feed post response', feedResp.data);
    const { id } = feedResp.data; // Facebook post ID
    return { success: true, postId: id };
  } catch (err) {
    const msg = err.response?.data?.error?.message ?? err.message;
    return { success: false, error: `Facebook: ${msg}` };
  }
}

/**
 * Publish a photo to Instagram Business via the Graph API.
 * Returns { success: boolean, postId?: string, error?: string }
 */
/**
 * Poll an Instagram media container until its status_code becomes
 * "FINISHED" (or "ERROR"). Returns true if FINISHED, throws on ERROR/timeout.
 */
async function waitForIgContainer(containerId, label = 'container') {
  const statusUrl = `https://graph.instagram.com/v21.0/${containerId}`;
  const maxAttempts = 30; // 30 attempts * 2s = up to 60s
  const intervalMs = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const statusRes = await axios.get(statusUrl, {
      params: { fields: 'status_code', access_token: IG_ACCESS_TOKEN },
    });
    const statusCode = statusRes.data?.status_code || 'UNKNOWN';
    console.log(
      `[SocialMedia] Polling ${label} ${containerId} (attempt ${attempt}/${maxAttempts}) -> status_code: ${statusCode}`,
    );

    if (statusCode === 'FINISHED') {
      console.log(`[SocialMedia] ${label} ${containerId} is FINISHED — ready to use.`);
      return true;
    }
    if (statusCode === 'ERROR') {
      const errMsg = statusRes.data?.status_message || 'Instagram container processing failed';
      throw new Error(`Instagram ${label} processing ERROR: ${errMsg}`);
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(`Instagram ${label} did not finish processing within the timeout`);
}

export async function postToInstagram(product) {
  try {
    const images = product.images?.map(img => img.url).filter(Boolean) || [];
    const frontendUrl = process.env.FRONTEND_URL || 'https://zeeftrendystore.vercel.app';
    const productLink = `${frontendUrl}/product/${product._id}`;
    // Build caption similar to Facebook
    let caption = `${product.name}\n\n${product.description}`;
    if (Array.isArray(product.colors) && product.colors.length) {
      caption += `\n\nColor: ${product.colors.join(', ')}`;
    }
    if (Array.isArray(product.sizes) && product.sizes.length) {
      caption += `\nSize: ${product.sizes.join(', ')}`;
    }
    caption += `\n\n👉 Order Now: ${productLink}`;
    if (Array.isArray(product.tags) && product.tags.length) {
      const hashtags = product.tags
        .map(tag => `#${tag.toLowerCase().replace(/[^a-z0-9]/g, '')}`)
        .join(' ');
      caption += `\n\n${hashtags}`;
    }

    const baseUrl = 'https://graph.instagram.com/v21.0';
    const mediaContainers = [];
    console.log('[SocialMedia] Creating Instagram media containers for', images.length, 'image(s)');
    // Create individual containers (carousel items if multiple)
    for (let i = 0; i < images.length; i++) {
      const imgUrl = images[i];
      const params = {
        image_url: imgUrl,
        access_token: IG_ACCESS_TOKEN,
      };
      if (images.length > 1) {
        params.is_carousel_item = true;
      } else {
        params.caption = caption;
      }
      const endpoint = `${baseUrl}/${IG_BUSINESS_ID}/media`;
      console.log('[SocialMedia] Creating container for image', i + 1, imgUrl);
      const res = await axios.post(endpoint, null, { params });
      console.log('[SocialMedia] Container response', res.data);
      if (!res.data.id) {
        console.warn('[SocialMedia] No container ID returned for image', i + 1);
        continue;
      }
      const containerId = res.data.id;
      mediaContainers.push(containerId);

      // For carousel items, wait until each child finishes before using it
      if (images.length > 1) {
        console.log('[SocialMedia] Waiting for carousel child container', containerId, 'to finish processing');
        await waitForIgContainer(containerId, `carousel-child ${i + 1}`);
      }
    }

    if (mediaContainers.length === 0) {
      throw new Error('No Instagram media containers were created');
    }

    let containerIdToPublish;
    if (images.length === 1) {
      containerIdToPublish = mediaContainers[0];
    } else {
      // Create carousel container
      const carouselParams = {
        media_type: 'CAROUSEL',
        children: mediaContainers.join(','),
        caption,
        access_token: IG_ACCESS_TOKEN,
      };
      const carouselEndpoint = `${baseUrl}/${IG_BUSINESS_ID}/media`;
      console.log('[SocialMedia] Creating carousel container with children', mediaContainers);
      const carouselRes = await axios.post(carouselEndpoint, null, { params: carouselParams });
      console.log('[SocialMedia] Carousel container response', carouselRes.data);
      if (!carouselRes.data.id) {
        throw new Error('Failed to create Instagram carousel container');
      }
      containerIdToPublish = carouselRes.data.id;

      // The carousel container also needs time to finish processing
      console.log('[SocialMedia] Waiting for carousel container', containerIdToPublish, 'to finish processing');
      await waitForIgContainer(containerIdToPublish, 'carousel');
    }

    // Publish the container (single or carousel) — only after it is FINISHED
    const publishEndpoint = `${baseUrl}/${IG_BUSINESS_ID}/media_publish`;
    console.log('[SocialMedia] Publishing Instagram container', containerIdToPublish);
    const publishRes = await axios.post(publishEndpoint, null, {
      params: {
        creation_id: containerIdToPublish,
        access_token: IG_ACCESS_TOKEN,
      },
    });
    console.log('[SocialMedia] Instagram publish response', publishRes.data);
    const igPostId = publishRes.data.id;
    return { success: true, postId: igPostId };
  } catch (err) {
    const msg = err.response?.data?.error?.message ?? err.message;
    return { success: false, error: `Instagram: ${msg}` };
  }
}

/**
 * Unified function that posts to both platforms.
 * Returns an object with platform keys.
 */
export async function postProductToSocial(product) {
  const results = {};

  // Facebook posting – requires PAGE_ACCESS_TOKEN and PAGE_ID only
  if (PAGE_ACCESS_TOKEN && PAGE_ID) {
    const fb = await postToFacebook(product);
    results.facebook = fb;
  } else {
    results.facebook = { success: false, error: 'Meta credentials not configured for Facebook' };
  }

  // Instagram posting – run only if valid IG credentials are provided
  if (IG_BUSINESS_ID && IG_BUSINESS_ID !== IG_PLACEHOLDER && IG_ACCESS_TOKEN) {
    const ig = await postToInstagram(product);
    results.instagram = ig;
  } else {
    console.info('Instagram not configured or credentials missing – skipping Instagram posting');
    results.instagram = { success: false, error: 'Instagram not configured, skipping' };
  }

  return results;
}

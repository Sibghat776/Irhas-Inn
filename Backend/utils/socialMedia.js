import axios from 'axios';
import FormData from 'form-data';
import { config } from 'dotenv';

config(); // load .env variables

const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.META_PAGE_ID;
const IG_BUSINESS_ID = process.env.META_IG_BUSINESS_ID;
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
}/**
 * Publish a photo to Instagram Business via the Graph API.
 * Returns { success: boolean, postId?: string, error?: string }
 */
export async function postToInstagram(product) {
  try {
    const imageUrl = product.images?.[0]?.url;
    const caption = `${product.name}\n\n${product.description}`;
    // 1) Create media container
    // Validate image URL
    if (!imageUrl || !imageUrl.startsWith('https://')) {
      console.warn('[SocialMedia] Invalid image URL for Instagram:', imageUrl);
    }
    console.log('[SocialMedia] Creating Instagram media container for product', product._id);
    const createRes = await axios.post(createEndpoint, null, {
      params: {
        image_url: imageUrl,
        caption,
        access_token: PAGE_ACCESS_TOKEN,
      },
    });
    console.log('[SocialMedia] Instagram media container response', createRes.data);
    const creationId = createRes.data.id;
    // Publish media container
    console.log('[SocialMedia] Publishing Instagram media container');
    const publishRes = await axios.post(publishEndpoint, null, {
      params: {
        creation_id: creationId,
        access_token: PAGE_ACCESS_TOKEN,
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

  // Instagram posting – only run if a real IG_BUSINESS_ID is provided
  if (IG_BUSINESS_ID && IG_BUSINESS_ID !== IG_PLACEHOLDER) {
    const ig = await postToInstagram(product);
    results.instagram = ig;
  } else {
    console.info('Instagram not configured or placeholder ID detected – skipping Instagram posting');
    results.instagram = { success: false, error: 'Instagram not configured, skipping' };
  }

  return results;
}

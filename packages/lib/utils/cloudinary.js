import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a file buffer or base64 string to Cloudinary.
 * Returns { public_id, secure_url, width, height }
 */
export async function uploadImage(fileBuffer, folder = 'products') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          width: result.width,
          height: result.height,
        });
      }
    );
    stream.end(fileBuffer);
  });
}

/**
 * Delete an image from Cloudinary by public_id.
 */
export async function deleteImage(public_id) {
  return cloudinary.uploader.destroy(public_id);
}

/**
 * Generate a resize URL on-the-fly (no extra upload needed).
 * e.g. getImageUrl(public_id, { width: 400, height: 400 })
 */
export function getImageUrl(public_id, transforms = {}) {
  return cloudinary.url(public_id, {
    secure: true,
    fetch_format: 'auto',
    quality: 'auto',
    ...transforms,
  });
}

export default cloudinary;

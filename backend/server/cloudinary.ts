// server/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export { cloudinary, isCloudinaryConfigured };

export async function uploadToCloudinary(fileBuffer: Buffer, folder = 'ecommers'): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured');
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error: any, result: any) => {
        if (error || !result) {
          reject(error || new Error('Upload to Cloudinary failed'));
        } else {
          resolve(result.secure_url);
        }
      }
    ).end(fileBuffer);
  });
}

export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
  if (!isCloudinaryConfigured || !imageUrl) return;

  try {
    const parts = imageUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return;

    let publicIdWithExt = parts.slice(uploadIndex + 1).join('/');
    // Check if the next part is version identifier (e.g. v162345678)
    const firstPart = publicIdWithExt.split('/')[0];
    if (firstPart.startsWith('v') && /^\d+$/.test(firstPart.substring(1))) {
      publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
    }

    const dotIndex = publicIdWithExt.lastIndexOf('.');
    const publicId = dotIndex !== -1 ? publicIdWithExt.substring(0, dotIndex) : publicIdWithExt;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete from Cloudinary:', error);
  }
}

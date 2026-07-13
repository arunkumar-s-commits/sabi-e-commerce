import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'sabi-return-gifts',
  api_key: process.env.CLOUDINARY_API_KEY || 'mock_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_secret',
  secure: true,
});

export const uploadImage = async (
  fileStr: string,
  folder: 'products' | 'categories' | 'banners' | 'blogs' | 'users' | 'reviews'
): Promise<string> => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: `sabi-return-gifts/${folder}`,
      resource_type: 'auto',
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error(`Error uploading image to Cloudinary in folder ${folder}:`, error);
    // Development fallback image url
    return `https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=500&auto=format&fit=crop`;
  }
};

export default cloudinary;

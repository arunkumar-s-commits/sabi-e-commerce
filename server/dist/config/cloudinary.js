"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'sabi-return-gifts',
    api_key: process.env.CLOUDINARY_API_KEY || 'mock_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_secret',
    secure: true,
});
const uploadImage = async (fileStr, folder) => {
    try {
        const uploadResponse = await cloudinary_1.v2.uploader.upload(fileStr, {
            folder: `sabi-return-gifts/${folder}`,
            resource_type: 'auto',
        });
        return uploadResponse.secure_url;
    }
    catch (error) {
        console.error(`Error uploading image to Cloudinary in folder ${folder}:`, error);
        // Development fallback image url
        return `https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=500&auto=format&fit=crop`;
    }
};
exports.uploadImage = uploadImage;
exports.default = cloudinary_1.v2;

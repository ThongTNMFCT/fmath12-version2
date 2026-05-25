// src/services/cloudinary.ts
import axios from 'axios';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Hàm upload file ảnh lên Cloudinary
 * @param file Đối tượng File lấy từ thẻ <input type="file">
 * @returns URL của ảnh đã được upload thành công
 */
export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );
    return response.data.secure_url; // Trả về link ảnh HTTPS
  } catch (error) {
    console.error("Lỗi upload ảnh lên Cloudinary:", error);
    throw new Error("Không thể upload hình ảnh. Vui lòng thử lại.");
  }
};
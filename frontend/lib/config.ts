// Cấu hình API tập trung cho toàn bộ frontend
// Khi deploy lên Render, set biến môi trường NEXT_PUBLIC_API_URL và NEXT_PUBLIC_BACKEND_URL

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

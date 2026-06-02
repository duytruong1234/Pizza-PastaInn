// Fetch dữ liệu tổng quan — server-side compatible
// Sử dụng fetch trực tiếp thay vì axios cho server components

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function getOverviewData() {
  // Server component không có localStorage/token
  // Trả về dữ liệu mặc định — sẽ được fetch lại ở client
  return {
    views: { value: 0, growthRate: 0 },
    profit: { value: 0, growthRate: 0 },
    products: { value: 0, growthRate: 0 },
    users: { value: 0, growthRate: 0 },
  };
}

export async function getChatsData(): Promise<any[]> {
  return [];
}
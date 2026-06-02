/**
 * Định nghĩa kiểu dữ liệu cho một Đơn hàng trong hệ thống demo.
 */
export interface Order {
  orderId: string;         // Định dạng: DH + timestamp (vd: DH1717000000)
  amount: number;          // Số tiền cần thanh toán (VND)
  userId: string;          // ID người dùng tạo đơn hàng
  status: 'pending' | 'paid'; // Trạng thái thanh toán
  createdAt: Date;         // Thời gian tạo đơn hàng
  paidAt?: Date;           // Thời gian xác thực đã nhận được thanh toán
  actualAmount?: number;   // Số tiền thực tế người dùng đã chuyển
  transactionDate?: string;// Thời gian giao dịch do SePay ghi nhận
}

// Map lưu trữ các đơn hàng trong bộ nhớ Ram (In-Memory database)
export const orders = new Map<string, Order>();

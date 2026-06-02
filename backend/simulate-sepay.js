/**
 * Script giả lập SePay Webhook cho Dự án chính Pizza & Pasta Inn.
 * 
 * Cách sử dụng:
 *   node simulate-sepay.js <orderId> [amount]
 * 
 * Ví dụ:
 *   node simulate-sepay.js 1 225000
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 1. Đọc biến môi trường từ backend .env
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Không tìm thấy tệp .env ở thư mục backend!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const PORT = env.PORT || 4000;
const SEPAY_WEBHOOK_SECRET = env.SEPAY_WEBHOOK_SECRET || 'super_secret_webhook_key_123';

// 2. Thu thập tham số đầu vào
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('================================================================');
  console.log('🤖 HƯỚNG DẪN GIẢ LẬP SEPAY WEBHOOK DỰ ÁN CHÍNH');
  console.log('----------------------------------------------------------------');
  console.log('Cú pháp lệnh:');
  console.log('  node simulate-sepay.js <orderId> [amount]');
  console.log('\nVí dụ:');
  console.log('  node simulate-sepay.js 142 225000');
  console.log('================================================================');
  process.exit(0);
}

const orderId = args[0];
const amount = args[1] ? Number(args[1]) : 225000; // Mặc định 225,000 VND nếu không nhập

console.log('================================================================');
console.log('🤖 KHỞI CHẠY GIẢ LẬP WEBHOOK SEPAY TRÊN DỰ ÁN CHÍNH');
console.log(`🔌 Cổng backend: http://localhost:${PORT}`);
console.log(`🔑 Webhook Secret: ${SEPAY_WEBHOOK_SECRET}`);
console.log(`📦 Đơn hàng ID cần thanh toán: ${orderId}`);
console.log(`💰 Số tiền giao dịch: ${amount} VND`);
console.log('================================================================\n');

// 3. Khởi tạo Payload Webhook SePay mô phỏng giao dịch chuyển khoản thành công
const webhookPayloadObj = {
  id: Math.floor(Math.random() * 10000000),
  gateway: 'MBBank',
  transactionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
  accountNumber: '0944368230',
  transferType: 'in',
  transferAmount: amount,
  accumulated: 15000000,
  code: 'FT' + Date.now().toString().slice(-8),
  content: `Chuyen tien thanh toan PIZZA_INN_${orderId}`, // Chứa mã chuyển khoản đúng định dạng
  referenceCode: 'MBFT' + Date.now().toString().slice(-8)
};

const webhookPayloadStr = JSON.stringify(webhookPayloadObj);

// 4. Tính toán chữ ký HMAC SHA256 từ SEPAY_WEBHOOK_SECRET
const hmac = crypto.createHmac('sha256', SEPAY_WEBHOOK_SECRET);
const computedSignature = hmac.update(webhookPayloadStr).digest('hex');

// 5. Gửi request POST tới /api/webhooks/sepay của backend chính
const options = {
  hostname: 'localhost',
  port: PORT,
  path: '/api/webhooks/sepay',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(webhookPayloadStr),
    'x-sepay-signature': computedSignature
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`✅ Kết quả gửi Webhook:`);
    console.log(`   - HTTP Status: ${res.statusCode}`);
    console.log(`   - Phản hồi từ Backend:`, data);
    console.log('----------------------------------------------------------------');
    
    try {
      const responseJson = JSON.parse(data);
      if (responseJson.success) {
        console.log('🎉🎉🎉 GIẢ LẬP WEBHOOK THÀNH CÔNG RỰC RỠ! 🎉🎉🎉');
        console.log(`Hệ thống đã khớp và cập nhật đơn hàng ${orderId} thành công trong DB!`);
      } else {
        console.log('❌ Backend nhận request nhưng báo lỗi xử lý:', responseJson.message);
      }
    } catch (e) {
      console.log('⚠️ Không thể parse JSON phản hồi.');
    }
    console.log('================================================================');
  });
});

req.on('error', (err) => {
  console.error('❌ Lỗi kết nối đến Backend Server:', err.message);
  console.log('Đảm bảo backend server của dự án chính đang được chạy trên cổng 4000.');
});

req.write(webhookPayloadStr);
req.end();

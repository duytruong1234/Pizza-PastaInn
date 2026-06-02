/**
 * Script giả lập SePay Webhook để kiểm thử Hệ thống thanh toán VietQR.
 * 
 * Script này sẽ:
 * 1. Tự động gọi API tạo đơn hàng mới với số tiền 50,000 VND.
 * 2. Lấy mã đơn hàng nhận được (vd: DH1717000000).
 * 3. Tạo payload webhook giả lập giao dịch chuyển khoản thành công của SePay.
 * 4. Tính toán chữ ký HMAC SHA256 chính xác từ Webhook Secret (đọc từ file .env).
 * 5. Gửi webhook POST /webhook/sepay đến server.
 * 6. Kiểm tra lại trạng thái đơn hàng xem đã chuyển sang "paid" hay chưa.
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 1. Đọc biến môi trường từ .env theo cách thủ công để tránh phụ thuộc vào thư viện phụ
const envPath = path.join(__dirname, '.env');
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

const PORT = env.PORT || 4500;
const SEPAY_WEBHOOK_SECRET = env.SEPAY_WEBHOOK_SECRET || 'super_secret_webhook_key_123';

console.log('================================================================');
console.log('🤖 BẮT ĐẦU GIẢ LẬP KIỂM THỬ LUỒNG THANH TOÁN SEPAY WEBHOOK');
console.log(`🔌 Kết nối server tại: http://localhost:${PORT}`);
console.log(`🔑 Webhook Secret: ${SEPAY_WEBHOOK_SECRET}`);
console.log('================================================================\n');

// Hàm tiện ích thực hiện gửi HTTP Request
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: JSON.parse(data)
        });
      });
    });

    req.on('error', (err) => { reject(err); });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTest() {
  try {
    // ──────── STEP 1: TẠO ĐƠN HÀNG MỚI ────────
    console.log('Step 1: Gửi yêu cầu tạo đơn hàng mới...');
    const createPayload = JSON.stringify({
      amount: 50000,
      userId: 'TEST_USER_99'
    });

    const createOptions = {
      hostname: 'localhost',
      port: PORT,
      path: '/api/order/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(createPayload)
      }
    };

    const createRes = await makeRequest(createOptions, createPayload);
    
    if (!createRes.body.success) {
      throw new Error('Tạo đơn hàng thất bại: ' + JSON.stringify(createRes.body));
    }

    const { orderId, amount, qrUrl } = createRes.body;
    console.log(`✅ Tạo đơn hàng thành công!`);
    console.log(`   - Mã đơn hàng: ${orderId}`);
    console.log(`   - Số tiền: ${amount} VND`);
    console.log(`   - VietQR URL: ${qrUrl}`);
    console.log('----------------------------------------------------------------\n');

    // ──────── STEP 2: ĐỐI CHIẾU TRẠNG THÁI TRƯỚC THANH TOÁN ────────
    console.log(`Step 2: Kiểm tra trạng thái đơn hàng ${orderId} trước khi thanh toán...`);
    const statusBeforeRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/order/status/${orderId}`,
      method: 'GET'
    });
    console.log(`✅ Trạng thái ban đầu: "${statusBeforeRes.body.status}" (Mong đợi: "pending")`);
    console.log('----------------------------------------------------------------\n');

    // ──────── STEP 3: TẠO WEBHOOK PAYLOAD VÀ TÍNH CHỮ KÝ ────────
    console.log('Step 3: Khởi tạo dữ liệu giao dịch giả lập từ SePay...');
    
    // Payload giao dịch chuyển khoản thành công chuyển tới webhook
    const webhookPayloadObj = {
      id: Math.floor(Math.random() * 10000000),
      gateway: 'MBBank',
      transactionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      accountNumber: '0123456789',
      transferType: 'in',
      transferAmount: amount, // Số tiền chuyển khoản khớp hoàn toàn với đơn hàng
      accumulated: 10050000,
      code: 'FT260601999',
      content: `Chuyen tien thanh toan hoa don ${orderId} của khach hang TEST_USER_99`, // Nội dung có chứa mã DH...
      referenceCode: 'MBFT99283921'
    };

    const webhookPayloadStr = JSON.stringify(webhookPayloadObj);
    
    // Tính toán HMAC SHA256 của Raw Payload sử dụng SEPAY_WEBHOOK_SECRET làm Key
    const hmac = crypto.createHmac('sha256', SEPAY_WEBHOOK_SECRET);
    const computedSignature = hmac.update(webhookPayloadStr).digest('hex');

    console.log(`✅ Đã chuẩn bị xong Webhook Payload.`);
    console.log(`✅ Đã tính toán xong chữ ký HMAC SHA256: ${computedSignature}`);
    console.log('----------------------------------------------------------------\n');

    // ──────── STEP 4: GỬI WEBHOOK ĐẾN SERVER ────────
    console.log('Step 4: Gửi SePay Webhook chứa chữ ký bảo mật đến server...');
    const webhookOptions = {
      hostname: 'localhost',
      port: PORT,
      path: '/webhook/sepay',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(webhookPayloadStr),
        'x-sepay-signature': computedSignature // Đính kèm chữ ký vào Header
      }
    };

    const webhookRes = await makeRequest(webhookOptions, webhookPayloadStr);
    console.log(`✅ Nhận phản hồi từ Webhook API:`);
    console.log(`   - HTTP Status: ${webhookRes.statusCode}`);
    console.log(`   - Kết quả phản hồi:`, webhookRes.body);
    console.log('----------------------------------------------------------------\n');

    // ──────── STEP 5: ĐỐI CHIẾU TRẠNG THÁI SAU THANH TOÁN ────────
    console.log(`Step 5: Kiểm tra trạng thái đơn hàng ${orderId} sau khi xử lý webhook...`);
    
    // Đợi 1 giây để server cập nhật dữ liệu (mặc dù là in-memory rất nhanh)
    await new Promise(resolve => setTimeout(resolve, 500));

    const statusAfterRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/order/status/${orderId}`,
      method: 'GET'
    });
    
    console.log(`✅ Trạng thái hiện tại: "${statusAfterRes.body.status}" (Mong đợi: "paid")`);
    console.log('----------------------------------------------------------------\n');

    // KẾT LUẬN
    if (statusAfterRes.body.status === 'paid') {
      console.log('================================================================');
      console.log('🎉🎉🎉 CHÚC MỪNG: THỬ NGHIỆM ĐÃ THÀNH CÔNG RỰC RỠ! 🎉🎉🎉');
      console.log('Hệ thống tự động xác thực chữ ký SePay và khớp đơn hàng hoàn hảo!');
      console.log('================================================================');
    } else {
      console.log('================================================================');
      console.log('❌ THỬ NGHIỆM THẤT BẠI: Trạng thái đơn hàng không chuyển sang "paid"');
      console.log('================================================================');
    }

  } catch (error) {
    console.error('❌ Có lỗi xảy ra trong quá trình chạy thử nghiệm:', error);
  }
}

// Chạy thử nghiệm
runTest();

/**
 * Email Templates — HTML
 * 4 mau email thong bao trang thai don hang (khong emoji)
 */

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface OrderItemForEmail {
  name: string;
  details?: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderEmailData {
  order_id: number;
  store_name: string;
  store_hotline: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  order_type: string;
  payment_method: string;
  items: OrderItemForEmail[];
  order_note?: string;
  total_price_dish: number;
  shipping_fee: number;
  discount_amount: number;
  total_order: number;
  created_at: string;
  bank_account?: string;
  bank_name?: string;
  bank_holder_name?: string;
  transfer_content?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + 'd';
}

function formatOrderType(type: string): string {
  return type === 'delivery' ? 'Home Delivery' : 'Store Pickup';
}

function formatPaymentMethod(method: string): string {
  return method === 'vietqr' ? 'VietQR Bank Transfer' : 'Cash on Delivery (COD)';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ────────────────────────────────────────────────────────────────────────────
// Shared HTML layout wrapper
// ────────────────────────────────────────────────────────────────────────────

function wrapHtml(title: string, content: string, storeName: string, hotline: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

<!-- Header -->
<tr>
<td style="background: linear-gradient(135deg, #c0392b 0%, #8b1a1a 100%);padding:28px 32px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:1px;">PIZZA &amp; PASTA INN</h1>
<p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:12px;letter-spacing:2px;text-transform:uppercase;">${escapeHtml(storeName)}</p>
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:32px;">
${content}
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color:#fafafa;border-top:1px solid #eee;padding:20px 32px;text-align:center;">
<p style="margin:0 0 4px;color:#888;font-size:12px;">Hotline: <strong style="color:#c0392b;">${escapeHtml(hotline)}</strong></p>
<p style="margin:0;color:#aaa;font-size:11px;">Pizza &amp; Pasta Inn - Quality is our top priority</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ────────────────────────────────────────────────────────────────────────────
// Shared: items table HTML
// ────────────────────────────────────────────────────────────────────────────

function buildItemsTableHtml(items: OrderItemForEmail[]): string {
  let rows = '';
  items.forEach((item, idx) => {
    const detailHtml = item.details
      ? `<br/><span style="color:#888;font-size:12px;">${escapeHtml(item.details).replace(/\n/g, '<br/>')}</span>`
      : '';
    rows += `
    <tr style="border-bottom:1px solid #f0f0f0;">
      <td style="padding:10px 8px;font-size:13px;color:#555;text-align:center;width:30px;">${idx + 1}</td>
      <td style="padding:10px 8px;font-size:13px;color:#333;">${escapeHtml(item.name)}${detailHtml}</td>
      <td style="padding:10px 8px;font-size:13px;color:#555;text-align:center;white-space:nowrap;">${formatPrice(item.unit_price)}</td>
      <td style="padding:10px 8px;font-size:13px;color:#555;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 8px;font-size:13px;color:#333;text-align:right;font-weight:600;white-space:nowrap;">${formatPrice(item.subtotal)}</td>
    </tr>`;
  });

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;margin:16px 0;">
    <tr style="background-color:#c0392b;">
      <th style="padding:10px 8px;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:center;width:30px;">No.</th>
      <th style="padding:10px 8px;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;">Item Name</th>
      <th style="padding:10px 8px;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:center;">Unit Price</th>
      <th style="padding:10px 8px;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:center;">Quantity</th>
      <th style="padding:10px 8px;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;">Subtotal</th>
    </tr>
    ${rows}
  </table>`;
}

// ────────────────────────────────────────────────────────────────────────────
// Shared: payment summary HTML
// ────────────────────────────────────────────────────────────────────────────

function buildPaymentSummaryHtml(data: OrderEmailData): string {
  let discountRow = '';
  if (data.discount_amount > 0) {
    discountRow = `
    <tr>
      <td style="padding:6px 0;color:#888;font-size:13px;">Discount:</td>
      <td style="padding:6px 0;color:#27ae60;font-size:13px;text-align:right;font-weight:600;">-${formatPrice(data.discount_amount)}</td>
    </tr>`;
  }

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border-radius:8px;padding:16px;margin:16px 0;border:1px solid #eee;">
    <tr>
      <td style="padding:6px 0;color:#888;font-size:13px;">Items Subtotal:</td>
      <td style="padding:6px 0;color:#333;font-size:13px;text-align:right;font-weight:600;">${formatPrice(data.total_price_dish)}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#888;font-size:13px;">Shipping Fee:</td>
      <td style="padding:6px 0;color:#333;font-size:13px;text-align:right;font-weight:600;">${data.shipping_fee > 0 ? formatPrice(data.shipping_fee) : 'Free'}</td>
    </tr>
    ${discountRow}
    <tr>
      <td colspan="2" style="padding:8px 0 0;border-top:2px solid #c0392b;"></td>
    </tr>
    <tr>
      <td style="padding:8px 0;color:#333;font-size:16px;font-weight:800;">TOTAL PAYMENT:</td>
      <td style="padding:8px 0;color:#c0392b;font-size:18px;text-align:right;font-weight:800;">${formatPrice(data.total_order)}</td>
    </tr>
  </table>`;
}

// ────────────────────────────────────────────────────────────────────────────
// Shared: delivery info HTML block
// ────────────────────────────────────────────────────────────────────────────

function buildDeliveryInfoHtml(data: OrderEmailData): string {
  const addressLabel = data.order_type === 'pickup' ? 'Store Address:' : 'Delivery Address:';
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff8f0;border-radius:8px;padding:16px;margin:16px 0;border:1px solid #fce8d0;">
    <tr>
      <td style="padding:4px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;width:140px;">Recipient Name:</td>
      <td style="padding:4px 0;color:#333;font-size:13px;font-weight:600;">${escapeHtml(data.customer_name)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Phone Number:</td>
      <td style="padding:4px 0;color:#333;font-size:13px;font-weight:600;">${escapeHtml(data.customer_phone)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${addressLabel}</td>
      <td style="padding:4px 0;color:#333;font-size:13px;font-weight:600;">${escapeHtml(data.delivery_address)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Method:</td>
      <td style="padding:4px 0;color:#333;font-size:13px;font-weight:600;">${formatOrderType(data.order_type)}</td>
    </tr>
  </table>`;
}

// ════════════════════════════════════════════════════════════════════════════
// 1. EMAIL XAC NHAN DON HANG (Admin xac nhan)
// ════════════════════════════════════════════════════════════════════════════

export function orderConfirmedSubject(data: OrderEmailData): string {
  return `[${data.store_name}] Order Confirmation - Order ID: #${data.order_id}`;
}

export function orderConfirmedBody(data: OrderEmailData): string {
  let vietqrBlock = '';
  if (data.payment_method === 'vietqr') {
    const qrUrl = `https://qr.sepay.vn/img?acc=${data.bank_account || '0944368230'}&bank=${data.bank_name || 'MB'}&amount=${data.total_order}&des=${data.transfer_content || `Thanh toan PizzaPastaInn DH ${data.order_id}`}`;
    vietqrBlock = `
    <!-- VietQR Payment -->
    <div style="margin:24px 0;padding:20px;background-color:#f0f7ff;border:1px solid #c8ddf5;border-radius:8px;">
      <h3 style="margin:0 0 12px;color:#1a56a0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Bank Transfer Details</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;color:#666;font-size:13px;width:160px;">Bank:</td>
          <td style="padding:4px 0;color:#333;font-size:13px;font-weight:600;">${data.bank_name || 'MB Bank'}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#666;font-size:13px;">Account Number:</td>
          <td style="padding:4px 0;color:#333;font-size:13px;font-weight:600;">${data.bank_account || '0944368230'}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#666;font-size:13px;">Account Holder Name:</td>
          <td style="padding:4px 0;color:#333;font-size:13px;font-weight:600;">${data.bank_holder_name || 'PIZZA&PASTA INN'}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#666;font-size:13px;">Payment Description:</td>
          <td style="padding:4px 0;color:#c0392b;font-size:13px;font-weight:700;">${data.transfer_content || `Thanh toan PizzaPastaInn DH ${data.order_id}`}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#666;font-size:13px;">Amount:</td>
          <td style="padding:4px 0;color:#c0392b;font-size:15px;font-weight:800;">${formatPrice(data.total_order)}</td>
        </tr>
      </table>
      <div style="text-align:center;margin-top:16px;">
        <p style="margin:0 0 8px;color:#666;font-size:12px;">Scan QR Code to pay:</p>
        <img src="${qrUrl}" alt="QR Code" style="width:200px;height:200px;border:3px solid #fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" />
      </div>
      <p style="margin:12px 0 0;color:#c0392b;font-size:12px;font-weight:600;">Note: Please transfer the exact amount and description for the system to automatically confirm your payment.</p>
    </div>`;
  }

  const noteBlock = data.order_note
    ? `<div style="margin:12px 0;padding:12px;background-color:#fff9e6;border:1px solid #f0e0a0;border-radius:6px;">
        <p style="margin:0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Order Note:</p>
        <p style="margin:4px 0 0;color:#555;font-size:13px;font-style:italic;">"${escapeHtml(data.order_note)}"</p>
      </div>`
    : '';

  const content = `
    <p style="margin:0 0 8px;color:#333;font-size:15px;">Hello <strong>${escapeHtml(data.customer_name)}</strong>,</p>
    <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.6;">
      Thank you for choosing to enjoy dishes at Pizza&amp;PastaInn!
      The system has recorded your order. Currently, the chefs at <strong>${escapeHtml(data.store_name)}</strong> are preparing hot pizzas to deliver to you as soon as possible.
    </p>

    <h3 style="margin:20px 0 0;color:#333;font-size:14px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #c0392b;padding-bottom:8px;">Delivery Information</h3>
    ${buildDeliveryInfoHtml(data)}

    <h3 style="margin:20px 0 0;color:#333;font-size:14px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #c0392b;padding-bottom:8px;">Order Details</h3>
    ${buildItemsTableHtml(data.items)}
    ${noteBlock}

    <h3 style="margin:20px 0 0;color:#333;font-size:14px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #c0392b;padding-bottom:8px;">Payment Details</h3>
    ${buildPaymentSummaryHtml(data)}
    <p style="margin:0;color:#555;font-size:13px;">Payment Method: <strong>${formatPaymentMethod(data.payment_method)}</strong></p>
    <p style="margin:16px 0 0;color:#c0392b;font-size:13px;font-weight:bold;line-height:1.5;">
      Note: You can only cancel your order within 5 minutes of placing it by calling Hotline: 02839240343
    </p>

    ${vietqrBlock}
  `;

  return wrapHtml(orderConfirmedSubject(data), content, data.store_name, data.store_hotline);
}

// ════════════════════════════════════════════════════════════════════════════
// 2. EMAIL DANG GIAO HANG
// ════════════════════════════════════════════════════════════════════════════

export function deliveringSubject(data: OrderEmailData): string {
  return `[${data.store_name}] Order #${data.order_id} is on its way`;
}

export function deliveringBody(data: OrderEmailData): string {
  const codNote = data.payment_method === 'cod'
    ? `<div style="margin:16px 0;padding:14px;background-color:#fff3e0;border:1px solid #ffe0b2;border-radius:8px;">
        <p style="margin:0;color:#e65100;font-size:13px;font-weight:600;">Please prepare <strong>${formatPrice(data.total_order)}</strong> for payment upon delivery.</p>
      </div>`
    : '';

  const content = `
    <p style="margin:0 0 8px;color:#333;font-size:15px;">Hello <strong>${escapeHtml(data.customer_name)}</strong>,</p>
    <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.6;">
      Your order <strong style="color:#c0392b;">#${data.order_id}</strong> is on its way!
      Our delivery driver from <strong>${escapeHtml(data.store_name)}</strong> is on their way with your hot food. Please keep your phone nearby to receive your order.
    </p>

    <h3 style="margin:20px 0 0;color:#333;font-size:14px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #c0392b;padding-bottom:8px;">Delivery Information</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff8f0;border-radius:8px;padding:16px;margin:16px 0;border:1px solid #fce8d0;">
      <tr>
        <td style="padding:4px 0;color:#888;font-size:12px;width:140px;">Order ID:</td>
        <td style="padding:4px 0;color:#c0392b;font-size:13px;font-weight:700;">#${data.order_id}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#888;font-size:12px;">Recipient:</td>
        <td style="padding:4px 0;color:#333;font-size:13px;font-weight:600;">${escapeHtml(data.customer_name)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#888;font-size:12px;">Phone Number:</td>
        <td style="padding:4px 0;color:#333;font-size:13px;font-weight:600;">${escapeHtml(data.customer_phone)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#888;font-size:12px;">Address:</td>
        <td style="padding:4px 0;color:#333;font-size:13px;font-weight:600;">${escapeHtml(data.delivery_address)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#888;font-size:12px;">Total Payment:</td>
        <td style="padding:4px 0;color:#c0392b;font-size:15px;font-weight:800;">${formatPrice(data.total_order)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#888;font-size:12px;">Payment Method:</td>
        <td style="padding:4px 0;color:#333;font-size:13px;font-weight:600;">${formatPaymentMethod(data.payment_method)}</td>
      </tr>
    </table>

    ${codNote}
  `;

  return wrapHtml(deliveringSubject(data), content, data.store_name, data.store_hotline);
}

// ════════════════════════════════════════════════════════════════════════════
// 3. EMAIL GIAO HANG THANH CONG
// ════════════════════════════════════════════════════════════════════════════

export function deliveredSubject(data: OrderEmailData): string {
  return `[${data.store_name}] Order #${data.order_id} delivered successfully - Thank you!`;
}

export function deliveredBody(data: OrderEmailData): string {
  const content = `
    <p style="margin:0 0 8px;color:#333;font-size:15px;">Hello <strong>${escapeHtml(data.customer_name)}</strong>,</p>
    <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.6;">
      Your order <strong style="color:#c0392b;">#${data.order_id}</strong> has been successfully delivered!
      We hope you enjoy a delicious meal with your family and friends. Thank you for your trust and support for <strong>${escapeHtml(data.store_name)}</strong>.
    </p>

    <h3 style="margin:20px 0 0;color:#333;font-size:14px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #c0392b;padding-bottom:8px;">Order Details</h3>
    ${buildItemsTableHtml(data.items)}
    ${buildPaymentSummaryHtml(data)}

    <div style="margin:20px 0;padding:16px;background-color:#f0faf0;border:1px solid #c8e6c8;border-radius:8px;text-align:center;">
      <p style="margin:0;color:#2e7d32;font-size:14px;font-weight:600;">If you are satisfied with our service, please take a few seconds to rate your order on our website!</p>
    </div>
  `;

  return wrapHtml(deliveredSubject(data), content, data.store_name, data.store_hotline);
}

// ════════════════════════════════════════════════════════════════════════════
// 4. EMAIL THANH TOAN THANH CONG (VietQR)
// ════════════════════════════════════════════════════════════════════════════

export function paymentSuccessSubject(data: OrderEmailData): string {
  return `[${data.store_name}] Payment Successful - Order #${data.order_id}`;
}

export function paymentSuccessBody(data: OrderEmailData): string {
  const content = `
    <p style="margin:0 0 8px;color:#333;font-size:15px;">Hello <strong>${escapeHtml(data.customer_name)}</strong>,</p>
    <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.6;">
      The system has successfully recorded the payment for your order <strong style="color:#c0392b;">#${data.order_id}</strong>.
    </p>

    <div style="margin:16px 0;padding:20px;background-color:#f0faf0;border:1px solid #c8e6c8;border-radius:8px;">
      <h3 style="margin:0 0 12px;color:#2e7d32;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Payment Information</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;color:#666;font-size:13px;width:140px;">Order ID:</td>
          <td style="padding:4px 0;color:#333;font-size:13px;font-weight:600;">#${data.order_id}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#666;font-size:13px;">Amount:</td>
          <td style="padding:4px 0;color:#2e7d32;font-size:15px;font-weight:800;">${formatPrice(data.total_order)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#666;font-size:13px;">Method:</td>
          <td style="padding:4px 0;color:#333;font-size:13px;font-weight:600;">VietQR Bank Transfer</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#666;font-size:13px;">Status:</td>
          <td style="padding:4px 0;color:#2e7d32;font-size:14px;font-weight:700;">PAID</td>
        </tr>
      </table>
    </div>

    <p style="margin:16px 0 0;color:#555;font-size:14px;line-height:1.6;">
      Your order will be prepared and delivered as soon as possible.
    </p>
  `;

  return wrapHtml(paymentSuccessSubject(data), content, data.store_name, data.store_hotline);
}

// ════════════════════════════════════════════════════════════════════════════
// 5. EMAIL OTP XAC THUC
// ════════════════════════════════════════════════════════════════════════════

export function otpEmailSubject(): string {
  return `[Pizza&PastaInn] Your email verification code`;
}

export function otpEmailBody(otp: string, email: string): string {
  const content = `
    <p style="margin:0 0 8px;color:#333;font-size:15px;">Hello,</p>
    <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.6;">
      You (or someone else) have requested to verify the email address <strong>${escapeHtml(email)}</strong> at Pizza&amp;PastaInn.
      Please use the verification code below to complete the process:
    </p>

    <div style="margin:24px 0;text-align:center;">
      <div style="display:inline-block;background: linear-gradient(135deg, #c0392b 0%, #8b1a1a 100%);border-radius:12px;padding:20px 40px;">
        <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:3px;">Verification Code</p>
        <p style="margin:0;color:#ffffff;font-size:36px;font-weight:800;letter-spacing:8px;font-family:monospace;">${otp}</p>
      </div>
    </div>

    <p style="margin:16px 0 0;color:#888;font-size:13px;text-align:center;">
      This code is valid for <strong style="color:#c0392b;">5 minutes</strong>. Please do not share this code with anyone.
    </p>

    <div style="margin:24px 0;padding:14px;background-color:#fff3e0;border:1px solid #ffe0b2;border-radius:8px;">
      <p style="margin:0;color:#e65100;font-size:12px;">If you did not request this code, please ignore this email. Your account remains secure.</p>
    </div>
  `;

  return wrapHtml(otpEmailSubject(), content, 'Pizza&PastaInn', '');
}


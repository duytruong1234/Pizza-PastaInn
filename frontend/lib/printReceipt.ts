import { formatPrice } from './utils';

export interface PrintableOrderItem {
  name: string;
  quantity: number;
  totalPrice: number;
  spec?: string;
  subDetails?: string[];
  note?: string | null;
}

export interface PrintableOrderData {
  order_id: number;
  created_at?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  order_type?: string;
  store_name?: string;
  payment_method?: string;
  payment_status?: string;
  order_status?: string;
  order_note?: string | null;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_order: number;
  items: PrintableOrderItem[];
}

export function printOrderReceipt(order: PrintableOrderData) {
  if (typeof window === 'undefined') return;

  const printWin = window.open('', '_blank', 'width=460,height=760');
  if (!printWin) {
    alert('Vui lòng cho phép trình duyệt mở cửa sổ pop-up để in hóa đơn.');
    return;
  }

  const createdStr = order.created_at
    ? new Date(order.created_at).toLocaleString('vi-VN')
    : new Date().toLocaleString('vi-VN');

  const isPaid = order.payment_status === 'paid' || order.order_status === 'completed';
  const paymentMethodLabel =
    order.payment_method === 'vietqr' ? 'Chuyển khoản VietQR' : 'Thanh toán khi nhận hàng (COD)';
  const paymentStatusLabel = isPaid
    ? 'ĐÃ THANH TOÁN'
    : order.payment_method === 'vietqr'
    ? 'CHỜ CHUYỂN KHOẢN VIETQR'
    : 'THU HỘ KHI GIAO (COD)';

  const itemsHtml = order.items
    .map((item, idx) => {
      const subHtml =
        item.subDetails && item.subDetails.length > 0
          ? `<div style="padding-left:10px;font-size:11px;color:#444;margin-top:2px;">${item.subDetails
              .map((line) => `<div>- ${line}</div>`)
              .join('')}</div>`
          : '';
      const specHtml = item.spec
        ? `<div style="font-size:11px;color:#555;">${item.spec}</div>`
        : '';
      const noteHtml = item.note
        ? `<div style="font-size:11px;font-style:italic;color:#333;">Ghi chú món: ${item.note}</div>`
        : '';

      return `
        <tr>
          <td style="padding:6px 0;vertical-align:top;border-bottom:1px dashed #ddd;">
            <div style="font-weight:700;font-size:12.5px;">${idx + 1}. ${item.name}</div>
            ${specHtml}
            ${subHtml}
            ${noteHtml}
          </td>
          <td style="padding:6px 4px;text-align:center;vertical-align:top;border-bottom:1px dashed #ddd;font-weight:600;">
            x${item.quantity}
          </td>
          <td style="padding:6px 0;text-align:right;vertical-align:top;border-bottom:1px dashed #ddd;font-weight:700;white-space:nowrap;">
            ${formatPrice(item.totalPrice)}
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <title>Hóa đơn #${order.order_id} - Pizza & Pasta Inn</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #111;
          margin: 0;
          padding: 16px;
          background: #f5f5f5;
        }
        .receipt {
          max-width: 360px;
          margin: 0 auto;
          background: #fff;
          padding: 20px 18px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #222;
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .brand {
          font-size: 19px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .sub {
          font-size: 11px;
          color: #555;
          margin-top: 3px;
        }
        .order-badge {
          display: inline-block;
          margin-top: 8px;
          padding: 4px 12px;
          background: #111;
          color: #fff;
          font-weight: 800;
          font-size: 13px;
          border-radius: 4px;
        }
        .meta {
          font-size: 12px;
          line-height: 1.55;
          border-bottom: 1px dashed #aaa;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .totals {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 2px dashed #222;
          font-size: 12.5px;
          line-height: 1.7;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
        }
        .grand-total {
          font-size: 16px;
          font-weight: 900;
          border-top: 1px solid #222;
          margin-top: 6px;
          padding-top: 6px;
        }
        .payment-box {
          margin-top: 12px;
          padding: 8px;
          border: 1.5px solid #111;
          text-align: center;
          font-weight: 800;
          font-size: 12px;
          border-radius: 4px;
        }
        .note-box {
          margin-top: 10px;
          padding: 8px;
          background: #f8f8f8;
          border-left: 3px solid #111;
          font-size: 11.5px;
        }
        .footer {
          margin-top: 14px;
          text-align: center;
          font-size: 11px;
          color: #555;
        }
        .actions {
          text-align: center;
          margin-bottom: 12px;
        }
        .btn-print {
          background: #cd3645;
          color: #fff;
          border: none;
          padding: 8px 18px;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
          font-size: 12px;
        }
        @media print {
          body { background: #fff; padding: 0; }
          .receipt { border: none; max-width: 100%; padding: 0; }
          .actions { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="actions">
        <button class="btn-print" onclick="window.print()">IN HÓA ĐƠN / LƯU PDF</button>
      </div>
      <div class="receipt">
        <div class="header">
          <div class="brand">PIZZA & PASTA INN</div>
          <div class="sub">${order.store_name || 'Hệ thống Pizza & Pasta Inn TP.HCM'}</div>
          <div class="sub">Hotline: 028 7896770</div>
          <div class="order-badge">PHIẾU ĐƠN HÀNG #${order.order_id}</div>
        </div>

        <div class="meta">
          <div class="meta-row"><span>Thời gian:</span><strong>${createdStr}</strong></div>
          <div class="meta-row"><span>Hình thức:</span><strong>${
            order.order_type === 'pickup' ? 'Nhận tại cửa hàng' : 'Giao hàng tận nơi'
          }</strong></div>
          <div class="meta-row"><span>Khách hàng:</span><strong>${order.customer_name || 'Khách lẻ'}</strong></div>
          <div class="meta-row"><span>Điện thoại:</span><strong>${order.customer_phone || '-'}</strong></div>
          ${
            order.order_type !== 'pickup' && order.customer_address
              ? `<div style="margin-top:4px;"><span>Địa chỉ giao:</span> <strong>${order.customer_address}</strong></div>`
              : ''
          }
        </div>

        <table>
          <thead>
            <tr style="border-bottom:1px solid #222;text-align:left;font-size:11px;text-transform:uppercase;">
              <th style="padding-bottom:4px;">Món ăn</th>
              <th style="padding-bottom:4px;text-align:center;">SL</th>
              <th style="padding-bottom:4px;text-align:right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        ${
          order.order_note
            ? `<div class="note-box"><strong>Ghi chú & Gia vị kèm theo:</strong><br/>${order.order_note}</div>`
            : ''
        }

        <div class="totals">
          <div class="totals-row">
            <span>Tạm tính:</span>
            <strong>${formatPrice(order.subtotal)}</strong>
          </div>
          <div class="totals-row">
            <span>Phí giao hàng:</span>
            <strong>${order.shipping_fee > 0 ? formatPrice(order.shipping_fee) : 'Miễn phí (0đ)'}</strong>
          </div>
          ${
            order.discount_amount > 0
              ? `<div class="totals-row"><span>Giảm giá (Voucher/Điểm):</span><strong>-${formatPrice(
                  order.discount_amount
                )}</strong></div>`
              : ''
          }
          <div class="totals-row grand-total">
            <span>TỔNG THANH TOÁN:</span>
            <span>${formatPrice(order.total_order)}</span>
          </div>
        </div>

        <div class="payment-box">
          <div>${paymentMethodLabel}</div>
          <div style="font-size:13px;margin-top:2px;">${paymentStatusLabel}</div>
        </div>

        <div class="footer">
          Cảm ơn Quý khách đã lựa chọn Pizza & Pasta Inn!<br/>
          Chúc Quý khách ngon miệng.
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 250);
        };
      </script>
    </body>
    </html>
  `;

  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
}

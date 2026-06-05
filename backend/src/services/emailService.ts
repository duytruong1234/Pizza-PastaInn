/**
 * Email Service — Gmail SMTP via Nodemailer
 * Gửi email thông báo trạng thái đơn hàng
 */

import nodemailer from 'nodemailer';
import {
  OrderEmailData,
  OrderItemForEmail,
  orderConfirmedSubject,
  orderConfirmedBody,
  deliveringSubject,
  deliveringBody,
  deliveredSubject,
  deliveredBody,
  paymentSuccessSubject,
  paymentSuccessBody,
  otpEmailSubject,
  otpEmailBody,
} from './emailTemplates';
import prisma from '../lib/prisma';

// ────────────────────────────────────────────────────────────────────────────
// Nodemailer transporter (Gmail SMTP) - lazy init to ensure dotenv is loaded
// ────────────────────────────────────────────────────────────────────────────

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return _transporter;
}

// ────────────────────────────────────────────────────────────────────────────
// Helper: Fetch full order data từ DB và build OrderEmailData
// ────────────────────────────────────────────────────────────────────────────

export async function buildOrderEmailData(orderId: number): Promise<OrderEmailData | null> {
  const order = await prisma.order.findUnique({
    where: { order_id: orderId },
    include: {
      store: true,
      user_address: true,
      items: {
        include: {
          dish_price: {
            include: {
              dish: true,
              size: true,
              crust: true,
            },
          },
          combo: true,
          toppings: {
            include: { topping: true },
          },
          combos: {
            include: {
              dish_price: {
                include: {
                  dish: true,
                  size: true,
                  crust: true,
                },
              },
              toppings: {
                include: { topping: true },
              },
              halves: {
                include: {
                  dish: true,
                  order_item_toppings: {
                    include: { topping: true },
                  },
                },
              },
            },
          },
          halves: {
            include: {
              dish: true,
              order_item_toppings: {
                include: { topping: true },
              },
            },
          },
        },
      },
    },
  });

  if (!order) return null;

  // Build items list
  const emailItems: OrderItemForEmail[] = [];

  for (const item of order.items) {
    if (item.combo_id && item.combo) {
      // Combo item
      const comboName = item.combo.combo_name || 'Combo';
      let details = '';

      if (item.combos && item.combos.length > 0) {
        const detailParts: string[] = [];
        for (const sel of item.combos) {
          const dishName = sel.dish_price?.dish?.dish_name || '';
          const sizeName = sel.dish_price?.size?.size_name || '';
          const isSelPizza = dishName.toLowerCase().includes('pizza');

          let part = `- ${dishName}`;
          if (isSelPizza && sizeName) part += `\n  + Size: ${sizeName}`;
          const crustName = sel.dish_price?.crust?.crust_name;
          if (isSelPizza && crustName && crustName.toLowerCase() !== 'none') {
            part += `\n  + Crust: ${crustName}`;
          }

          // Half-half
          if (sel.halves && sel.halves.length > 0) {
            const halfNames = sel.halves.map((h: any) => h.dish?.dish_name || '').filter(Boolean);
            if (halfNames.length > 0) {
              part = `- ${halfNames.join(' + ')}`;
              if (sizeName) part += `\n  + Size: ${sizeName}`;
              const cName = sel.dish_price?.crust?.crust_name;
              if (cName && cName.toLowerCase() !== 'none') {
                part += `\n  + Crust: ${cName}`;
              }
            }
          }

          detailParts.push(part);
        }
        details = detailParts.join('\n');
      }

      // Add standalone toppings from combo item level
      if (item.toppings && item.toppings.length > 0) {
        const toppingNames = item.toppings.map((t: any) => {
          const tName = t.topping?.topping_name || 'Topping';
          const tPrice = t.topping?.price_topping || 0;
          const qty = t.quantity || 1;
          return `+ Topping: ${tName} (x${qty}) (${tPrice.toLocaleString('vi-VN')}d)`;
        });
        if (details) details += '\n';
        details += toppingNames.join('\n');
      }

      emailItems.push({
        name: comboName,
        details: details || undefined,
        unit_price: item.order_price || 0,
        quantity: item.quantity || 1,
        subtotal: (item.order_price || 0) * (item.quantity || 1),
      });
    } else {
      // Single dish
      const dishName = item.dish_price?.dish?.dish_name || 'Dish';
      const sizeName = item.dish_price?.size?.size_name || '';
      const isPizza = dishName.toLowerCase().includes('pizza') ||
        (item.halves && item.halves.length > 0);

      let details = '';

      // Half-half check
      if (item.halves && item.halves.length > 0) {
        const halfNames = item.halves.map((h: any) => h.dish?.dish_name || '').filter(Boolean);
        if (halfNames.length > 0) {
          details = halfNames.join(' + ');
        }
      }

      if (isPizza && sizeName) {
        if (details) details += '\n';
        details += `+ Size: ${sizeName}`;
      }

      const crustName = item.dish_price?.crust?.crust_name;
      if (isPizza && crustName && crustName.toLowerCase() !== 'none') {
        if (details) details += '\n';
        details += `+ Crust: ${crustName}`;
      }

      // Toppings
      if (item.toppings && item.toppings.length > 0) {
        const toppingLines = item.toppings.map((t: any) => {
          const tName = t.topping?.topping_name || 'Topping';
          const tPrice = t.topping?.price_topping || 0;
          const qty = t.quantity || 1;
          return `+ Topping: ${tName} (x${qty}) (${tPrice.toLocaleString('vi-VN')}d)`;
        });
        if (details) details += '\n';
        details += toppingLines.join('\n');
      }

      emailItems.push({
        name: dishName,
        details: details || undefined,
        unit_price: item.order_price || 0,
        quantity: item.quantity || 1,
        subtotal: (item.order_price || 0) * (item.quantity || 1),
      });
    }
  }

  // Build delivery address
  let deliveryAddress = '';
  if (order.order_type === 'pickup') {
    if (order.store) {
      deliveryAddress = order.store.address
        ? `${order.store.store_name} - ${order.store.address}`
        : (order.store.store_name || 'Store Pickup');
    } else {
      deliveryAddress = 'Store Pickup';
    }
  } else if (order.user_address) {
    // Parse address_line if JSON
    let addressLine = order.user_address.address_line || '';
    try {
      if (addressLine.startsWith('{') && addressLine.endsWith('}')) {
        const parsed = JSON.parse(addressLine);
        addressLine = parsed.address || addressLine;
      }
    } catch { }
    deliveryAddress = addressLine;
  }

  if (!deliveryAddress) {
    deliveryAddress = 'Store Pickup';
  }

  return {
    order_id: order.order_id,
    store_name: order.store?.store_name || 'Pizza&PastaInn',
    store_hotline: order.store?.hotline ? `${order.store.hotline} - 02839240343` : '028 5412 1197 - 028 5412 1196 - 02839240343',
    customer_name: order.customer_name || 'Valued Customer',
    customer_phone: order.customer_phone || '',
    customer_email: order.customer_email || '',
    delivery_address: deliveryAddress,
    order_type: order.order_type || 'delivery',
    payment_method: order.payment_method || 'cod',
    items: emailItems,
    order_note: order.order_note || undefined,
    total_price_dish: order.total_price_dish || 0,
    shipping_fee: order.shipping_fee || 0,
    discount_amount: order.discount_amount || 0,
    total_order: order.total_order || 0,
    created_at: order.created_at ? order.created_at.toISOString() : new Date().toISOString(),
    bank_account: '0944368230',
    bank_name: 'MB',
    bank_holder_name: 'PIZZA&PASTA INN',
    transfer_content: `Thanh toan PizzaPastaInn DH ${order.order_id}`,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Core send function
// ────────────────────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[Email] Chua cau hinh GMAIL_USER/GMAIL_APP_PASSWORD. Bo qua gui email.');
    return false;
  }

  if (!to) {
    console.warn('[Email] Khong co dia chi email nguoi nhan. Bo qua.');
    return false;
  }

  try {
    const info = await getTransporter().sendMail({
      from: `"Pizza&PastaInn" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Da gui email "${subject}" den ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email] Loi khi gui email den ${to}:`, error);
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Public API — Gửi email theo từng loại trạng thái
// ────────────────────────────────────────────────────────────────────────────

/**
 * Gửi email xác nhận đơn hàng (khi admin xác nhận)
 */
export async function sendOrderConfirmedEmail(orderId: number): Promise<boolean> {
  const data = await buildOrderEmailData(orderId);
  if (!data) {
    console.error(`[Email] Không tìm thấy đơn hàng ID ${orderId}`);
    return false;
  }
  return sendEmail(data.customer_email, orderConfirmedSubject(data), orderConfirmedBody(data));
}

/**
 * Gửi email thông báo đang giao hàng
 */
export async function sendDeliveringEmail(orderId: number): Promise<boolean> {
  const data = await buildOrderEmailData(orderId);
  if (!data) {
    console.error(`[Email] Không tìm thấy đơn hàng ID ${orderId}`);
    return false;
  }
  return sendEmail(data.customer_email, deliveringSubject(data), deliveringBody(data));
}

/**
 * Gửi email thông báo giao hàng thành công
 */
export async function sendDeliveredEmail(orderId: number): Promise<boolean> {
  const data = await buildOrderEmailData(orderId);
  if (!data) {
    console.error(`[Email] Không tìm thấy đơn hàng ID ${orderId}`);
    return false;
  }
  return sendEmail(data.customer_email, deliveredSubject(data), deliveredBody(data));
}

/**
 * Gửi email thông báo thanh toán thành công (VietQR)
 */
export async function sendPaymentSuccessEmail(orderId: number): Promise<boolean> {
  const data = await buildOrderEmailData(orderId);
  if (!data) {
    console.error(`[Email] Không tìm thấy đơn hàng ID ${orderId}`);
    return false;
  }
  return sendEmail(data.customer_email, paymentSuccessSubject(data), paymentSuccessBody(data));
}

/**
 * Gui email OTP xac thuc
 */
export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  return sendEmail(email, otpEmailSubject(), otpEmailBody(otp, email));
}

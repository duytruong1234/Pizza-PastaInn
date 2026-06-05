/**
 * OTP Service — Tao, luu, xac thuc OTP qua email
 * Luu OTP trong memory (Map) voi TTL 5 phut
 * Rate limit: max 5 lan gui / email / 10 phut
 */

// ────────────────────────────────────────────────────────────────────────────
// In-memory OTP store (fallback khi khong co Redis)
// ────────────────────────────────────────────────────────────────────────────

interface OtpEntry {
  otp: string;
  expiresAt: number; // timestamp ms
}

interface RateLimitEntry {
  count: number;
  windowStart: number; // timestamp ms
}

const otpStore = new Map<string, OtpEntry>();
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries moi 5 phut
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of otpStore.entries()) {
    if (now > entry.expiresAt) {
      otpStore.delete(key);
    }
  }
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > 10 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ────────────────────────────────────────────────────────────────────────────
// Generate OTP 6 so
// ────────────────────────────────────────────────────────────────────────────

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ────────────────────────────────────────────────────────────────────────────
// Rate limit check
// ────────────────────────────────────────────────────────────────────────────

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 phut

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

const OTP_TTL = 5 * 60 * 1000; // 5 phut

/**
 * Tao va luu OTP cho email
 * @returns OTP string hoac null neu bi rate limit
 */
export function createOtp(email: string): string | null {
  const key = email.toLowerCase();

  if (!checkRateLimit(key)) {
    return null; // rate limited
  }

  const otp = generateOtp();
  otpStore.set(key, {
    otp,
    expiresAt: Date.now() + OTP_TTL,
  });

  console.log(`[OTP] Da tao OTP cho ${key}: ${otp} (het han sau 5 phut)`);
  return otp;
}

/**
 * Xac thuc OTP
 * @returns true neu OTP dung va chua het han
 */
export function verifyOtp(email: string, otp: string): boolean {
  const key = email.toLowerCase();
  const entry = otpStore.get(key);

  if (!entry) {
    return false;
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return false;
  }

  if (entry.otp !== otp) {
    return false;
  }

  // OTP dung — xoa di de khong tai su dung
  otpStore.delete(key);
  return true;
}

/**
 * Kiem tra OTP co ton tai (chua het han) hay khong
 * Dung de check trang thai "da verify" ma khong xoa OTP
 */
export function hasActiveOtp(email: string): boolean {
  const key = email.toLowerCase();
  const entry = otpStore.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return false;
  }
  return true;
}

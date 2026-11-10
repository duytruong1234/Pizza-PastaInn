'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUI } from '@/components/UIProvider';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { theme, lang } = useUI();
  const isDark = theme === 'dark';
  const isEn = lang === 'en';

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Validate form, send OTP
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (!formData.email) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }

    setSendingOtp(true);
    try {
      await api.post('/auth/send-otp', { email: formData.email });
      setShowOtpModal(true);
      setOtpValues(['', '', '', '', '', '']);
      setOtpError('');
      setCountdown(300);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi mã xác thực OTP. Vui lòng thử lại.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setSendingOtp(true);
    setOtpError('');
    try {
      await api.post('/auth/send-otp', { email: formData.email });
      setCountdown(300);
      setOtpValues(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.slice(-1);
    setOtpValues(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpValues(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // Step 2: Verify OTP and register
  const handleVerifyAndRegister = async () => {
    const otp = otpValues.join('');
    if (otp.length !== 6) {
      setOtpError('Vui lòng nhập đầy đủ 6 chữ số OTP.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      // Verify OTP first
      await api.post('/auth/verify-otp', { email: formData.email, otp });

      // Then register
      const response = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
      });

      const { user, token } = response.data.data;
      setAuth(user, token);
      router.push('/');
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Xác thực OTP thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setOtpLoading(false);
    }
  };

  const inputBaseClass = `w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
    isDark
      ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-[#f5c043]'
      : 'bg-[#fcfaf6] border-black/12 text-[#1c1208] placeholder:text-[#9a8c7a] focus:border-[#cd3645] focus:bg-white'
  }`;

  const labelBaseClass = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${
    isDark ? 'text-white/65' : 'text-[#5c4d3c]'
  }`;

  const iconClass = `absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
    isDark ? 'text-white/35' : 'text-[#8c7d6b]'
  }`;

  return (
    <div
      className={`relative min-h-screen flex flex-col justify-center items-center px-4 py-10 overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8f5f0] text-[#1c1208]'
      }`}
    >
      {/* Background Image Outside Register Frame */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=1920&auto=format&fit=crop"
          alt="Pizza & Pasta Inn Background"
          className="w-full h-full object-cover scale-105"
        />
        <div
          className={`absolute inset-0 ${
            isDark
              ? 'bg-gradient-to-b from-black/75 via-black/65 to-black/85 backdrop-blur-[2px]'
              : 'bg-gradient-to-b from-black/55 via-black/45 to-black/65 backdrop-blur-[2px]'
          }`}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/85 hover:text-white transition-colors drop-shadow"
          >
            <ArrowLeft size={16} />
            <span>{isEn ? 'Back to Home' : 'Quay về trang chủ'}</span>
          </Link>
        </div>

        <div
          className={`w-full rounded-2xl overflow-hidden border transition-all backdrop-blur-md ${
            isDark
              ? 'bg-[#121212]/95 border-white/15 shadow-2xl shadow-black/80'
              : 'bg-white/95 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.35)]'
          }`}
        >
          <div className="p-7 sm:p-8">
            <div className="text-center mb-6">
              <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1c1208]'}`}>
                {isEn ? 'Create Account' : 'Đăng ký tài khoản'}
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-white/55' : 'text-[#6e6254]'}`}>
                {isEn
                  ? 'Create an account for faster checkout and exclusive offers'
                  : 'Tạo tài khoản để đặt món nhanh chóng và nhận ưu đãi'}
              </p>
            </div>

            {error && (
              <div
                className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm mb-5 ${
                  isDark
                    ? 'bg-red-500/10 border-red-500/25 text-red-300'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={labelBaseClass}>{isEn ? 'Full Name (*)' : 'Họ và tên (*)'}</label>
                <div className="relative">
                  <User size={17} className={iconClass} />
                  <input
                    type="text"
                    name="username"
                    required
                    className={inputBaseClass}
                    value={formData.username}
                    onChange={handleChange}
                    placeholder={isEn ? 'John Doe' : 'Nguyễn Văn A'}
                  />
                </div>
              </div>

              <div>
                <label className={labelBaseClass}>Email (*)</label>
                <div className="relative">
                  <Mail size={17} className={iconClass} />
                  <input
                    type="email"
                    name="email"
                    required
                    className={inputBaseClass}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className={labelBaseClass}>
                  {isEn ? 'Phone Number (Optional)' : 'Số điện thoại (Tùy chọn)'}
                </label>
                <div className="relative">
                  <Phone size={17} className={iconClass} />
                  <input
                    type="tel"
                    name="phone"
                    className={inputBaseClass}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0912 345 678"
                  />
                </div>
              </div>

              <div>
                <label className={labelBaseClass}>{isEn ? 'Password (*)' : 'Mật khẩu (*)'}</label>
                <div className="relative">
                  <Lock size={17} className={iconClass} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    minLength={6}
                    className={`${inputBaseClass} pr-10`}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isEn ? 'Minimum 6 characters...' : 'Tối thiểu 6 ký tự...'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                      isDark ? 'text-white/40 hover:text-white/80' : 'text-[#8c7d6b] hover:text-[#1c1208]'
                    }`}
                    aria-label={showPassword ? (isEn ? 'Hide password' : 'Ẩn mật khẩu') : (isEn ? 'Show password' : 'Hiện mật khẩu')}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelBaseClass}>
                  {isEn ? 'Confirm Password (*)' : 'Xác nhận mật khẩu (*)'}
                </label>
                <div className="relative">
                  <Lock size={17} className={iconClass} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    minLength={6}
                    className={`${inputBaseClass} pr-10`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={isEn ? 'Re-enter your password...' : 'Nhập lại mật khẩu...'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                      isDark ? 'text-white/40 hover:text-white/80' : 'text-[#8c7d6b] hover:text-[#1c1208]'
                    }`}
                    aria-label={showConfirmPassword ? (isEn ? 'Hide password' : 'Ẩn mật khẩu') : (isEn ? 'Show password' : 'Hiện mật khẩu')}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || sendingOtp}
                className="w-full bg-[#cd3645] hover:bg-[#b52a38] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-[#cd3645]/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2 text-sm"
              >
                {sendingOtp
                  ? isEn
                    ? 'Sending verification code...'
                    : 'Đang gửi mã xác thực...'
                  : isEn
                    ? 'Create Account'
                    : 'Đăng ký tài khoản'}
              </button>
            </form>

            <div className={`mt-6 text-center text-sm ${isDark ? 'text-white/60' : 'text-[#6e6254]'}`}>
              {isEn ? 'Already have an account?' : 'Đã có tài khoản?'}{' '}
              <Link href="/login" className="text-[#cd3645] hover:underline font-bold">
                {isEn ? 'Sign In' : 'Đăng nhập'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl shadow-2xl max-w-md w-full p-7 sm:p-8 relative border transition-all ${
              isDark
                ? 'bg-[#141414] border-white/10 text-white'
                : 'bg-white border-black/10 text-[#1c1208]'
            }`}
          >
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className={`absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDark
                  ? 'text-white/50 hover:text-white hover:bg-white/10'
                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
              }`}
              aria-label={isEn ? 'Close' : 'Đóng'}
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isDark ? 'bg-[#cd3645]/15 text-[#f87171]' : 'bg-red-50 text-[#cd3645]'
                }`}
              >
                <Mail size={26} />
              </div>
              <h2 className="text-xl font-black mb-1">{isEn ? 'Verify Your Email' : 'Xác thực Email'}</h2>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-[#6e6254]'}`}>
                {isEn ? 'A 6-digit verification code has been sent to' : 'Mã xác thực gồm 6 chữ số đã được gửi đến'}
              </p>
              <p className="text-sm font-bold text-[#cd3645] mt-1 break-all">{formData.email}</p>
            </div>

            {otpError && (
              <div
                className={`px-4 py-2.5 rounded-xl border text-sm mb-4 text-center font-medium ${
                  isDark
                    ? 'bg-red-500/10 border-red-500/25 text-red-300'
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}
              >
                {otpError}
              </div>
            )}

            {/* 6 OTP input boxes */}
            <div className="flex justify-center gap-2.5 mb-6" onPaste={handleOtpPaste}>
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all ${
                    isDark
                      ? 'bg-white/[0.04] border-white/15 text-white focus:border-[#f5c043]'
                      : 'bg-[#fcfaf6] border-stone-200 text-[#1c1208] focus:border-[#cd3645] focus:bg-white'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleVerifyAndRegister}
              disabled={otpLoading || otpValues.join('').length !== 6}
              className="w-full bg-[#cd3645] hover:bg-[#b52a38] text-white py-3 px-4 rounded-xl font-bold transition-colors disabled:opacity-50 mb-4 cursor-pointer text-sm"
            >
              {otpLoading ? (isEn ? 'Verifying...' : 'Đang xác thực...') : (isEn ? 'Verify & Register' : 'Xác nhận & Đăng ký')}
            </button>

            <div className="text-center">
              {countdown > 0 ? (
                <p className={`text-xs ${isDark ? 'text-white/45' : 'text-[#8c7d6b]'}`}>
                  {isEn ? 'Resend code in' : 'Gửi lại mã sau'}{' '}
                  <span className="font-bold text-[#cd3645]">
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={sendingOtp}
                  className="text-xs text-[#cd3645] hover:underline font-bold disabled:opacity-50 cursor-pointer"
                >
                  {sendingOtp ? (isEn ? 'Resending...' : 'Đang gửi lại...') : (isEn ? 'Resend verification code' : 'Gửi lại mã xác thực')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

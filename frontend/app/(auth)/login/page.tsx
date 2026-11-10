'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUI } from '@/components/UIProvider';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { theme, lang } = useUI();
  const isDark = theme === 'dark';
  const isEn = lang === 'en';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot Password OTP Modal states
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'done'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const openForgotModal = () => {
    setForgotEmail(email || '');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setForgotStep('email');
    setForgotOpen(true);
  };

  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotError('');
    setForgotLoading(true);
    try {
      await api.post('/auth/forgot-password/send-otp', { email: forgotEmail.trim() });
      setForgotStep('otp');
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (forgotNewPassword.length < 6) {
      setForgotError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setForgotLoading(true);
    try {
      await api.post('/auth/forgot-password/reset', {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword,
      });
      setEmail(forgotEmail.trim());
      setForgotStep('done');
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data.data;

      setAuth(user, token);

      if (user.role === 'admin' || user.role === 'cashier') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (typeof window === 'undefined') return;
    const google = (window as any).google;
    if (!google || !google.accounts || !google.accounts.oauth2) {
      setError('Dịch vụ đăng nhập Google hiện không khả dụng. Vui lòng tải lại trang hoặc thử lại.');
      return;
    }

    setError('');
    const client = google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '782735287587-v1v3e5pa1qo8t3i8h36jnkftds0k3jps.apps.googleusercontent.com',
      scope: 'email profile openid',
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          setError('Xác thực Google thất bại. Vui lòng thử lại.');
          return;
        }

        const accessToken = tokenResponse.access_token;
        if (!accessToken) return;

        setGoogleLoading(true);
        try {
          const response = await api.post('/auth/google-login', { accessToken });
          const { user, token } = response.data.data;
          setAuth(user, token);

          if (user.role === 'admin' || user.role === 'cashier') {
            router.push('/admin');
          } else {
            router.push('/');
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Đã xảy ra lỗi trong quá trình đăng nhập bằng Google.');
        } finally {
          setGoogleLoading(false);
        }
      },
    });
    client.requestAccessToken();
  };

  return (
    <div
      className={`relative min-h-screen flex flex-col justify-center items-center px-4 py-10 overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8f5f0] text-[#1c1208]'
      }`}
    >
      {/* Background Image Outside Login Frame */}
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

      {/* Load Google Identity Services script */}
      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />

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
            <div className="text-center mb-7">
              <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1c1208]'}`}>
                {isEn ? 'Sign In' : 'Đăng nhập tài khoản'}
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-white/55' : 'text-[#6e6254]'}`}>
                {isEn
                  ? 'Sign in for faster checkout and live order tracking'
                  : 'Đăng nhập để đặt món nhanh chóng và theo dõi đơn hàng'}
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

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                    isDark ? 'text-white/65' : 'text-[#5c4d3c]'
                  }`}
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={17}
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                      isDark ? 'text-white/35' : 'text-[#8c7d6b]'
                    }`}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isEn ? 'Enter your email address...' : 'Nhập địa chỉ email của bạn...'}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-[#f5c043]'
                        : 'bg-[#fcfaf6] border-black/12 text-[#1c1208] placeholder:text-[#9a8c7a] focus:border-[#cd3645] focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className={`block text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-white/65' : 'text-[#5c4d3c]'
                    }`}
                  >
                    {isEn ? 'Password' : 'Mật khẩu'}
                  </label>
                  <button
                    type="button"
                    onClick={openForgotModal}
                    className="text-xs font-bold text-[#cd3645] hover:underline cursor-pointer"
                  >
                    {isEn ? 'Forgot password?' : 'Quên mật khẩu?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    size={17}
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                      isDark ? 'text-white/35' : 'text-[#8c7d6b]'
                    }`}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEn ? 'Enter your password...' : 'Nhập mật khẩu...'}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-[#f5c043]'
                        : 'bg-[#fcfaf6] border-black/12 text-[#1c1208] placeholder:text-[#9a8c7a] focus:border-[#cd3645] focus:bg-white'
                    }`}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#cd3645] hover:bg-[#b52a38] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-[#cd3645]/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2 text-sm"
              >
                {loading ? (isEn ? 'Signing in...' : 'Đang đăng nhập...') : (isEn ? 'Sign In' : 'Đăng nhập')}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? 'border-white/10' : 'border-black/10'}`} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span
                  className={`px-3 font-medium ${
                    isDark ? 'bg-[#121212] text-white/45' : 'bg-white text-[#8c7d6b]'
                  }`}
                >
                  {isEn ? 'Or continue with' : 'Hoặc tiếp tục với'}
                </span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className={`w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border font-semibold text-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-white/[0.04] border-white/12 text-white hover:bg-white/[0.08]'
                  : 'bg-white border-black/15 text-[#1c1208] hover:bg-stone-50 shadow-sm'
              }`}
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.8-2.43 2.77v2.28h3.92c2.28-2.1 3.56-5.17 3.56-8.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.92-2.28c-1.08.73-2.48 1.16-4.04 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v2.38C3.18 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.32 14.97c-.24-.73-.38-1.5-.38-2.3 0-.8.14-1.58.38-2.3V7.99H1.21C.44 9.51 0 11.21 0 13s.44 3.49 1.21 5.01l4.11-3.04z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.31 0 3.18 2.7 1.21 6.62l4.11 3.04c.94-2.85 3.57-4.91 6.68-4.91z"
                  />
                </svg>
              )}
              <span>
                {googleLoading
                  ? isEn
                    ? 'Connecting with Google...'
                    : 'Đang kết nối Google...'
                  : isEn
                    ? 'Sign in with Google'
                    : 'Đăng nhập với Google'}
              </span>
            </button>

            <div className={`mt-6 text-center text-sm ${isDark ? 'text-white/60' : 'text-[#6e6254]'}`}>
              {isEn ? "Don't have an account?" : 'Chưa có tài khoản?'}{' '}
              <Link href="/register" className="text-[#cd3645] hover:underline font-bold">
                {isEn ? 'Register now' : 'Đăng ký ngay'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Quên mật khẩu qua OTP Email */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setForgotOpen(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative ${
              isDark
                ? 'bg-[#141414] border-white/10 text-white'
                : 'bg-white border-black/10 text-[#1c1208]'
            }`}
          >
            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-[#6e6254] hover:text-[#1c1208] hover:bg-stone-100'
              }`}
              aria-label={isEn ? 'Close' : 'Đóng'}
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#cd3645]/15 text-[#cd3645] flex items-center justify-center">
                <KeyRound size={18} />
              </div>
              <h2 className="text-lg font-extrabold">{isEn ? 'Reset Password' : 'Khôi phục mật khẩu'}</h2>
            </div>

            {forgotError && (
              <div
                className={`flex items-start gap-2 px-3.5 py-2.5 rounded-xl border text-xs my-3 ${
                  isDark
                    ? 'bg-red-500/10 border-red-500/25 text-red-300'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 'email' && (
              <form onSubmit={handleSendForgotOtp} className="space-y-4 mt-3">
                <p className={`text-xs leading-relaxed ${isDark ? 'text-white/60' : 'text-[#6e6254]'}`}>
                  {isEn
                    ? 'Enter your registered email address. We will send a 6-digit OTP verification code to your inbox.'
                    : 'Nhập địa chỉ email đã đăng ký tài khoản. Hệ thống sẽ gửi mã xác thực OTP gồm 6 chữ số tới hộp thư của bạn.'}
                </p>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-white/65' : 'text-[#5c4d3c]'}`}>
                    {isEn ? 'Email for OTP' : 'Email nhận mã OTP'}
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-[#f5c043]'
                        : 'bg-[#fcfaf6] border-black/12 text-[#1c1208] placeholder:text-[#9a8c7a] focus:border-[#cd3645] focus:bg-white'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#cd3645] hover:bg-[#b52a38] text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading
                    ? isEn
                      ? 'Sending OTP...'
                      : 'Đang gửi mã OTP...'
                    : isEn
                      ? 'Send OTP Code'
                      : 'Gửi mã OTP'}
                </button>
              </form>
            )}

            {forgotStep === 'otp' && (
              <form onSubmit={handleResetPasswordWithOtp} className="space-y-3.5 mt-3">
                <p className={`text-xs leading-relaxed ${isDark ? 'text-white/60' : 'text-[#6e6254]'}`}>
                  {isEn ? (
                    <>
                      OTP code has been sent to <strong className={isDark ? 'text-white' : 'text-[#1c1208]'}>{forgotEmail}</strong>. Please enter the OTP and your new password.
                    </>
                  ) : (
                    <>
                      Mã OTP đã được gửi tới <strong className={isDark ? 'text-white' : 'text-[#1c1208]'}>{forgotEmail}</strong>. Vui lòng nhập mã OTP và mật khẩu mới.
                    </>
                  )}
                </p>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-white/65' : 'text-[#5c4d3c]'}`}>
                    {isEn ? 'OTP Code (6 digits)' : 'Mã OTP (6 chữ số)'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder={isEn ? 'Enter 6-digit OTP' : 'Nhập 6 chữ số OTP'}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-widest outline-none transition-all ${
                      isDark
                        ? 'bg-white/[0.04] border-white/10 text-white focus:border-[#f5c043]'
                        : 'bg-[#fcfaf6] border-black/12 text-[#1c1208] focus:border-[#cd3645] focus:bg-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-white/65' : 'text-[#5c4d3c]'}`}>
                    {isEn ? 'New Password' : 'Mật khẩu mới'}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder={isEn ? 'Minimum 6 characters' : 'Tối thiểu 6 ký tự'}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-white/[0.04] border-white/10 text-white focus:border-[#f5c043]'
                        : 'bg-[#fcfaf6] border-black/12 text-[#1c1208] focus:border-[#cd3645] focus:bg-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-white/65' : 'text-[#5c4d3c]'}`}>
                    {isEn ? 'Confirm New Password' : 'Xác nhận mật khẩu mới'}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder={isEn ? 'Re-enter new password' : 'Nhập lại mật khẩu mới'}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-white/[0.04] border-white/10 text-white focus:border-[#f5c043]'
                        : 'bg-[#fcfaf6] border-black/12 text-[#1c1208] focus:border-[#cd3645] focus:bg-white'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep('email')}
                    className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                      isDark ? 'border-white/15 text-white/70 hover:text-white' : 'border-black/15 text-[#5c4d3c]'
                    }`}
                  >
                    {isEn ? 'Change Email' : 'Đổi email'}
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-[#cd3645] hover:bg-[#b52a38] text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50"
                  >
                    {forgotLoading ? (isEn ? 'Processing...' : 'Đang xử lý...') : (isEn ? 'Reset Password' : 'Đặt lại mật khẩu')}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'done' && (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={26} />
                </div>
                <p className="text-sm font-bold">{isEn ? 'Password reset successfully!' : 'Đặt lại mật khẩu thành công!'}</p>
                <p className={`text-xs ${isDark ? 'text-white/60' : 'text-[#6e6254]'}`}>
                  {isEn
                    ? 'You can now sign in with your new password.'
                    : 'Bạn có thể đăng nhập ngay bằng mật khẩu mới vừa tạo.'}
                </p>
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="w-full bg-[#cd3645] hover:bg-[#b52a38] text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm cursor-pointer"
                >
                  {isEn ? 'Back to Sign In' : 'Quay lại đăng nhập'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

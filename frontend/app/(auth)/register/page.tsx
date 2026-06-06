'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

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
      setError('Confirm password does not match');
      return;
    }

    if (!formData.email) {
      setError('Please enter email');
      return;
    }

    setSendingOtp(true);
    try {
      await api.post('/auth/send-otp', { email: formData.email });
      setShowOtpModal(true);
      setOtpValues(['', '', '', '', '', '']);
      setOtpError('');
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to send OTP code');
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
      setCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Unable to resend OTP');
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
      setOtpError('Please enter all 6 OTP digits');
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
      setOtpError(err.response?.data?.message || 'Verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pizza-cream p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 border border-pizza-card/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pizza-darkred mb-2">Create Account</h1>
          <p className="text-gray-500">Register to order easily</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="username"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pizza-red focus:border-pizza-red text-black"
              value={formData.username}
              onChange={handleChange}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pizza-red focus:border-pizza-red text-black"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              name="phone"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pizza-red focus:border-pizza-red text-black"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0912345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pizza-red focus:border-pizza-red text-black"
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pizza-red focus:border-pizza-red text-black"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="********"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || sendingOtp}
            className="w-full bg-pizza-red text-white py-2 px-4 rounded-md hover:bg-pizza-darkred focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pizza-red transition-colors mt-6 disabled:opacity-50"
          >
            {sendingOtp ? 'Sending verification code...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-pizza-red hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fadeIn">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-2xl font-light"
            >
              &times;
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-pizza-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Email Verification</h2>
              <p className="text-sm text-gray-500">
                A 6-digit verification code has been sent to
              </p>
              <p className="text-sm font-semibold text-pizza-red mt-1">{formData.email}</p>
            </div>

            {otpError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm mb-4 text-center">
                {otpError}
              </div>
            )}

            {/* 6 OTP input boxes */}
            <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-pizza-red focus:ring-2 focus:ring-pizza-red/20 outline-none transition-all text-gray-800"
                />
              ))}
            </div>

            <button
              onClick={handleVerifyAndRegister}
              disabled={otpLoading || otpValues.join('').length !== 6}
              className="w-full bg-pizza-red text-white py-3 px-4 rounded-xl font-bold hover:bg-pizza-darkred transition-colors disabled:opacity-50 mb-4"
            >
              {otpLoading ? 'Verifying...' : 'Confirm & Register'}
            </button>

            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-gray-400">
                  Resend code in <span className="font-bold text-pizza-red">{countdown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={sendingOtp}
                  className="text-sm text-pizza-red hover:underline font-semibold disabled:opacity-50"
                >
                  {sendingOtp ? 'Sending...' : 'Resend verification code'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
      setError(err.response?.data?.message || 'An error occurred while logging in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (typeof window === 'undefined') return;
    const google = (window as any).google;
    if (!google || !google.accounts || !google.accounts.oauth2) {
      setError('Google Sign-in service is currently unavailable. Please refresh or try again.');
      return;
    }

    setError('');
    const client = google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '782735287587-v1v3e5pa1qo8t3i8h36jnkftds0k3jps.apps.googleusercontent.com',
      scope: 'email profile openid',
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          setError('Google authentication failed. Please try again.');
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
          setError(err.response?.data?.message || 'An error occurred during Google sign in');
        } finally {
          setGoogleLoading(false);
        }
      },
    });
    client.requestAccessToken();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pizza-cream p-4">
      {/* Load Google Identity Services script */}
      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />

      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 border border-pizza-card/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pizza-darkred mb-2">Pizza & Pasta Inn</h1>
          <p className="text-gray-500">Sign in to continue</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pizza-red focus:border-pizza-red text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pizza-red focus:border-pizza-red text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pizza-red text-white py-2 px-4 rounded-md hover:bg-pizza-darkred focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pizza-red transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-50 focus:outline-none transition-all active:scale-[0.98] cursor-pointer shadow-sm disabled:opacity-50"
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
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
          <span className="font-semibold text-sm">
            {googleLoading ? 'Connecting to Google...' : 'Sign in with Google'}
          </span>
        </button>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-pizza-red hover:underline font-semibold">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}

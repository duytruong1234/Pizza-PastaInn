'use client';

import { useState } from 'react';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
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
      setError(err.response?.data?.message || 'An error occurred while registering');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pizza-cream p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 border border-pizza-card/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pizza-darkred mb-2">Create Account</h1>
          <p className="text-gray-500">Register to order more easily</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
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
              placeholder="••••••••"
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
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pizza-red text-white py-2 px-4 rounded-md hover:bg-pizza-darkred focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pizza-red transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-pizza-red hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

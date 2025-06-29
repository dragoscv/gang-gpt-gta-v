'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const { login, error: authError } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Call the auth context login method
      await login(formData.email, formData.password);

      setSuccessMessage('Login successful! Redirecting to dashboard...');

      // On successful login, redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error: any) {
      setErrors({
        general: error.message || 'Invalid email or password. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field-specific errors when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gang-red/20 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-10"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto h-12 w-12 bg-gradient-to-r from-gang-blue to-gang-neon rounded-full flex items-center justify-center mb-4"
          >
            <Lock className="h-6 w-6 text-white" />
          </motion.div>

          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-300">
            Sign in to your GangGPT account
          </p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-md rounded-lg p-8 shadow-xl border border-white/20"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error/Success Messages */}
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-md p-3 flex items-center space-x-2"
              >
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-400 text-sm">{errors.general}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-green-500/10 border border-green-500/20 rounded-md p-3 flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-green-400 text-sm">{successMessage}</span>
              </motion.div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-md bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${errors.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-gang-blue focus:border-gang-blue'
                    }`}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-400"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-md bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${errors.password
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-gang-blue focus:border-gang-blue'
                    }`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-400"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className="h-4 w-4 text-gang-blue focus:ring-gang-blue border-gray-600 rounded bg-white/5"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>

              <Link
                href="/auth/forgot-password"
                className="text-sm text-gang-blue hover:text-gang-blue/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-gang-blue to-gang-neon hover:from-gang-blue/90 hover:to-gang-neon/90 text-white font-medium py-3 px-4 rounded-md transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </Button>

            {/* Demo Credentials */}
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <p className="text-yellow-400 text-xs text-center">
                <strong>Demo:</strong> Use admin@ganggpt.com with any password
              </p>
            </div>
          </form>
        </motion.div>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <p className="text-gray-300">
            Don't have an account?{' '}
            <Link
              href="/auth/register"
              className="text-gang-blue hover:text-gang-blue/80 font-medium transition-colors"
            >
              Sign up here
            </Link>
          </p>

          <div className="mt-4 flex justify-center space-x-4 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/support" className="hover:text-gray-300 transition-colors">
              Support
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

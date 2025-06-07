'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/trpc'

interface FormData {
  password: string
  confirmPassword: string
}

interface FormErrors {
  password?: string
  confirmPassword?: string
  token?: string
  submit?: string
}

function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  useEffect(() => {
    const resetToken = searchParams.get('token')
    if (resetToken) {
      setToken(resetToken)
      validateToken(resetToken)
    } else {
      setErrors({ token: 'Invalid or missing reset token' })
    }
  }, [searchParams])

  const validateToken = async (token: string) => {
    try {
      // For now, we'll assume the token is valid if it exists
      // In a full implementation, you might want to add a separate endpoint to validate tokens
      setTokenValid(true)
    } catch (error) {
      setTokenValid(false)
      setErrors({ token: 'Invalid or expired reset token' })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !token) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // Call the backend resetPassword endpoint
      const response = await apiClient.post('/trpc/auth.resetPassword', {
        token: token,
        newPassword: formData.password,
      });

      if (response.result?.data) {
        setResetSuccess(true)
      }
    } catch (error: any) {
      console.error('Reset password error:', error)
      setErrors({
        submit: error.message || 'Failed to reset password. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Token validation is still loading
  if (tokenValid === null && !errors.token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-emerald-900/20 to-yellow-900/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-black/40 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-6" />
          <h1 className="text-xl font-semibold text-white mb-2">
            Verifying Reset Token
          </h1>
          <p className="text-gray-400">
            Please wait while we validate your reset link...
          </p>
        </motion.div>
      </div>
    )
  }

  // Invalid token
  if (tokenValid === false || errors.token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-emerald-900/20 to-yellow-900/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/40 backdrop-blur-md border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Invalid Reset Link
          </h1>

          <p className="text-gray-300 mb-8">
            This password reset link is invalid or has expired. Please request a new one.
          </p>

          <div className="space-y-4">
            <Link href="/auth/forgot-password">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Request New Reset Link
              </Button>
            </Link>

            <Link href="/auth/login">
              <Button variant="ghost" className="w-full text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // Password reset successful
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-emerald-900/20 to-yellow-900/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/40 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Password Reset Successfully
          </h1>

          <p className="text-gray-300 mb-8">
            Your password has been updated successfully. You can now log in with your new password.
          </p>

          <Link href="/auth/login">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              Continue to Login
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-emerald-900/20 to-yellow-900/20 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-black/40 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            Set New Password
          </h1>

          <p className="text-gray-400">
            Please enter your new password below
          </p>
        </div>

        {/* Password Reset Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full pl-12 pr-12 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.password
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-gray-600 focus:ring-emerald-500/50 focus:border-emerald-500'
                  }`}
                placeholder="Enter new password"
                disabled={isLoading}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error password-requirements' : 'password-requirements'}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p id="password-requirements" className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters with uppercase, lowercase, and number
            </p>
            {errors.password && (
              <p id="password-error" className="mt-2 text-sm text-red-400" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full pl-12 pr-12 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.confirmPassword
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-gray-600 focus:ring-emerald-500/50 focus:border-emerald-500'
                  }`}
                placeholder="Confirm new password"
                disabled={isLoading}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirm-password-error" className="mt-2 text-sm text-red-400" role="alert">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm" role="alert">
                {errors.submit}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Resetting Password...
              </>
            ) : (              <>
                <Lock className="w-5 h-5 mr-2" />
                Reset Password
              </>
            )}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Remember your password?{' '}
            <Link
              href="/auth/login"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

function ResetPasswordWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    }>
      <ResetPasswordPage />
    </Suspense>
  )
}

export default ResetPasswordWrapper

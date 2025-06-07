'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/trpc'

interface FormData {
  email: string
}

interface FormErrors {
  email?: string
  submit?: string
}

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState<FormData>({
    email: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    } setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // Call the backend forgotPassword endpoint
      const response = await apiClient.post('/trpc/auth.forgotPassword', {
        email: formData.email,
      });

      if (response.result?.data) {
        setEmailSent(true)
      }
    } catch (error: any) {
      console.error('Forgot password error:', error)
      setErrors({
        submit: error.message || 'Failed to send reset email. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setFormData({ email: value })

    // Clear email error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }))
    }
  }

  const handleResendEmail = async () => {
    setIsLoading(true)
    try {
      // Call the backend forgotPassword endpoint again
      const response = await apiClient.post('/trpc/auth.forgotPassword', {
        email: formData.email,
      });
      // Show success message or feedback
    } catch (error) {
      console.error('Resend email error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
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
            Check Your Email
          </h1>

          <p className="text-gray-300 mb-6">
            We've sent a password reset link to <span className="text-emerald-400 font-medium">{formData.email}</span>
          </p>

          <p className="text-sm text-gray-400 mb-8">
            If you don't see the email in your inbox, check your spam folder. The link will expire in 1 hour.
          </p>

          <div className="space-y-4">
            <Button
              onClick={handleResendEmail}
              disabled={isLoading}
              variant="outline"
              className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400 mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Resend Email
                </>
              )}
            </Button>

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-emerald-900/20 to-yellow-900/20 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-black/40 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full"
      >
        {/* Back to Login Link */}
        <Link
          href="/auth/login"
          className="inline-flex items-center text-gray-400 hover:text-emerald-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-emerald-400" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            Reset Password
          </h1>

          <p className="text-gray-400">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Reset Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.email
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-gray-600 focus:ring-emerald-500/50 focus:border-emerald-500'
                  }`}
                placeholder="Enter your email"
                disabled={isLoading}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                autoComplete="email"
                autoFocus
              />
            </div>
            {errors.email && (
              <p id="email-error" className="mt-2 text-sm text-red-400" role="alert">
                {errors.email}
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
                Sending Reset Link...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Reset Link
              </>
            )}
          </Button>
        </form>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 mb-4">
            Remember your password?{' '}
            <Link
              href="/auth/login"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Sign in here
            </Link>
          </p>

          <p className="text-xs text-gray-500">
            Need help? Contact our{' '}
            <Link href="/support" className="text-emerald-400 hover:text-emerald-300 underline">
              support team
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

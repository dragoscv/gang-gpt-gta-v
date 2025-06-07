'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

interface FormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
  subscribeNewsletter: boolean
}

interface FormErrors {
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
  agreeToTerms?: string
  submit?: string
}

export default function RegisterPage() {
  const { register } = useAuth()

  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    subscribeNewsletter: false
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username must be less than 20 characters'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

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

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy'
    }

    setErrors(newErrors)
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
      // Use the auth context for registration
      await register(formData.username, formData.email, formData.password)
      setRegistrationSuccess(true)
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({
        submit: error instanceof Error ? error.message : 'Registration failed. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-emerald-900/20 to-yellow-900/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/40 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Welcome to GangGPT!
          </h1>

          <p className="text-gray-300 mb-8">
            Your account has been created successfully. Please check your email to verify your account before logging in.
          </p>

          <Link href="/auth/login">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              Go to Login
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
            <UserPlus className="w-8 h-8 text-emerald-400" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            Join GangGPT
          </h1>

          <p className="text-gray-400">
            Create your account and enter the virtual world
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`w-full pl-12 pr-4 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.username
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-gray-600 focus:ring-emerald-500/50 focus:border-emerald-500'
                  }`}
                placeholder="Choose a username"
                disabled={isLoading}
                aria-invalid={errors.username ? 'true' : 'false'}
                aria-describedby={errors.username ? 'username-error' : undefined}
              />
            </div>
            {errors.username && (
              <p id="username-error" className="mt-2 text-sm text-red-400" role="alert">
                {errors.username}
              </p>
            )}
          </div>

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
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-12 pr-4 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.email
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-gray-600 focus:ring-emerald-500/50 focus:border-emerald-500'
                  }`}
                placeholder="Enter your email"
                disabled={isLoading}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="mt-2 text-sm text-red-400" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
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
                placeholder="Create a password"
                disabled={isLoading}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error password-requirements' : 'password-requirements'}
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
              Confirm Password
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
                placeholder="Confirm your password"
                disabled={isLoading}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
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

          {/* Terms Agreement */}
          <div className="space-y-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                className="mt-0.5 w-5 h-5 text-emerald-600 bg-black/50 border-gray-600 rounded focus:ring-emerald-500 focus:ring-2"
                disabled={isLoading}
                aria-invalid={errors.agreeToTerms ? 'true' : 'false'}
                aria-describedby={errors.agreeToTerms ? 'terms-error' : undefined}
              />
              <span className="text-sm text-gray-300">
                I agree to the{' '}
                <Link href="/legal/terms" className="text-emerald-400 hover:text-emerald-300 underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/legal/privacy" className="text-emerald-400 hover:text-emerald-300 underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.agreeToTerms && (
              <p id="terms-error" className="text-sm text-red-400" role="alert">
                {errors.agreeToTerms}
              </p>
            )}

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.subscribeNewsletter}
                onChange={(e) => handleInputChange('subscribeNewsletter', e.target.checked)}
                className="mt-0.5 w-5 h-5 text-emerald-600 bg-black/50 border-gray-600 rounded focus:ring-emerald-500 focus:ring-2"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-400">
                Subscribe to newsletter for updates and exclusive content
              </span>
            </label>
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
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                Create Account
              </>
            )}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
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

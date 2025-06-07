'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  const handleReset = () => {
    // Attempt to recover by trying to re-render the segment
    reset()
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-red-900/20 to-yellow-900/20 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-black/40 backdrop-blur-md border border-red-500/30 rounded-2xl p-8 max-w-lg w-full text-center"
      >
        {/* Error Icon */}
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Something went wrong!
        </h1>

        <p className="text-gray-300 mb-2">
          We're sorry, but something unexpected happened.
        </p>

        <p className="text-sm text-gray-400 mb-8">
          Don't worry, our team has been notified and we're working to fix this issue.
        </p>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-8 text-left">
            <h3 className="text-red-400 font-medium mb-2">Development Error Details:</h3>
            <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
              {error.message}
            </pre>
            {error.digest && (
              <p className="text-xs text-gray-400 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleReset}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <Button
              onClick={handleReload}
              variant="outline"
              className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/" className="flex-1">
              <Button
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>

            <Button
              onClick={() => window.history.back()}
              variant="ghost"
              className="flex-1 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>

        {/* Support Information */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-2">
            Still having issues?
          </p>
          <Link
            href="/support"
            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { Search, Home, ArrowLeft, Map } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-purple-900/20 to-yellow-900/20 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-2xl p-8 max-w-lg w-full text-center"
      >
        {/* 404 Animation */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 100
          }}
          className="mb-8"
        >
          <div className="text-8xl font-bold bg-gradient-to-r from-purple-400 to-yellow-400 bg-clip-text text-transparent mb-4">
            404
          </div>

          <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
            <Map className="w-10 h-10 text-purple-400" />
          </div>
        </motion.div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Page Not Found
        </h1>

        <p className="text-gray-300 mb-2">
          Looks like you've ventured into uncharted territory in Los Santos.
        </p>

        <p className="text-sm text-gray-400 mb-8">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        {/* Search Suggestion */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-white font-medium mb-2">
            Looking for something specific?
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Try navigating to one of these popular sections:
          </p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link
              href="/dashboard"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              • Dashboard
            </Link>
            <Link
              href="/factions"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              • Factions
            </Link>
            <Link
              href="/companions"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              • AI Companions
            </Link>
            <Link
              href="/settings"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              • Settings
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/" className="flex-1">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>

            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>

        {/* Gaming-themed Easter Egg */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-2">
            🎮 Easter Egg Unlocked: "Lost in Los Santos"
          </p>
          <p className="text-xs text-gray-400">
            Achievement: Found a page that doesn't exist
          </p>
        </div>
      </motion.div>
    </div>
  )
}

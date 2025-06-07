'use client'

import { motion } from 'framer-motion'
import { Shield, ArrowLeft, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-blue-900/20 to-yellow-900/20">
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-10" />

      <div className="relative max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8 mb-8"
        >
          <Link
            href="/auth/register"
            className="inline-flex items-center text-gray-400 hover:text-blue-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration
          </Link>

          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
              <div className="flex items-center text-sm text-gray-400 mt-1">
                <Calendar className="w-4 h-4 mr-2" />
                Last updated: June 1, 2025
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8 prose prose-invert max-w-none"
        >
          <div className="text-gray-300 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using GangGPT ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Game Service Description</h2>
              <p>
                GangGPT is an AI-powered multiplayer modification for Grand Theft Auto V, providing enhanced roleplay experiences through:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>AI-driven non-player characters (NPCs) with dynamic personalities</li>
                <li>Procedurally generated missions and storylines</li>
                <li>Intelligent faction systems and territorial control</li>
                <li>AI companions with persistent memory</li>
                <li>Real-time language translation and communication</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts and Registration</h2>
              <p>
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Be responsible for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use Policy</h2>
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Use exploits, hacks, or unauthorized third-party software</li>
                <li>Share or distribute inappropriate content</li>
                <li>Attempt to disrupt or compromise the Service</li>
                <li>Create multiple accounts to circumvent restrictions</li>
                <li>Engage in real-money trading of virtual items</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. AI Content and Interactions</h2>
              <p>
                GangGPT utilizes artificial intelligence to generate content and interactions. You understand that:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>AI-generated content may not always be accurate or appropriate</li>
                <li>We implement content filtering but cannot guarantee complete control</li>
                <li>AI responses are based on patterns and training data, not human judgment</li>
                <li>You should report any problematic AI behavior immediately</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Virtual Economy and Purchases</h2>
              <p>
                The Service may include virtual currencies and items. You acknowledge that:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Virtual items have no real-world value</li>
                <li>We reserve the right to modify the virtual economy</li>
                <li>Purchases are final unless otherwise specified</li>
                <li>Account suspension may result in loss of virtual items</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are owned by GangGPT and are protected by
                international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice,
                for conduct that we believe violates these Terms or is harmful to other users of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Disclaimers and Limitation of Liability</h2>
              <p>
                The Service is provided "as is" without warranties of any kind. We shall not be liable for any damages
                arising from your use of the Service, including but not limited to direct, indirect, incidental, or
                consequential damages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of significant changes
                via email or through the Service. Continued use after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                <p className="text-blue-400 font-medium">Email: legal@ganggpt.com</p>
                <p className="text-blue-400 font-medium">Discord: GangGPT Official Server</p>
                <p className="text-blue-400 font-medium">Website: https://ganggpt.com/support</p>
              </div>
            </section>
          </div>
        </motion.div>

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/auth/register">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Shield className="w-4 h-4 mr-2" />
              Accept & Continue Registration
            </Button>
          </Link>

          <Link href="/legal/privacy">
            <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
              View Privacy Policy
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

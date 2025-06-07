'use client'

import { motion } from 'framer-motion'
import { Shield, ArrowLeft, Calendar, Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-green-900/20 to-yellow-900/20">
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-10" />

      <div className="relative max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-black/40 backdrop-blur-md border border-green-500/30 rounded-2xl p-8 mb-8"
        >
          <Link
            href="/auth/register"
            className="inline-flex items-center text-gray-400 hover:text-green-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration
          </Link>

          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
              <Lock className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
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
          className="bg-black/40 backdrop-blur-md border border-green-500/30 rounded-2xl p-8 prose prose-invert max-w-none"
        >
          <div className="text-gray-300 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
              <p>
                We collect information to provide better services to our users. The types of information we collect include:
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Account Information</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Username and email address</li>
                <li>Password (encrypted and hashed)</li>
                <li>Profile information and preferences</li>
                <li>Language and region settings</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Gaming Data</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Character progression and statistics</li>
                <li>In-game interactions and chat logs</li>
                <li>AI companion interactions and preferences</li>
                <li>Faction membership and activities</li>
                <li>Mission completion data</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Technical Information</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Connection timestamps and session duration</li>
                <li>Performance metrics and error logs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
              <p>
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Provide and maintain the GangGPT service</li>
                <li>Personalize your gaming experience</li>
                <li>Improve AI interactions and responses</li>
                <li>Ensure fair play and prevent cheating</li>
                <li>Communicate important updates and changes</li>
                <li>Provide customer support</li>
                <li>Analyze usage patterns to improve our service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. AI Data Processing</h2>
              <p>
                GangGPT uses artificial intelligence to enhance gameplay. Regarding AI processing:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Chat messages may be processed by AI to generate responses</li>
                <li>Interaction patterns help improve AI behavior</li>
                <li>AI memory systems store contextual information for continuity</li>
                <li>Personal data is anonymized before AI training</li>
                <li>AI processing occurs on secure, encrypted servers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share information in these limited circumstances:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With service providers under strict confidentiality agreements</li>
                <li>In case of business transfer (with prior notice)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>End-to-end encryption for sensitive data</li>
                <li>Secure HTTPS connections for all communications</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and employee training</li>
                <li>Automated threat detection and response</li>
                <li>Regular data backups and disaster recovery plans</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Data Retention</h2>
              <p>
                We retain your information for as long as necessary to provide our services:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Account data: Until account deletion</li>
                <li>Game progress: Until account deletion or 2 years of inactivity</li>
                <li>Chat logs: 90 days for moderation purposes</li>
                <li>AI training data: Anonymized and retained indefinitely</li>
                <li>Legal compliance data: As required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights</h2>
              <p>
                Depending on your location, you may have the following rights regarding your personal data:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of certain data processing</li>
                <li>Lodge a complaint with data protection authorities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Remember your login status and preferences</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Provide personalized content and advertisements</li>
                <li>Ensure website security and prevent fraud</li>
              </ul>
              <p className="mt-4">
                You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
              <p>
                GangGPT is not intended for children under 18. We do not knowingly collect personal information from
                children under 18. If we become aware that we have collected such information, we will take steps to
                delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. We ensure
                appropriate safeguards are in place to protect your information during such transfers, including:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Standard contractual clauses approved by data protection authorities</li>
                <li>Adequacy decisions for countries with suitable protection levels</li>
                <li>Certification under recognized privacy frameworks</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Posting the updated policy on our website</li>
                <li>Sending email notifications to registered users</li>
                <li>Displaying prominent notices within the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
                <p className="text-green-400 font-medium">Email: privacy@ganggpt.com</p>
                <p className="text-green-400 font-medium">Data Protection Officer: dpo@ganggpt.com</p>
                <p className="text-green-400 font-medium">Discord: GangGPT Official Server</p>
                <p className="text-green-400 font-medium">Website: https://ganggpt.com/privacy</p>
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
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Shield className="w-4 h-4 mr-2" />
              Accept & Continue Registration
            </Button>
          </Link>

          <Link href="/legal/terms">
            <Button variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10">
              View Terms of Service
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

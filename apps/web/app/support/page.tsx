'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MessageCircle,
  Mail,
  Book,
  Search,
  ArrowLeft,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Send,
  Bot,
  Users,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface FAQ {
  id: string
  question: string
  answer: string
  category: 'account' | 'gameplay' | 'technical' | 'ai' | 'payment'
}

const faqs: FAQ[] = [
  {
    id: '1',
    category: 'account',
    question: 'How do I create an account?',
    answer: 'Click the "Register" button on the login page and fill out the required information. You\'ll need a valid email address and a password that meets our security requirements.'
  },
  {
    id: '2',
    category: 'account',
    question: 'I forgot my password. How can I reset it?',
    answer: 'On the login page, click "Forgot Password" and enter your email address. We\'ll send you a secure link to reset your password.'
  },
  {
    id: '3',
    category: 'gameplay',
    question: 'How do AI companions work?',
    answer: 'AI companions are intelligent NPCs that remember your interactions and develop unique personalities. They can assist with missions, provide advice, and evolve based on your gameplay style.'
  },
  {
    id: '4',
    category: 'gameplay',
    question: 'What are factions and how do I join one?',
    answer: 'Factions are player groups with AI-driven dynamics. You can join through invitations, recruitment missions, or by proving yourself worthy through gameplay actions.'
  },
  {
    id: '5',
    category: 'technical',
    question: 'What are the system requirements?',
    answer: 'You need Grand Theft Auto V (Steam/Epic/Rockstar), RAGE:MP installed, a stable internet connection, and at least 8GB RAM recommended for optimal AI features.'
  },
  {
    id: '6',
    category: 'ai',
    question: 'Is the AI content safe and moderated?',
    answer: 'Yes, we implement comprehensive content filtering and moderation systems. All AI interactions are monitored and filtered to ensure appropriate content.'
  },
  {
    id: '7',
    category: 'payment',
    question: 'What payment methods do you accept?',
    answer: 'We accept major credit cards, PayPal, and various regional payment methods. All transactions are secured with industry-standard encryption.'
  }
]

const categories = [
  { id: 'all', label: 'All Questions', icon: Book },
  { id: 'account', label: 'Account & Login', icon: Users },
  { id: 'gameplay', label: 'Gameplay', icon: Bot },
  { id: 'technical', label: 'Technical', icon: AlertCircle },
  { id: 'ai', label: 'AI Features', icon: Bot },
  { id: 'payment', label: 'Payments', icon: MessageCircle }
]

export default function SupportPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Mock contact form submission
      // In production, this would send the form data to a backend endpoint
      console.log('Contact form submitted:', contactForm)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      alert('Message sent successfully! We\'ll get back to you soon.')
      setContactForm({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      console.error('Contact form error:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-blue-900/20 to-yellow-900/20">
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-10" />

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8 mb-8 text-center"
        >
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-blue-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-white mb-4">Support Center</h1>
          <p className="text-gray-300 text-lg mb-6">
            Get help with GangGPT and find answers to common questions
          </p>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="https://discord.gg/ganggpt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <MessageCircle className="w-6 h-6 text-blue-400 mr-3" />
              <div className="text-left">
                <h3 className="text-white font-medium">Discord Community</h3>
                <p className="text-gray-400 text-sm">Join our server for real-time help</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-2" />
            </a>

            <a
              href="https://docs.ganggpt.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-4 bg-green-500/20 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
            >
              <Book className="w-6 h-6 text-green-400 mr-3" />
              <div className="text-left">
                <h3 className="text-white font-medium">Documentation</h3>
                <p className="text-gray-400 text-sm">Comprehensive guides and tutorials</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-2" />
            </a>

            <div className="flex items-center justify-center p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <Mail className="w-6 h-6 text-yellow-400 mr-3" />
              <div className="text-left">
                <h3 className="text-white font-medium">Email Support</h3>
                <p className="text-gray-400 text-sm">support@ganggpt.com</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category.label}
                </button>
              )
            })}
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <div key={faq.id} className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors"
                >
                  <span className="text-white font-medium">{faq.question}</span>
                  {expandedFAQ === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedFAQ === faq.id && (
                  <div className="p-4 bg-gray-800/30 border-t border-gray-700">
                    <p className="text-gray-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No FAQs found matching your search.</p>
            </div>
          )}
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Contact Support</h2>
          <p className="text-gray-300 mb-6">
            Can't find what you're looking for? Send us a message and we'll get back to you within 24 hours.
          </p>

          <form onSubmit={handleContactSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                required
                value={contactForm.subject}
                onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                placeholder="Brief description of your issue"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={contactForm.message}
                onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
                placeholder="Please provide as much detail as possible about your issue..."
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Sending Message...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

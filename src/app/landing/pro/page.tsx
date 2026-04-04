'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GymLanding() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [gymName, setGymName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to early adopter signup
    router.push(`/auth/signup?type=gym&email=${encodeURIComponent(email)}&gym=${encodeURIComponent(gymName)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-700 to-indigo-600 rounded-lg"></div>
                  <span className="ml-2 text-xl font-bold text-gray-900">APEX Fit</span>
                  <span className="ml-1 text-xl font-semibold text-blue-700">Pro</span>
                </div>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <Link href="/landing/personal" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    For Trainers
                  </Link>
                  <Link href="/landing/pro" className="text-gray-900 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                    For Gyms
                  </Link>
                  <Link href="/features/gym" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Features
                  </Link>
                  <Link href="/pricing/gym" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Pricing
                  </Link>
                  <Link href="/early-adopter" className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium bg-blue-50">
                    🚀 Early Adopter
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <button
                onClick={() => router.push('/early-adopter')}
                className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
              >
                Join Early Adopter Program
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-6">
                🚀 Early Adopter Program • 50% Off First Year
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Gym Management That
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">
                  Pays for Itself in 60 Days
                </span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-2xl">
                The complete platform for gym owners to manage members, track revenue, and grow your business with enterprise-grade tools at small business prices.
              </p>
              <div className="mt-10">
                <form onSubmit={handleSubmit} className="max-w-md">
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={gymName}
                      onChange={(e) => setGymName(e.target.value)}
                      placeholder="Your gym name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
                    >
                      Apply for Early Adopter Program
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">
                    Limited to first 100 gyms • 50% discount for first year • Priority support
                  </p>
                </form>
              </div>
            </div>
            <div className="mt-12 lg:mt-0">
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Revenue Dashboard</h3>
                        <p className="text-gray-600 text-sm">Track MRR, member growth, and profitability in real-time</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Member Management</h3>
                        <p className="text-gray-600 text-sm">Track capacity, automate billing, and reduce churn</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Trainer Network</h3>
                        <p className="text-gray-600 text-sm">Connect with certified trainers and grow your offerings</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Enterprise-Grade Features at Small Business Prices</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to run a modern, profitable gym in one platform
            </p>
          </div>
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Revenue Intelligence</h3>
              <p className="mt-3 text-gray-600">
                Track MRR, member growth, and profitability with our advanced revenue dashboard. Make data-driven decisions.
              </p>
              <div className="mt-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Unique Feature
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-2xl border border-indigo-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Capacity Management</h3>
              <p className="mt-3 text-gray-600">
                Add members up to your paid capacity. Automatic alerts when nearing limits. Perfect for growth planning.
              </p>
              <div className="mt-4">
                <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Core Feature
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Trainer Network</h3>
              <p className="mt-3 text-gray-600">
                Access certified trainers, manage schedules, and offer diverse classes. Grow your offerings without hiring.
              </p>
              <div className="mt-4">
                <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Network Effect
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Comparison */}
      <div className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose APEX Fit Pro?</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Compare us to the competition
            </p>
          </div>
          <div className="mt-12 overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl shadow-lg">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Feature</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900 bg-blue-50">APEX Fit Pro</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Mindbody</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Glofox</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-sm text-gray-700">Revenue Dashboard</td>
                  <td className="py-4 px-6 text-sm font-medium text-green-600 bg-blue-50">✅ Included</td>
                  <td className="py-4 px-6 text-sm text-gray-600">❌ Extra $200/month</td>
                  <td className="py-4 px-6 text-sm text-gray-600">❌ Not available</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-sm text-gray-700">Capacity Management</td>
                  <td className="py-4 px-6 text-sm font-medium text-green-600 bg-blue-50">✅ Core feature</td>
                  <td className="py-4 px-6 text-sm text-gray-600">⚠️ Basic only</td>
                  <td className="py-4 px-6 text-sm text-gray-600">⚠️ Limited</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-sm text-gray-700">Trainer Network</td>
                  <td className="py-4 px-6 text-sm font-medium text-green-600 bg-blue-50">✅ 5,000+ trainers</td>
                  <td className="py-4 px-6 text-sm text-gray-600">❌ Separate platform</td>
                  <td className="py-4 px-6 text-sm text-gray-600">❌ Not available</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-sm text-gray-700">Member Management</td>
                  <td className="py-4 px-6 text-sm font-medium text-green-600 bg-blue-50">✅ Unlimited</td>
                  <td className="py-4 px-6 text-sm text-gray-600">✅ Up to limits</td>
                  <td className="py-4 px-6 text-sm text-gray-600">✅ Up to limits</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-sm text-gray-700">Starting Price</td>
                  <td className="py-4 px-6 text-sm font-bold text-gray-900 bg-blue-50">$199/month*</td>
                  <td className="py-4 px-6 text-sm text-gray-600">$129/month</td>
                  <td className="py-4 px-6 text-sm text-gray-600">$89/month</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-sm text-gray-700">Value Score</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                      </div>
                      <span className="ml-2 text-sm font-bold text-gray-900">9.5/10</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-600">7.0/10</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-600">6.5/10</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-sm text-gray-500 text-center">
              *Early adopter pricing: $99/month for first year (50% off)
            </p>
          </div>
        </div>
      </div>

      {/* Early Adopter CTA */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-white/20 text-white mb-6">
            🚀 LIMITED TIME OFFER
          </div>
          <h2 className="text-3xl font-bold text-white">Join Our Early Adopter Program</h2>
          <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
            Be among the first 100 gyms to get 50% off for your first year, plus priority support and influence on our roadmap.
          </p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white">50% Off</div>
              <p className="mt-2 text-blue-100">First year pricing</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white">Priority Support</div>
              <p className="mt-2 text-blue-100">Direct access to our team</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white">Influence Roadmap</div>
              <p className="mt-2 text-blue-100">Help shape future features</p>
            </div>
          </div>
          <div className="mt-10">
            <button
              onClick={() => router.push('/early-adopter')}
              className="bg-white text-blue-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition"
            >
              Apply for Early Adopter Program
            </button>
            <p className="mt-4 text-blue-100">
              Limited to first 100 gyms • Applications reviewed within 24 hours
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-700 to-indigo-600 rounded-lg"></div>
              <span className="ml-2 text-xl font-bold">APEX Fit</span>
              <span className="ml-1 text-xl font-semibold text-blue-400">Pro</span>
            </div>
            <div className="mt-6 md:mt-0">
              <p className="text-gray-400">
                © 2026 APEX Fit. All rights reserved.
              </p>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="flex space-x-6">
                <Link href="/privacy" className="text-gray-400 hover:text-white">
                  Privacy
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-white">
                  Terms
                </Link>
                <Link href="/contact" className="text-gray-400 hover:text-white">
                  Contact
                </Link>
                <Link href="/early-adopter" className="text-blue-400 hover:text-blue-300">
                  🚀 Early Adopter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
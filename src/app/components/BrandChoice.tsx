'use client';

import { useRouter } from 'next/navigation';

export default function BrandChoice() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-600 to-emerald-500 text-white mb-6">
            🎯 CHOOSE YOUR APEX FIT EXPERIENCE
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            One Platform, Two Powerful Solutions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            APEX Fit offers specialized solutions for both personal trainers and gym owners. Choose the experience that fits your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Trainer Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-400 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">PT</span>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold text-white">APEX Fit</h2>
                    <p className="text-blue-100 font-semibold">Personal</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm">Starting at</div>
                  <div className="text-2xl font-bold text-white">$49<span className="text-lg">/month</span></div>
                </div>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">For Personal Trainers & Coaches</h3>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Client management & progress tracking</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Workout & meal plan creation</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Revenue tracking & business analytics</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Access to gym network for client referrals</span>
                </li>
              </ul>
              <button
                onClick={() => router.push('/landing/personal')}
                className="w-full bg-gradient-to-r from-blue-500 to-emerald-400 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Explore APEX Fit Personal
              </button>
              <p className="text-center text-sm text-gray-500 mt-3">
                Perfect for solo trainers & small studios
              </p>
            </div>
          </div>

          {/* Gym Owner Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-transparent hover:border-blue-700 transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-600 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">GYM</span>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold text-white">APEX Fit</h2>
                    <p className="text-blue-200 font-semibold">Pro</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm">Starting at</div>
                  <div className="text-2xl font-bold text-white">$199<span className="text-lg">/month</span></div>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-500 text-white mb-4">
                🚀 EARLY ADOPTER: 50% OFF FIRST YEAR
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">For Gym Owners & Managers</h3>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Complete member management & billing</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Advanced revenue dashboard & analytics</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Capacity tracking & growth planning</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Access to certified trainer network</span>
                </li>
              </ul>
              <button
                onClick={() => router.push('/landing/pro')}
                className="w-full bg-gradient-to-r from-blue-700 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Explore APEX Fit Pro
              </button>
              <p className="text-center text-sm text-gray-500 mt-3">
                Perfect for gyms, studios & fitness centers
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Both solutions share the same powerful platform with specialized features for your needs.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Not sure which is right for you? <button className="text-blue-600 hover:text-blue-800 font-medium">Contact our team</button>
          </p>
        </div>
      </div>
    </div>
  );
}
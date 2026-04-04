'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EarlyAdopterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    gymName: '',
    contactName: '',
    email: '',
    phone: '',
    gymType: '',
    memberCount: '',
    currentSoftware: '',
    goals: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      
      // In production, this would make an API call to save the application
      console.log('Early adopter application:', formData);
      
      // Redirect to thank you page after 3 seconds
      setTimeout(() => {
        router.push('/early-adopter/thank-you');
      }, 3000);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Received!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for applying to our Early Adopter Program. Our team will review your application and contact you within 24 hours.
          </p>
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Next steps:</strong> Check your email for a confirmation and schedule a 15-minute onboarding call.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
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
            </div>
            <div className="flex items-center">
              <Link
                href="/landing/pro"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                ← Back to Gym Landing
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white mb-6">
            🚀 EARLY ADOPTER PROGRAM
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Join the Future of Gym Management
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Be among the first 100 gyms to experience APEX Fit Pro and get exclusive benefits
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Benefits Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Program Benefits</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">50% Off First Year</h3>
                    <p className="text-sm text-gray-600">Lock in discounted pricing forever</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Priority Support</h3>
                    <p className="text-sm text-gray-600">Direct access to our development team</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Influence Roadmap</h3>
                    <p className="text-sm text-gray-600">Help shape future features</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Featured Case Study</h3>
                    <p className="text-sm text-gray-600">Get featured in our marketing</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">$99<span className="text-lg text-gray-600">/month</span></div>
                  <p className="text-sm text-gray-600 mt-1">First year pricing (50% off)</p>
                  <p className="text-xs text-gray-500 mt-2">Regular price: $199/month</p>
                </div>
              </div>

              <div className="mt-6 bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Limited spots:</strong> Only 100 gyms will be accepted into the program.
                </p>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Application Form</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gym Name *
                    </label>
                    <input
                      type="text"
                      name="gymName"
                      value={formData.gymName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Peak Performance Gym"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="you@gym.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+61 400 000 000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gym Type *
                    </label>
                    <select
                      name="gymType"
                      value={formData.gymType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select type</option>
                      <option value="boutique">Boutique Fitness</option>
                      <option value="crossfit">CrossFit Box</option>
                      <option value="commercial">Commercial Gym</option>
                      <option value="studio">Yoga/Pilates Studio</option>
                      <option value="pt_studio">Personal Training Studio</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Member Count *
                    </label>
                    <select
                      name="memberCount"
                      value={formData.memberCount}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select range</option>
                      <option value="1-50">1-50 members</option>
                      <option value="51-200">51-200 members</option>
                      <option value="201-500">201-500 members</option>
                      <option value="501-1000">501-1,000 members</option>
                      <option value="1000+">1,000+ members</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Software (if any)
                  </label>
                  <input
                    type="text"
                    name="currentSoftware"
                    value={formData.currentSoftware}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Mindbody, Glofox, custom spreadsheet"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What are your main goals for a gym management system? *
                  </label>
                  <textarea
                    name="goals"
                    value={formData.goals}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Reduce admin time, increase member retention, track revenue better..."
                    required
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-1 mr-3"
                      required
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700">
                      I understand that this is an early adopter program and there may be occasional bugs or missing features. I'm excited to help shape the product and provide feedback to make it better for everyone.
                    </label>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-700 to-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Processing Application...
                      </div>
                    ) : (
                      'Apply for Early Adopter Program'
                    )}
                  </button>
                  <p className="mt-3 text-sm text-gray-500 text-center">
                    Applications reviewed within 24 hours. No credit card required.
                  </p>
                </div>
              </form>
            </div>

            {/* FAQ */}
            <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">How long is the early adopter pricing locked in?</h3>
                  <p className="text-gray-600">The 50% discount applies for your first 12 months. After that, you'll transition to the regular pricing but will always receive a 10% loyalty discount.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">What happens after I apply?</h3>
                  <p className="text-gray-600">Our team will review your application within 24 hours. If accepted, we'll schedule a 15-minute onboarding call and set up your account.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Is there a contract?</h3>
                  <p className="text-gray-600">No long-term contract required. You can cancel anytime with 30 days notice.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">What features are available now?</h3>
                  <p className="text-gray-600">All core gym management features are ready: member management, revenue dashboard, capacity tracking, and basic reporting. We're actively developing additional features based on early adopter feedback.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
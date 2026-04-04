'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Simple gym manager dashboard using existing schema
export default function GymManagerDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Fetch gym dashboard data
      const response = await fetch('/api/gym/dashboard');
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('You do not have gym manager access');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = () => {
    // Navigate to add client page
    router.push('/gym/clients/add');
  };

  const handleViewClients = () => {
    router.push('/gym/clients');
  };

  const handleManageSubscription = () => {
    router.push('/gym/subscription');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading gym dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">Access Denied</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { gym, manager, capacity, subscription, stats, recentActivity, team, quickActions } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gym Manager Dashboard</h1>
              <p className="text-gray-600">Welcome back, {manager.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">{gym.name}</p>
                <p className="text-xs text-gray-500">Subscription: {subscription.tier}</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {manager.name?.charAt(0) || 'G'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Capacity Alert */}
        {capacity.status !== 'good' && (
          <div className={`mb-6 p-4 rounded-lg ${
            capacity.status === 'critical' ? 'bg-red-50 border border-red-200' :
            capacity.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${
                capacity.status === 'critical' ? 'text-red-400' :
                capacity.status === 'warning' ? 'text-yellow-400' :
                'text-blue-400'
              }`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  capacity.status === 'critical' ? 'text-red-800' :
                  capacity.status === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {capacity.status === 'critical' ? 'Capacity Full' :
                   capacity.status === 'warning' ? 'Capacity Warning' :
                   'Capacity Notice'}
                </h3>
                <div className="mt-2 text-sm">
                  <p className={
                    capacity.status === 'critical' ? 'text-red-700' :
                    capacity.status === 'warning' ? 'text-yellow-700' :
                    'text-blue-700'
                  }>
                    You have {capacity.current}/{capacity.max} clients ({capacity.percentage}% capacity).
                    {capacity.status === 'critical' && ' You cannot add more clients.'}
                    {capacity.status === 'warning' && ' Consider upgrading your subscription.'}
                  </p>
                </div>
                {capacity.status !== 'critical' && (
                  <div className="mt-2">
                    <button
                      onClick={handleManageSubscription}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Upgrade subscription →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalClients}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Capacity</span>
                <span className="font-medium">{capacity.percentage}%</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    capacity.status === 'critical' ? 'bg-red-600' :
                    capacity.status === 'warning' ? 'bg-yellow-600' :
                    capacity.status === 'notice' ? 'bg-blue-600' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(capacity.percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active PTs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activePTs}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">Managing your gym team</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Fee</p>
                <p className="text-2xl font-semibold text-gray-900">${subscription.monthlyFee}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">Next billing: {subscription.nextBillingDate}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New This Week</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.newClientsThisWeek}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">Client growth</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleAddClient}
              disabled={capacity.status === 'critical'}
              className={`bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition ${
                capacity.status === 'critical' ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'
              }`}
            >
              <div className="flex items-center mb-3">
                <div className="bg-blue-100 rounded-md p-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-medium text-gray-900">Add New Client</h3>
              <p className="text-sm text-gray-600 mt-1">Add a client to your gym</p>
              {capacity.status === 'critical' && (
                <p className="text-sm text-red-600 mt-2">Capacity full - upgrade needed</p>
              )}
            </button>

            <button
              onClick={handleViewClients}
              className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition hover:border-blue-300"
            >
              <div className="flex items-center mb-3">
                <div className="bg-green-100 rounded-md p-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-medium text-gray-900">View All Clients</h3>
              <p className="text-sm text-gray-600 mt-1">Manage your gym clients</p>
            </button>

            <button
              onClick={() => router.push('/gym/team')}
              className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition hover:border-blue-300"
            >
              <div className="flex items-center mb-3">
                <div className="bg-purple-100 rounded-md p-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-medium text-gray-900">Manage Team</h3>
              <p className="text-sm text-gray-600 mt-1">Add or remove personal trainers</p>
            </button>

            <button
              onClick={handleManageSubscription}
              className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition hover:border-blue-300"
            >
              <div className="flex items-center mb-3">
                <div className="bg-orange-100 rounded-md p-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-medium text-gray-900">Billing & Subscription</h3>
              <p className="text-sm text-gray-600 mt-1">View and manage your subscription</p>
            </button>
          </div>
        </div>

        {/* Recent Activity & Team */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Clients */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Clients</h2>
            </div>
            <div className="p-6">
              {recentActivity.newClients.length > 0 ? (
                <ul className="space-y-4">
                  {recentActivity.newClients.map((client: any) => (
                    <li key={client.id} className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {client.name?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{client.name || 'New Client'}</p>
                        <p className="text-sm text-gray-600">{client.email}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(client.joined).toLocaleDateString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent clients</p>
              )}
              <div className="mt-6">
                <button
                  onClick={handleViewClients}
                  className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View all clients →
                </button>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
            </div>
            <div className="p-6">
              {team.pts.length > 0 ? (
                <ul className="space-y-4">
                  {team.pts.map((pt: any) => (
                    <li key={pt.id} className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {pt.name?.charAt(0) || 'P'}
                        </span>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-900">{pt.name || 'Personal Trainer'}</p>
                        <p className="text-sm text-gray-600">{pt.email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          pt.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pt.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{pt.maxClients} max clients</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-4">No team members yet</p>
              )}
              <div className="mt-6">
                <button
                  onClick={() => router.push('/gym/team')}
                  className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Manage team →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Subscription Details</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{subscription.tier} Plan</h3>
                <p className="text-gray-600">${subscription.monthlyFee}/month</p>
                <p className="text-sm text-gray-500 mt-2">
                  Capacity: {capacity.current}/{capacity.max} clients
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Next billing date</p>
                <p className="text-lg font-semibold text-gray-900">{subscription.nextBillingDate}</p>
                <button
                  onClick={handleManageSubscription}
                  className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition text-sm"
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
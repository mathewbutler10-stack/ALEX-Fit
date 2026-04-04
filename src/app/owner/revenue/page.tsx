'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function OwnerRevenueDashboard() {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchRevenueData();
    fetchForecastData();
  }, [period]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Fetch revenue data
      const response = await fetch(`/api/owner/revenue?period=${period}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Owner access required');
          return;
        }
        throw new Error('Failed to fetch revenue data');
      }

      const data = await response.json();
      setRevenueData(data);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchForecastData = async () => {
    try {
      const response = await fetch('/api/owner/revenue/forecast');
      if (response.ok) {
        const data = await response.json();
        setForecastData(data);
      }
    } catch (err) {
      console.error('Error fetching forecast:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading revenue dashboard...</p>
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

  if (!revenueData) {
    return null;
  }

  const { overview, revenueBreakdown, growthMetrics, financialMetrics, alerts, recommendations } = revenueData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Revenue Oversight Dashboard</h1>
              <p className="text-gray-600">Platform financial analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="day">Last 24 Hours</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
              <button
                onClick={fetchRevenueData}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-4">
            {alerts.map((alert: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${
                    alert.severity === 'warning' ? 'text-yellow-400' :
                    alert.severity === 'critical' ? 'text-red-400' :
                    'text-blue-400'
                  }`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      alert.severity === 'warning' ? 'text-yellow-800' :
                      alert.severity === 'critical' ? 'text-red-800' :
                      'text-blue-800'
                    }`}>
                      {alert.title}
                    </h3>
                    <div className="mt-2 text-sm">
                      <p className={
                        alert.severity === 'warning' ? 'text-yellow-700' :
                        alert.severity === 'critical' ? 'text-red-700' :
                        'text-blue-700'
                      }>
                        {alert.message}
                      </p>
                    </div>
                    {alert.suggestion && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Suggestion: {alert.suggestion}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Estimated MRR</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(overview.estimatedMRR)}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">Monthly Recurring Revenue</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Gyms</p>
                <p className="text-2xl font-semibold text-gray-900">{overview.activeGyms}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Activation Rate</span>
                <span className="font-medium">{overview.gymActivationRate}%</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-green-600"
                  style={{ width: `${overview.gymActivationRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-2xl font-semibold text-gray-900">{overview.activeClients}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">Across all gyms</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Revenue/Gym</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(revenueBreakdown.averagePerGym)}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">Monthly average</p>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown & Growth Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue by Tier */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Revenue by Tier</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(revenueBreakdown.byTier).map(([tier, data]: [string, any]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-3 ${
                        tier === 'pro' ? 'bg-purple-500' :
                        tier === 'growth' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{tier}</p>
                        <p className="text-sm text-gray-600">{data.count} gyms</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(data.revenue)}</p>
                      <p className="text-sm text-gray-600">
                        {revenueBreakdown.total > 0 ? Math.round((data.revenue / revenueBreakdown.total) * 100) : 0}% of total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-gray-900">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(revenueBreakdown.total)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Metrics */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Growth Metrics</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700">New Gyms</p>
                    <p className="text-lg font-semibold text-green-600">+{growthMetrics.newGyms}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-600"
                      style={{ width: `${Math.min(growthMetrics.newGyms * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700">New Clients</p>
                    <p className="text-lg font-semibold text-blue-600">+{growthMetrics.newClients}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${Math.min(growthMetrics.newClients / 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700">Churn Rate</p>
                    <p className={`text-lg font-semibold ${
                      growthMetrics.churnRate > 10 ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {growthMetrics.churnRate}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        growthMetrics.churnRate > 10 ? 'bg-red-600' : 'bg-yellow-600'
                      }`}
                      style={{ width: `${Math.min(growthMetrics.churnRate, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700">Net Growth</p>
                    <p className={`text-lg font-semibold ${
                      growthMetrics.netGrowth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {growthMetrics.netGrowth > 0 ? '+' : ''}{growthMetrics.netGrowth}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        growthMetrics.netGrowth > 0 ? 'bg-green-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(Math.abs(growthMetrics.netGrowth) * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Metrics & Top Performing Gyms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Financial Metrics */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Financial Metrics</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700">Customer Lifetime Value</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(financialMetrics.customerLifetimeValue)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700">Acquisition Cost</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(financialMetrics.customerAcquisitionCost)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700">ROI</p>
                  <p className={`font-semibold ${
                    financialMetrics.roi > 100 ? 'text-green-600' :
                    financialMetrics.roi > 0 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {financialMetrics.roi}%
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700">Payback Period</p>
                  <p className="font-semibold text-gray-900">{financialMetrics.paybackPeriod} months</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {financialMetrics.roi > 100 ? 'Excellent ROI' :
                   financialMetrics.roi > 0 ? 'Positive ROI' :
                   'Negative ROI - review acquisition costs'}
                </p>
              </div>
            </div>
          </div>

          {/* Top Performing Gyms */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Performing Gyms</h2>
            </div>
            <div className="p-6">
              {revenueBreakdown.topPerformingGyms.length > 0 ? (
                <div className="space-y-4">
                  {revenueBreakdown.topPerformingGyms.slice(0, 5).map((gym: any, index: number) => (
                    <div key={gym.gymId} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">{index + 1}</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{gym.gymName}</p>
                          <p className="text-xs text-gray-500 capitalize">{gym.tier} tier</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(gym.revenue)}</p>
                        <p className="text-xs text-gray-500">{gym.clientCount} clients</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No gym data available</p>
              )}
              <div className="mt-6">
                <button
                  onClick={() => router.push('/owner/dashboard')}
                  className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View all gyms →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Optimization Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec: any, index: number) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority} priority
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(rec.potentialRevenue)}</p>
                      <p className="text-xs text-gray-500">Potential revenue</p>
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{rec.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{rec.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 capitalize">Effort: {rec.effort}</span>
                    <button className="text-blue-600 hover:text-blue-800 font-medium">
                      Implement →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revenue Forecast */}
        {forecastData && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">12-Month Revenue Forecast</h2>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Current MRR</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(forecastData.currentMRR)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Projected Year-End MRR</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(forecastData.summary.projectedYearEndMRR)}</p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRR</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ARR</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Business</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Churn</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {forecastData.forecast.slice(0, 6).map((month: any, index: number) => (
                      <tr key={index}>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month.month}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(month.mrr)}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(month.arr)}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-green-600">{formatCurrency(month.newBusiness)}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-red-600">{formatCurrency(month.churn)}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(month.netGrowth)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 text-sm text-gray-600">
                <p>Assumptions: {forecastData.assumptions.averageRevenuePerNewGym}% monthly growth, {forecastData.assumptions.churnRate}% monthly churn</p>
                <p className="mt-2">Required new gyms per month: {forecastData.summary.requiredNewGymsPerMonth}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
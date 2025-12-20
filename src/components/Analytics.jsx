import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import axios from 'axios';

const Analytics = () => {
  usePageTitle('Analytics');
  
  const { user, logout, API_BASE } = useAuth();
  const navigate = useNavigate();
  
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalUrls: 0,
      totalClicks: 0,
      thisMonthClicks: 0
    },
    topPerformingUrls: [],
    globalStats: {
      topCountries: [],
      deviceBreakdown: [],
      topReferrers: []
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);
  const hasTopPerformingFetched = useRef(false);

  // Fetch global analytics data
  useEffect(() => {
    const fetchGlobalAnalytics = async () => {
      // Prevent duplicate fetches
      if (hasFetched.current) return;
      hasFetched.current = true;

      try {
        setLoading(true);
        const tokens = JSON.parse(localStorage.getItem('shortify_tokens') || '{}');
        
        if (!tokens.access_token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`${API_BASE}/url-shortner/analytics/global`, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = response.data;
        
        // Transform the API response to match our component structure
        setAnalyticsData(prev => ({
          ...prev,
          overview: {
            totalUrls: data.summary?.total_urls || 0,
            totalClicks: data.summary?.total_clicks || 0,
            thisMonthClicks: data.summary?.this_month_clicks || 0
          },
          globalStats: {
            topCountries: (data.countries || []).map(country => ({
              name: country.country,
              flag: getFlagEmoji(country.country),
              percentage: country.percentage,
              clicks: country.count
            })),
            deviceBreakdown: data.devices || [],
            topReferrers: (data.sources || []).map(source => ({
              name: source.source,
              percentage: source.percentage,
              clicks: source.count
            }))
          }
        }));
        setError(null);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        const message = err.response?.data?.detail || err.response?.data?.message || err.message;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalAnalytics();
  }, [API_BASE]);

  // Fetch top performing URLs
  useEffect(() => {
    const fetchTopPerforming = async () => {
      // Prevent duplicate fetches
      if (hasTopPerformingFetched.current) return;
      hasTopPerformingFetched.current = true;

      try {
        const tokens = JSON.parse(localStorage.getItem('shortify_tokens') || '{}');
        
        if (!tokens.access_token) {
          return;
        }
        
        const response = await axios.get(`${API_BASE}/url-shortner/analytics/top-performing?limit=5`, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        const topPerformingData = response.data.data || [];
        
        // Transform the API response
        const transformedData = topPerformingData.map(item => ({
          id: item.code,
          url: item.url,
          code: item.code,
          clicks: item.total_clicks,
          createdDate: new Date(item.created_at * 1000).toISOString().split('T')[0],
          countries: item.countries.map(country => ({
            name: country.country,
            flag: getFlagEmoji(country.country),
            percentage: country.percentage,
            clicks: country.count
          })),
          devices: item.devices,
          referrers: item.sources.map(source => ({
            name: source.source,
            percentage: source.percentage,
            clicks: source.count
          }))
        }));

        setAnalyticsData(prev => ({
          ...prev,
          topPerformingUrls: transformedData
        }));
      } catch (err) {
        console.error('Error fetching top performing URLs:', err);
      }
    };

    fetchTopPerforming();
  }, [API_BASE]);

  // Helper function to get flag emoji from country code
  const getFlagEmoji = (countryCode) => {
    const flagMap = {
      'IN': '🇮🇳',
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'DE': '🇩🇪',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'SG': '🇸🇬',
      'FR': '🇫🇷',
      'JP': '🇯🇵',
      'CN': '🇨🇳',
      'BR': '🇧🇷',
      'MX': '🇲🇽',
      'ES': '🇪🇸',
      'IT': '🇮🇹',
      'NL': '🇳🇱'
    };
    return flagMap[countryCode] || '🌍';
  };

  // Copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error loading analytics data</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total URLs</p>
                <p className="text-3xl font-bold">{analyticsData.overview.totalUrls}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Clicks</p>
                <p className="text-3xl font-bold">{analyticsData.overview.totalClicks.toLocaleString()}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">This Month</p>
                <p className="text-3xl font-bold">{analyticsData.overview.thisMonthClicks.toLocaleString()}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Top Performing URLs - Hidden for now since no API data */}
          {analyticsData.topPerformingUrls.length > 0 && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Top Performing URLs</span>
              </h2>

              <div className="space-y-6">
                {analyticsData.topPerformingUrls.map((urlItem) => (
                  <div key={urlItem.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium text-gray-900 mb-2 break-all" title={urlItem.url}>
                          🔗 {urlItem.url.length > 80 ? `${urlItem.url.substring(0, 80)}...` : urlItem.url}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                          <span className="text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">
                            {API_BASE.replace('https://', '').replace('http://', '')}/{urlItem.code}
                          </span>
                          <span>Created: {new Date(urlItem.createdDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-2xl font-bold text-gray-900">{urlItem.clicks.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500">total clicks</p>
                        <button
                          onClick={() => copyToClipboard(`${API_BASE}/${urlItem.code}`)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                        >
                          Copy Link
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Countries */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-blue-700 mb-3 flex items-center space-x-1">
                          <span>🌍</span>
                          <span>Top Countries</span>
                        </h4>
                        <div className="space-y-2">
                          {urlItem.countries.slice(0, 3).map((country, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 flex items-center space-x-2">
                                <span>{country.flag}</span>
                                <span>{country.name}</span>
                              </span>
                              <div className="text-right">
                                <span className="text-sm font-medium text-blue-700">{country.percentage}%</span>
                                <span className="text-xs text-gray-500 ml-1">({country.clicks})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Devices */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-green-700 mb-3 flex items-center space-x-1">
                          <span>📱</span>
                          <span>Device Types</span>
                        </h4>
                        <div className="space-y-2">
                          {urlItem.devices.map((device, index) => {
                            const deviceIcon = device.device.toLowerCase().includes('mobile') || device.device.toLowerCase().includes('samsung') ? '📱' : '💻';
                            return (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 flex items-center space-x-2">
                                  <span>{deviceIcon}</span>
                                  <span className="truncate">{device.device}</span>
                                </span>
                                <div className="text-right flex-shrink-0 ml-2">
                                  <span className="text-sm font-medium text-green-700">{device.percentage}%</span>
                                  <span className="text-xs text-gray-500 ml-1">({device.count})</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Referrers */}
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-purple-700 mb-3 flex items-center space-x-1">
                          <span>🔗</span>
                          <span>Top Sources</span>
                        </h4>
                        <div className="space-y-2">
                          {urlItem.referrers.map((referrer, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 truncate">{referrer.name}</span>
                              <div className="text-right">
                                <span className="text-sm font-medium text-purple-700">{referrer.percentage}%</span>
                                <span className="text-xs text-gray-500 ml-1">({referrer.clicks})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* Right Column: Global Analytics */}
          <div className={analyticsData.topPerformingUrls.length > 0 ? "lg:col-span-1" : "lg:col-span-3"}>
            <div className="sticky top-8 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Global Analytics</span>
                </h3>

                {/* All Countries */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                    <span>🌍</span>
                    <span>All Countries</span>
                  </h4>
                  {analyticsData.globalStats.topCountries.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {analyticsData.globalStats.topCountries.map((country, index) => (
                        <div key={index} className="flex items-center justify-between py-1">
                          <span className="text-sm text-gray-600 flex items-center space-x-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-medium text-blue-600">{country.percentage}%</span>
                            <span className="text-xs text-gray-500 ml-1">({country.clicks.toLocaleString()})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No data available</p>
                  )}
                </div>

                {/* Global Device Breakdown */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                    <span>📱</span>
                    <span>All Devices</span>
                  </h4>
                  {analyticsData.globalStats.deviceBreakdown.length > 0 ? (
                    <div className="space-y-2">
                      {analyticsData.globalStats.deviceBreakdown.map((device, index) => {
                        const deviceIcon = device.device.toLowerCase().includes('mobile') || device.device.toLowerCase().includes('samsung') ? '📱' : '💻';
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 flex items-center space-x-2">
                              <span>{deviceIcon}</span>
                              <span className="truncate">{device.device}</span>
                            </span>
                            <div className="text-right flex-shrink-0 ml-2">
                              <span className="text-sm font-medium text-green-600">{device.percentage}%</span>
                              <span className="text-xs text-gray-500 ml-1">({device.count.toLocaleString()})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No data available</p>
                  )}
                </div>

                {/* All Referrers */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                    <span>🔗</span>
                    <span>All Sources</span>
                  </h4>
                  {analyticsData.globalStats.topReferrers.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {analyticsData.globalStats.topReferrers.map((referrer, index) => (
                        <div key={index} className="flex items-center justify-between py-1">
                          <span className="text-sm text-gray-600 truncate">{referrer.name}</span>
                          <div className="text-right">
                            <span className="text-sm font-medium text-purple-600">{referrer.percentage}%</span>
                            <span className="text-xs text-gray-500 ml-1">({referrer.clicks.toLocaleString()})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </main>
    </div>
  );
};

export default Analytics;

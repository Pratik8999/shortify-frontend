import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import axios from 'axios';
import ShareModal from './ShareModal';

const Analytics = () => {
  usePageTitle('Analytics');
  
  const { user, logout, API_BASE, API_HOST } = useAuth();
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

  const [shareModal, setShareModal] = useState({
    show: false,
    url: '',
    title: ''
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [copyNotification, setCopyNotification] = useState({
    show: false,
    message: ''
  });

  const [titleEdit, setTitleEdit] = useState({
    editingId: null,
    editValue: '',
    updating: false
  });

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
          id: item.id,
          url: item.url,
          code: item.code,
          title: item.title || '',
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

  // Share URL function
  const shareUrl = async (url, title = 'Check out this link from Shortify!') => {
    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url
        });
        setCopyNotification({ show: true, message: '✓ Shared successfully!' });
        setTimeout(() => setCopyNotification({ show: false, message: '' }), 2000);
      } catch (err) {
        // User cancelled or error occurred
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          // Fallback to modal
          setShareModal({ show: true, url, title });
        }
      }
    } else {
      // Web Share API not supported, show fallback modal
      setShareModal({ show: true, url, title });
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      // Try modern Clipboard API first (works on HTTPS and localhost)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopyNotification({ show: true, message: '✓ Copied to clipboard!' });
        setTimeout(() => setCopyNotification({ show: false, message: '' }), 2000);
      } else {
        // Fallback for non-secure contexts (HTTP)
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopyNotification({ show: true, message: '✓ Copied to clipboard!' });
            setTimeout(() => setCopyNotification({ show: false, message: '' }), 2000);
          } else {
            throw new Error('execCommand failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      setCopyNotification({ show: true, message: '✗ Failed to copy' });
      setTimeout(() => setCopyNotification({ show: false, message: '' }), 2000);
    }
  };

  // Start editing title
  const startEditTitle = (urlCode, currentTitle) => {
    setTitleEdit({
      editingId: urlCode,
      editValue: currentTitle || '',
      updating: false
    });
  };

  // Cancel title edit
  const cancelEditTitle = () => {
    setTitleEdit({
      editingId: null,
      editValue: '',
      updating: false
    });
  };

  // Update title via API
  const updateTitle = async (urlCode) => {
    const trimmedTitle = titleEdit.editValue.trim();
    
    setTitleEdit(prev => ({ ...prev, updating: true }));

    try {
      const tokens = JSON.parse(localStorage.getItem('shortify_tokens') || '{}');
      
      const response = await axios.put(`${API_BASE}/url-shortner/`, {
        url_id: urlCode,
        title: trimmedTitle === '' ? null : trimmedTitle
      }, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        // Update the local state
        setAnalyticsData(prev => ({
          ...prev,
          topPerformingUrls: prev.topPerformingUrls.map(url => 
            url.id === urlCode 
              ? { ...url, title: trimmedTitle === '' ? null : trimmedTitle }
              : url
          )
        }));

        // Clear edit state
        cancelEditTitle();
        
        // Show success notification
        setCopyNotification({ show: true, message: '✓ Title updated!' });
        setTimeout(() => setCopyNotification({ show: false, message: '' }), 2000);
      }
    } catch (error) {
      console.error('Failed to update title:', error);
      setCopyNotification({ show: true, message: '✗ Failed to update title' });
      setTimeout(() => setCopyNotification({ show: false, message: '' }), 2000);
      setTitleEdit(prev => ({ ...prev, updating: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Copy Notification Toast */}
      {copyNotification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className={`px-6 py-3 rounded-lg shadow-lg ${
            copyNotification.message.includes('✓') 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {copyNotification.message}
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer hidden md:block"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer text-sm"
              >
                Dashboard
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer text-sm"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 pt-4 pb-2 mt-4">
              <nav className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => {
                    navigate('/analytics');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left px-4 py-3 text-blue-600 font-medium bg-blue-50 rounded-lg cursor-pointer"
                >
                  📈 Analytics
                </button>
                <button
                  onClick={() => {
                    navigate('/history');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  🕒 History
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
                            {API_HOST.replace('https://', '').replace('http://', '')}/{urlItem.code}
                          </span>
                          <span>Created: {new Date(urlItem.createdDate).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Title display with edit functionality */}
                        {titleEdit.editingId === urlItem.id ? (
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              value={titleEdit.editValue}
                              onChange={(e) => {
                                if (e.target.value.length <= 15) {
                                  setTitleEdit(prev => ({ ...prev, editValue: e.target.value }));
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !titleEdit.updating) {
                                  updateTitle(urlItem.id);
                                } else if (e.key === 'Escape') {
                                  cancelEditTitle();
                                }
                              }}
                              maxLength={15}
                              placeholder="Enter title (max 15 chars)"
                              disabled={titleEdit.updating}
                              className="flex-1 px-2 py-1 text-sm border-2 border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <span className="text-xs text-gray-500">{titleEdit.editValue.length}/15</span>
                            <button
                              onClick={() => updateTitle(urlItem.id)}
                              disabled={titleEdit.updating}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer disabled:opacity-50"
                              title="Save title"
                            >
                              {titleEdit.updating ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={cancelEditTitle}
                              disabled={titleEdit.updating}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer disabled:opacity-50"
                              title="Cancel"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => startEditTitle(urlItem.id, urlItem.title)}
                            className="cursor-pointer hover:bg-gray-50 rounded px-2 py-1 mb-2 inline-block"
                            title="Click to edit title"
                          >
                            {urlItem.title && urlItem.title.trim() !== '' ? (
                              <p className="text-sm text-gray-700 font-semibold">🏷️ {urlItem.title}</p>
                            ) : (
                              <p className="text-sm text-gray-400 italic">No title</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-2xl font-bold text-gray-900">{urlItem.clicks.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500">total clicks</p>
                        <div className="flex items-center justify-end space-x-3 mt-2">
                          <button
                            onClick={() => shareUrl(`${API_HOST}/${urlItem.code}`, 'Check out this link from Shortify!')}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium cursor-pointer flex items-center space-x-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            <span>Share</span>
                          </button>
                          <button
                            onClick={() => copyToClipboard(`${API_HOST}/${urlItem.code}`)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                          >
                            Copy Link
                          </button>
                        </div>
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

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModal.show}
        onClose={() => setShareModal({ show: false, url: '', title: '' })}
        url={shareModal.url}
        title={shareModal.title}
      />
    </div>
  );
};

export default Analytics;

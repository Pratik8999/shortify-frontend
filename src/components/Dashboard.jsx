import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const { user, logout, getAuthHeader, fetchUrls, getProfile, updateProfile, API_BASE } = useAuth();
  const navigate = useNavigate();
  
  const [urlData, setUrlData] = useState({
    url: '',
    shortCode: '',
    isLoading: false,
    error: '',
    success: false,
    existingUrlMessage: ''
  });

  const [recentUrls, setRecentUrls] = useState({
    data: [],
    loading: false,
    error: ''
  });

  const [profile, setProfile] = useState({
    data: null,
    loading: false,
    error: '',
    editing: false,
    editData: { name: '', email: '' },
    updating: false
  });

  // Dummy analytics data
  const analyticsData = {
    totalUrls: 47,
    totalClicks: 15420,
    thisMonthClicks: 3240,
    averageCTR: 12.4,
    topCountries: [
      { name: "India", flag: "🇮🇳", percentage: 42 },
      { name: "USA", flag: "🇺🇸", percentage: 28 },
      { name: "UK", flag: "🇬🇧", percentage: 12 },
      { name: "Germany", flag: "🇩🇪", percentage: 8 },
      { name: "Others", flag: "🌍", percentage: 10 }
    ],
    deviceBreakdown: {
      mobile: 58,
      desktop: 42
    },
    clicksOverTime: [
      { date: 'Nov 25', clicks: 1200 },
      { date: 'Nov 26', clicks: 1850 },
      { date: 'Nov 27', clicks: 1600 },
      { date: 'Nov 28', clicks: 2100 },
      { date: 'Nov 29', clicks: 1950 },
      { date: 'Nov 30', clicks: 2300 }
    ]
  };

  // Validate URL format
  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  // Handle URL input change
  const handleUrlChange = (e) => {
    const value = e.target.value;
    setUrlData(prev => ({
      ...prev,
      url: value,
      error: '',
      success: false,
      existingUrlMessage: ''
    }));
  };

  // Parse FastAPI validation errors
  const parseValidationError = (errorDetail) => {
    if (Array.isArray(errorDetail)) {
      const urlError = errorDetail.find(err => err.loc.includes('url'));
      if (urlError) {
        return urlError.msg || 'Invalid URL format';
      }
      return errorDetail[0]?.msg || 'Validation error';
    }
    return 'Invalid input';
  };

  // Handle URL shortening
  const handleShortenUrl = async () => {
    const url = urlData.url.trim();
    
    // Client-side validation
    if (!url) {
      setUrlData(prev => ({ ...prev, error: 'Please enter a URL' }));
      return;
    }

    if (!isValidUrl(url)) {
      setUrlData(prev => ({ ...prev, error: 'Please enter a valid URL (must start with http:// or https://)' }));
      return;
    }

    setUrlData(prev => ({ ...prev, isLoading: true, error: '', success: false, existingUrlMessage: '' }));

    try {
      const response = await axios.post(`${API_BASE}/api/url-shortner/`, {
        url: url
      }, {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });

      // Success (201 Created)
      if (response.status === 201) {
        const { code, message } = response.data;
        setUrlData(prev => ({
          ...prev,
          shortCode: code,
          success: true,
          isLoading: false,
          error: ''
        }));

        // Refresh recent URLs to show the new URL
        loadRecentUrls();
      }
    } catch (error) {
      setUrlData(prev => ({ ...prev, isLoading: false, success: false }));

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 400) {
          // URL already exists
          const { short_code, message } = data;
          setUrlData(prev => ({
            ...prev,
            shortCode: short_code,
            success: true,
            error: '',
            existingUrlMessage: message || 'URL already exists'
          }));
          // Refresh recent URLs
          loadRecentUrls();
        } else if (status === 422) {
          // Validation error
          const errorMsg = parseValidationError(data.detail);
          setUrlData(prev => ({ ...prev, error: errorMsg }));
        } else if (status === 401) {
          // Unauthorized
          setUrlData(prev => ({ ...prev, error: 'Please log in again' }));
        } else {
          // Other server errors
          setUrlData(prev => ({ ...prev, error: data.message || 'Server error occurred' }));
        }
      } else if (error.request) {
        // Network error
        setUrlData(prev => ({ ...prev, error: 'Network error. Please check your connection.' }));
      } else {
        // Other errors
        setUrlData(prev => ({ ...prev, error: 'Something went wrong. Please try again.' }));
      }
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Load recent 5 URLs from API
  const loadRecentUrls = async () => {
    setRecentUrls(prev => ({ ...prev, loading: true, error: '' }));
    
    const result = await fetchUrls(1, 5); // Only get 5 recent URLs
    
    if (result.success) {
      setRecentUrls({
        data: result.data,
        loading: false,
        error: ''
      });
    } else {
      setRecentUrls(prev => ({
        ...prev,
        loading: false,
        error: result.message
      }));
    }
  };

  // Load profile data
  const loadProfile = async () => {
    setProfile(prev => ({ ...prev, loading: true, error: '' }));
    
    const result = await getProfile();
    
    if (result.success) {
      setProfile(prev => ({
        ...prev,
        data: result.profile,
        loading: false,
        error: '',
        editData: { name: result.profile.name, email: result.profile.email }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        loading: false,
        error: result.message
      }));
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    setProfile(prev => ({ ...prev, updating: true }));
    
    const result = await updateProfile(profile.editData);
    
    if (result.success) {
      setProfile(prev => ({
        ...prev,
        data: result.profile,
        updating: false,
        editing: false,
        error: ''
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        updating: false,
        error: result.message
      }));
    }
  };

  // Get intelligent greeting
  const getGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    const userName = profile.data?.name || 'there';
    
    let greeting;
    if (hour < 12) {
      greeting = 'Good Morning';
    } else if (hour < 17) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }
    
    return `${greeting}, ${userName}!`;
  };

  // Load data on component mount
  useEffect(() => {
    loadRecentUrls();
    loadProfile();
  }, []);

  // Clear form
  const clearForm = () => {
    setUrlData({
      url: '',
      shortCode: '',
      isLoading: false,
      error: '',
      success: false,
      existingUrlMessage: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                ⚡ Shortify
              </div>
              <nav className="hidden md:flex space-x-6">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-blue-600 font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/analytics')}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Analytics
                </button>
                <button
                  onClick={() => navigate('/history')}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  History
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {/* Greeting */}
              {profile.data && (
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-800">
                    {getGreeting()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {profile.data.country}
                  </div>
                </div>
              )}
              
              {/* Profile & Logout */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setProfile(prev => ({ ...prev, editing: !prev.editing }))}
                  className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all duration-200"
                  title="Edit Profile"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <button
                  onClick={logout}
                  className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all duration-200"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Edit Modal */}
      {profile.editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              <button
                onClick={() => setProfile(prev => ({ ...prev, editing: false, error: '' }))}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {profile.loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading profile...</p>
              </div>
            ) : profile.error ? (
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                  {profile.error}
                </div>
                <button
                  onClick={loadProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : !profile.data ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No profile data available</p>
                <button
                  onClick={loadProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Load Profile
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current Profile Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">Current Profile</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Name:</span> {profile.data.name}</p>
                    <p><span className="font-medium">Email:</span> {profile.data.email}</p>
                    <p><span className="font-medium">Country:</span> {profile.data.country}</p>
                  </div>
                </div>

                {/* Edit Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={profile.editData.name}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      editData: { ...prev.editData, name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.editData.email}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      editData: { ...prev.editData, email: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                  />
                </div>

                {/* Error Message */}
                {profile.error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {profile.error}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={profile.updating || !profile.editData.name.trim() || !profile.editData.email.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {profile.updating ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </div>
                    ) : 'Update Profile'}
                  </button>
                  <button
                    onClick={() => setProfile(prev => ({ 
                      ...prev, 
                      editing: false, 
                      error: '',
                      editData: { name: prev.data?.name || '', email: prev.data?.email || '' }
                    }))}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - URL Shortener */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8 lg:p-12 mb-8 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Shorten Your URLs Instantly
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Transform long, complex URLs into short, shareable links that are perfect for social media, emails, and more.
            </p>
          </div>
          
          {/* URL Input Form */}
          <div className="w-full max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="url"
                  placeholder="https://example.com/very-long-url-that-needs-shortening"
                  value={urlData.url}
                  onChange={handleUrlChange}
                  disabled={urlData.isLoading}
                  className={`w-full px-6 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-lg ${
                    urlData.error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                  } ${urlData.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              <button 
                onClick={handleShortenUrl}
                disabled={urlData.isLoading || !urlData.url.trim()}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg whitespace-nowrap"
              >
                {urlData.isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Shortening...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Shorten URL
                  </div>
                )}
              </button>
            </div>

            {/* Error Message */}
            {urlData.error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl text-center mb-6">
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {urlData.error}
              </div>
            )}

            {/* Success Message with Short URL */}
            {urlData.success && urlData.shortCode && (
              <div className={`border-2 rounded-2xl p-6 text-center ${
                urlData.existingUrlMessage 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <p className={`font-semibold mb-4 text-lg ${
                  urlData.existingUrlMessage 
                    ? 'text-blue-700' 
                    : 'text-green-700'
                }`}>
                  {urlData.existingUrlMessage 
                    ? `ℹ️ ${urlData.existingUrlMessage}` 
                    : '🎉 Short URL created successfully!'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-center w-full max-w-4xl mx-auto">
                  <input
                    type="text"
                    value={`${API_BASE}/${urlData.shortCode}`}
                    readOnly
                    className={`flex-1 px-4 py-3 bg-white border-2 rounded-xl font-mono text-center text-lg font-semibold ${
                      urlData.existingUrlMessage 
                        ? 'border-blue-300 text-blue-700' 
                        : 'border-green-300 text-green-700'
                    }`}
                  />
                  <button
                    onClick={() => copyToClipboard(`${API_BASE}/${urlData.shortCode}`)}
                    className={`px-6 py-3 text-white rounded-xl hover:scale-105 transition-all font-semibold ${
                      urlData.existingUrlMessage 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={clearForm}
                    className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 hover:scale-105 transition-all font-semibold"
                  >
                    ✨ New URL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Left Column - Recent URLs (3/4 width) */}
          <div className="lg:col-span-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Recent URLs</h2>
                  <p className="text-gray-600 mt-1">Your latest shortened links</p>
                </div>
                <button
                  onClick={() => navigate('/history')}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline transition-colors"
                >
                  <span>View All History</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Loading State */}
              {recentUrls.loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 text-lg">Loading your recent URLs...</p>
                </div>
              )}

              {/* Error State */}
              {recentUrls.error && !recentUrls.loading && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
                  <p className="text-red-600 mb-3">{recentUrls.error}</p>
                  <button
                    onClick={loadRecentUrls}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!recentUrls.loading && !recentUrls.error && recentUrls.data.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No URLs yet</h3>
                  <p className="text-gray-500">Create your first short URL to see it here!</p>
                </div>
              )}

              {/* URL List */}
              {!recentUrls.loading && !recentUrls.error && recentUrls.data.length > 0 && (
                <div className="space-y-4">
                  {recentUrls.data.map((urlItem, index) => (
                    <div key={urlItem.id} className="bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-6">
                          {/* Original URL with LATEST badge */}
                          <div className="mb-3">
                            <div className="flex items-center mb-2">
                              {index === 0 && (
                                <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full mr-3 uppercase tracking-wide">
                                  Latest
                                </span>
                              )}
                            </div>
                            <p className="text-base font-medium text-gray-900 truncate" title={urlItem.url}>
                              {urlItem.url.length > 75 ? `${urlItem.url.substring(0, 75)}...` : urlItem.url}
                            </p>
                          </div>
                          
                          {/* Short URL with actions */}
                          <div className="flex items-center mb-3">
                            <span className="text-blue-600 font-mono text-sm font-medium bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                              {API_BASE.replace('http://', '').replace('https://', '')}/{urlItem.code}
                            </span>
                            <button
                              onClick={() => copyToClipboard(`${API_BASE}/${urlItem.code}`)}
                              className="ml-3 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Copy short URL"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <a
                              href={`${API_BASE}/${urlItem.code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Open short URL"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                          
                          {/* Stats */}
                          {urlItem.click_count !== undefined && (
                            <div>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {urlItem.click_count} {urlItem.click_count === 1 ? 'click' : 'clicks'}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Date */}
                        <div className="text-right">
                          <p className="text-sm text-gray-500 font-medium">
                            {new Date(urlItem.createdon * 1000).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: new Date().getFullYear() !== new Date(urlItem.createdon * 1000).getFullYear() ? 'numeric' : undefined,
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Analytics Summary (1/4 width) */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  📊 Quick Stats
                </h2>
                <button
                  onClick={() => navigate('/analytics')}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                >
                  View Details →
                </button>
              </div>

              {/* Overview Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">{analyticsData.totalUrls}</div>
                  <div className="text-xs text-blue-600 font-medium">URLs</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{(analyticsData.totalClicks/1000).toFixed(0)}k</div>
                  <div className="text-xs text-green-600 font-medium">Clicks</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-purple-600">{(analyticsData.thisMonthClicks/1000).toFixed(1)}k</div>
                  <div className="text-xs text-purple-600 font-medium">This Month</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-orange-600">{analyticsData.averageCTR}%</div>
                  <div className="text-xs text-orange-600 font-medium">CTR</div>
                </div>
              </div>

              {/* Top Countries */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">🌍 Countries</h3>
                <div className="space-y-2">
                  {analyticsData.topCountries.slice(0, 4).map((country, index) => (
                    <div key={country.name} className="flex items-center justify-between py-1">
                      <div className="flex items-center">
                        <span className="text-sm mr-2">{country.flag}</span>
                        <span className="text-xs font-medium text-gray-700 truncate">{country.name}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5 mr-2">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full" 
                            style={{ width: `${country.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-600 min-w-[28px]">{country.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device Breakdown */}
              <div className="mb-5">
                <h3 className="text-base font-semibold text-gray-800 mb-3">📱 Devices</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm mr-2">📱</span>
                      <span className="text-xs font-medium text-gray-700">Mobile</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-600">{analyticsData.deviceBreakdown.mobile}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm mr-2">💻</span>
                      <span className="text-xs font-medium text-gray-700">Desktop</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-600">{analyticsData.deviceBreakdown.desktop}%</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">📈 Activity</h3>
                <div className="space-y-1">
                  {analyticsData.clicksOverTime.slice(-3).map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg">
                      <span className="text-xs font-medium text-gray-700">{day.date}</span>
                      <span className="text-xs font-semibold text-blue-600">{day.clicks}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

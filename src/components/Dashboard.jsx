import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import usePageTitle from '../hooks/usePageTitle';

const Dashboard = () => {
  usePageTitle('Dashboard');
  
  const { user, logout, getAuthHeader, fetchUrls, getProfile, updateProfile, deleteUrls, API_BASE, API_HOST } = useAuth();
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

  const [deleteState, setDeleteState] = useState({
    selectionMode: false,
    selectedUrls: [],
    deleting: false,
    showDeleteModal: false,
    urlToDelete: null
  });

  const [profile, setProfile] = useState({
    data: null,
    loading: false,
    error: '',
    editing: false,
    editData: { name: '', email: '' },
    updating: false
  });

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState({
    totalUrls: 0,
    totalClicks: 0,
    thisMonthClicks: 0,
    averageCTR: 0,
    topCountries: [],
    deviceBreakdown: {
      mobile: 0,
      desktop: 0
    },
    clicksOverTime: []
  });

  const [copyNotification, setCopyNotification] = useState({
    show: false,
    message: ''
  });

  const hasAnalyticsFetched = useRef(false);

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
      const response = await axios.post(`${API_BASE}/url-shortner/`, {
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
      setCopyNotification({ show: true, message: '✓ Copied to clipboard!' });
      setTimeout(() => setCopyNotification({ show: false, message: '' }), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      setCopyNotification({ show: true, message: '✗ Failed to copy' });
      setTimeout(() => setCopyNotification({ show: false, message: '' }), 2000);
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
    
    return `${greeting}, ${userName}`;
  };

  // Load analytics data
  const loadAnalytics = async () => {
    if (hasAnalyticsFetched.current) return;
    hasAnalyticsFetched.current = true;

    try {
      const tokens = JSON.parse(localStorage.getItem('shortify_tokens') || '{}');
      
      if (!tokens.access_token) {
        return;
      }
      
      const response = await axios.get(`${API_BASE}/url-shortner/analytics/global`, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      // Transform the API response
      setAnalyticsData({
        totalUrls: data.summary?.total_urls || 0,
        totalClicks: data.summary?.total_clicks || 0,
        thisMonthClicks: data.summary?.this_month_clicks || 0,
        averageCTR: 0, // Can be calculated if needed
        topCountries: (data.countries || []).slice(0, 5).map(country => ({
          name: country.country,
          flag: getFlagEmoji(country.country),
          percentage: country.percentage
        })),
        deviceBreakdown: {
          mobile: data.devices?.find(d => d.device === 'Mobile')?.percentage || 0,
          desktop: data.devices?.find(d => d.device === 'Desktop')?.percentage || 0
        },
        clicksOverTime: [] // This would need a different endpoint if available
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadRecentUrls();
    loadProfile();
    loadAnalytics();
    
    // Track visit
    const trackVisit = async () => {
      try {
        await axios.get(`${API_BASE}/visit/track`);
      } catch (error) {
        // Silently fail - visit tracking shouldn't affect user experience
        console.debug('Visit tracking failed:', error);
      }
    };
    trackVisit();
  }, []);

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setDeleteState(prev => ({
      ...prev,
      selectionMode: !prev.selectionMode,
      selectedUrls: []
    }));
  };

  // Toggle URL selection
  const toggleUrlSelection = (urlCode) => {
    setDeleteState(prev => ({
      ...prev,
      selectedUrls: prev.selectedUrls.includes(urlCode)
        ? prev.selectedUrls.filter(code => code !== urlCode)
        : [...prev.selectedUrls, urlCode]
    }));
  };

  // Open delete modal for single URL
  const openDeleteModal = (urlCode) => {
    setDeleteState(prev => ({
      ...prev,
      showDeleteModal: true,
      urlToDelete: urlCode
    }));
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteState(prev => ({
      ...prev,
      showDeleteModal: false,
      urlToDelete: null
    }));
  };

  // Handle delete (single or multiple)
  const handleDeleteUrls = async () => {
    const urlCodes = deleteState.urlToDelete 
      ? [deleteState.urlToDelete] 
      : deleteState.selectedUrls;

    if (urlCodes.length === 0) return;

    setDeleteState(prev => ({ ...prev, deleting: true }));

    try {
      const result = await deleteUrls(urlCodes);
      
      if (result.success) {
        // Remove deleted URLs from the list
        setRecentUrls(prev => ({
          ...prev,
          data: prev.data.filter(url => !urlCodes.includes(url.code))
        }));

        // Reset delete state
        setDeleteState({
          selectionMode: false,
          selectedUrls: [],
          deleting: false,
          showDeleteModal: false,
          urlToDelete: null
        });

        // Optionally reload URLs to sync with backend
        await loadRecentUrls();
      } else {
        alert(result.message || 'Failed to delete URLs');
        setDeleteState(prev => ({ ...prev, deleting: false }));
      }
    } catch (error) {
      alert('An error occurred while deleting URLs');
      setDeleteState(prev => ({ ...prev, deleting: false }));
    }
  };

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
                  className="text-blue-600 font-medium cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/analytics')}
                  className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Analytics
                </button>
                <button
                  onClick={() => navigate('/history')}
                  className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
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
                  className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all duration-200 cursor-pointer"
                  title="Edit Profile"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <button
                  onClick={logout}
                  className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all duration-200 cursor-pointer"
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
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : !profile.data ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No profile data available</p>
                <button
                  onClick={loadProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
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
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 cursor-pointer"
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
                    value={`${API_HOST}/${urlData.shortCode}`}
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
                <div className="flex items-center space-x-3">
                  {!deleteState.selectionMode && recentUrls.data.length > 0 && (
                    <button
                      onClick={toggleSelectionMode}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors cursor-pointer text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Select URLs</span>
                    </button>
                  )}
                  {deleteState.selectionMode && (
                    <button
                      onClick={toggleSelectionMode}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors cursor-pointer text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Cancel Selection</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/history')}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline transition-colors cursor-pointer"
                  >
                    <span>View All History</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
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
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors cursor-pointer"
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
                        {/* Checkbox for selection mode */}
                        {deleteState.selectionMode && (
                          <div className="flex-shrink-0 mr-4">
                            <input
                              type="checkbox"
                              checked={deleteState.selectedUrls.includes(urlItem.code)}
                              onChange={() => toggleUrlSelection(urlItem.code)}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                          </div>
                        )}
                        
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
                              {API_HOST.replace('http://', '').replace('https://', '')}/{urlItem.code}
                            </span>
                            {!deleteState.selectionMode && (
                              <button
                                onClick={() => openDeleteModal(urlItem.code)}
                                className="ml-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer hover:scale-110"
                                title="Delete URL"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => copyToClipboard(`${API_HOST}/${urlItem.code}`)}
                              className="ml-3 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Copy short URL"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <a
                              href={`${API_HOST}/${urlItem.code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
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

              {/* Floating Action Bar for Multi-Select */}
              {deleteState.selectionMode && deleteState.selectedUrls.length > 0 && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold">{deleteState.selectedUrls.length} URL{deleteState.selectedUrls.length > 1 ? 's' : ''} selected</span>
                    </div>
                    <button
                      onClick={handleDeleteUrls}
                      disabled={deleteState.deleting}
                      className="flex items-center space-x-2 px-6 py-2 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteState.deleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete Selected</span>
                        </>
                      )}
                    </button>
                  </div>
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
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline cursor-pointer"
                >
                  View Details →
                </button>
              </div>

              {/* Overview Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{analyticsData.totalUrls}</div>
                  <div className="text-xs text-blue-600 font-medium">URLs</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData.totalClicks >= 1000 
                      ? `${(analyticsData.totalClicks/1000).toFixed(1)}k` 
                      : analyticsData.totalClicks}
                  </div>
                  <div className="text-xs text-green-600 font-medium">Clicks</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analyticsData.thisMonthClicks >= 1000 
                      ? `${(analyticsData.thisMonthClicks/1000).toFixed(1)}k` 
                      : analyticsData.thisMonthClicks}
                  </div>
                  <div className="text-xs text-purple-600 font-medium">This Month</div>
                </div>
              </div>

              {/* Top Countries */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">🌍 Countries</h3>
                <div className="space-y-2">
                  {analyticsData.topCountries.length > 0 ? (
                    analyticsData.topCountries.slice(0, 4).map((country, index) => (
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
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-2">No data available</p>
                  )}
                </div>
              </div>

              {/* Device Breakdown */}
              <div className="mb-5">
                <h3 className="text-base font-semibold text-gray-800 mb-3">📱 Devices</h3>
                <div className="space-y-2">
                  {analyticsData.deviceBreakdown.mobile > 0 || analyticsData.deviceBreakdown.desktop > 0 ? (
                    <>
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
                    </>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-2">No data available</p>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              {analyticsData.clicksOverTime.length > 0 && (
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
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteState.showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete URL?</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete this URL? This action cannot be undone.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleteState.deleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUrls}
                disabled={deleteState.deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteState.deleting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

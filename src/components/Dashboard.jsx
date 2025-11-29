import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user, logout, getAuthHeader, fetchUrls, getProfile, updateProfile, API_BASE } = useAuth();
  const [urlData, setUrlData] = useState({
    url: '',
    shortCode: '',
    isLoading: false,
    error: '',
    success: false,
    existingUrlMessage: ''
  });

  const [urlHistory, setUrlHistory] = useState({
    data: [],
    loading: false,
    error: '',
    pagination: {
      current_page: 1,
      next_page: null,
      prev_page: null,
      total_pages: 1,
      total_items: 0
    }
  });

  const [profile, setProfile] = useState({
    data: null,
    loading: false,
    error: '',
    editing: false,
    editData: { name: '', email: '' },
    updating: false
  });

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

      console.log('URL Shortening Response:', response.status, response.data);

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

        // Refresh URL history to show the new URL
        loadUrls(1);
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
          // Refresh URL history
          loadUrls(1);
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

  // Load URLs from API
  const loadUrls = async (page = 1, limit = 10) => {
    setUrlHistory(prev => ({ ...prev, loading: true, error: '' }));
    
    const result = await fetchUrls(page, limit);
    
    if (result.success) {
      setUrlHistory({
        data: result.data,
        loading: false,
        error: '',
        pagination: result.pagination
      });
    } else {
      setUrlHistory(prev => ({
        ...prev,
        loading: false,
        error: result.message
      }));
    }
  };

  // Handle pagination
  const handleNextPage = () => {
    if (urlHistory.pagination.next_page) {
      loadUrls(urlHistory.pagination.next_page);
    }
  };

  const handlePrevPage = () => {
    if (urlHistory.pagination.prev_page) {
      loadUrls(urlHistory.pagination.prev_page);
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

  // Get intelligent greeting based on user's timezone
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
    
    return {
      message: `${greeting}, ${userName}!`
    };
  };

  // Load profile on component mount
  useEffect(() => {
    loadUrls();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Shortify Dashboard
            </div>
            <div className="flex items-center space-x-6">
              {/* Intelligent Greeting */}
              {profile.data && (
                <div className="text-right">
                  <div className="text-lg font-medium text-gray-800">
                    {getGreeting().message}
                  </div>
                  <div className="text-sm text-gray-500">
                    {profile.data.country}
                  </div>
                </div>
              )}
              
              {/* Profile & Actions */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setProfile(prev => ({ ...prev, editing: !prev.editing }))}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile</span>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            URL Shortener
          </h1>
          
          {/* Profile Edit Modal */}
          {profile.editing && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
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
                    {profile.data && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="font-medium text-gray-700 mb-2">Current Profile</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Name:</span> {profile.data.name}</p>
                          <p><span className="font-medium">Email:</span> {profile.data.email}</p>
                          <p><span className="font-medium">Country:</span> {profile.data.country}</p>
                        </div>
                      </div>
                    )}

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

          {/* URL Shortener Form */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Create Short URLs
              </h2>
              <p className="text-gray-600 mb-6">
                Paste your long URL below to create a shortened version
              </p>
              
              {/* URL Input Form */}
              <div className="max-w-2xl mx-auto">
                <div className="flex gap-3 mb-4">
                  <input
                    type="url"
                    placeholder="https://example.com/very-long-url-here"
                    value={urlData.url}
                    onChange={handleUrlChange}
                    disabled={urlData.isLoading}
                    className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      urlData.error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    } ${urlData.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <button 
                    onClick={handleShortenUrl}
                    disabled={urlData.isLoading || !urlData.url.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {urlData.isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Shortening...
                      </div>
                    ) : 'Shorten'}
                  </button>
                </div>

                {/* Error Message */}
                {urlData.error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                    {urlData.error}
                  </div>
                )}

                {/* Success Message with Short URL */}
                {urlData.success && urlData.shortCode && (
                  <div className={`border rounded-lg p-4 mb-4 ${
                    urlData.existingUrlMessage 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <p className={`font-medium mb-3 ${
                      urlData.existingUrlMessage 
                        ? 'text-blue-700' 
                        : 'text-green-700'
                    }`}>
                      {urlData.existingUrlMessage 
                        ? `ℹ️ ${urlData.existingUrlMessage}` 
                        : '✅ Short URL created successfully!'
                      }
                    </p>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={`${API_BASE}/${urlData.shortCode}`}
                        readOnly
                        className={`flex-1 px-3 py-2 bg-white border rounded font-mono text-sm ${
                          urlData.existingUrlMessage 
                            ? 'border-blue-300 text-blue-700' 
                            : 'border-green-300 text-green-700'
                        }`}
                      />
                      <button
                        onClick={() => copyToClipboard(`${API_BASE}/${urlData.shortCode}`)}
                        className={`px-3 py-2 text-white rounded hover:opacity-90 transition-colors text-sm cursor-pointer ${
                          urlData.existingUrlMessage 
                            ? 'bg-blue-600' 
                            : 'bg-green-600'
                        }`}
                      >
                        Copy
                      </button>
                      <button
                        onClick={clearForm}
                        className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm cursor-pointer"
                      >
                        New
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* URL History Section */}
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Your URL History
                {urlHistory.pagination.total_items > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({urlHistory.pagination.total_items} total)
                  </span>
                )}
              </h3>
            </div>

            {/* Loading State */}
            {urlHistory.loading && (
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading your URLs...</p>
              </div>
            )}

            {/* Error State */}
            {urlHistory.error && !urlHistory.loading && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600 mb-3">{urlHistory.error}</p>
                <button
                  onClick={() => loadUrls(urlHistory.pagination.current_page)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!urlHistory.loading && !urlHistory.error && urlHistory.data.length === 0 && (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p className="text-lg font-medium mb-2">No URLs shortened yet</p>
                <p>Create your first short URL above to get started!</p>
              </div>
            )}

            {/* URL List */}
            {!urlHistory.loading && !urlHistory.error && urlHistory.data.length > 0 && (
              <div className="space-y-4">
                {urlHistory.data.map((urlItem) => (
                  <div key={urlItem.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium text-gray-900 truncate" title={urlItem.url}>
                          {urlItem.url.length > 60 ? `${urlItem.url.substring(0, 60)}...` : urlItem.url}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-blue-600 font-mono text-sm">
                            {API_BASE}/{urlItem.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(`${API_BASE}/${urlItem.code}`)}
                            className="ml-2 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
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
                            className="ml-2 text-gray-400 hover:text-green-600 transition-colors cursor-pointer"
                            title="Open short URL"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                        {urlItem.click_count !== undefined && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {urlItem.click_count} {urlItem.click_count === 1 ? 'click' : 'clicks'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(urlItem.createdon * 1000).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
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

            {/* Pagination Controls */}
            {(urlHistory.pagination.next_page || urlHistory.pagination.prev_page) && !urlHistory.loading && (
              <div className="flex items-center justify-between mt-6 px-4 py-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Page {urlHistory.pagination.current_page} of {urlHistory.pagination.total_pages}
                    {urlHistory.pagination.total_items > 0 && (
                      <span> • {urlHistory.pagination.total_items} total URLs</span>
                    )}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={handlePrevPage}
                    disabled={!urlHistory.pagination.prev_page}
                    className="px-4 py-2 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Previous</span>
                  </button>
                  
                  {/* Next Button */}
                  <button
                    onClick={handleNextPage}
                    disabled={!urlHistory.pagination.next_page}
                    className="px-4 py-2 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

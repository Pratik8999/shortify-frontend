import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import ShareModal from './ShareModal';
import axios from 'axios';

const History = () => {
  usePageTitle('History');
  
  const { fetchUrls, deleteUrls, API_BASE, API_HOST } = useAuth();
  const navigate = useNavigate();
  
  // Get auth header function
  const getAuthHeader = () => {
    const tokens = JSON.parse(localStorage.getItem('shortify_tokens') || '{}');
    return tokens.access_token ? `Bearer ${tokens.access_token}` : null;
  };
  
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

  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    error: ''
  });

  const [deleteState, setDeleteState] = useState({
    selectionMode: false,
    selectedUrls: [],
    deleting: false,
    showDeleteModal: false,
    urlToDelete: null
  });

  const [copyNotification, setCopyNotification] = useState({
    show: false,
    message: ''
  });

  const [shareModal, setShareModal] = useState({
    show: false,
    url: '',
    title: ''
  });

  const [titleEdit, setTitleEdit] = useState({
    editingId: null,
    editValue: '',
    updating: false
  });

  // Load URLs from API
  const loadUrls = async (page = 1, limit = 10, filters = {}) => {
    setUrlHistory(prev => ({ ...prev, loading: true, error: '' }));
    setDateFilter(prev => ({ ...prev, error: '' }));
    
    const result = await fetchUrls(page, limit, filters);
    
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
      const filters = buildFilters();
      loadUrls(urlHistory.pagination.next_page, 10, filters);
    }
  };

  const handlePrevPage = () => {
    if (urlHistory.pagination.prev_page) {
      const filters = buildFilters();
      loadUrls(urlHistory.pagination.prev_page, 10, filters);
    }
  };

  // Build filters object from date inputs
  const buildFilters = () => {
    const filters = {};
    if (dateFilter.startDate) {
      filters.from_date = dateFilter.startDate;
    }
    if (dateFilter.endDate) {
      filters.to_date = dateFilter.endDate;
    }
    return filters;
  };

  // Validate date range (max 60 days)
  const validateDateRange = (start, end) => {
    if (!start || !end) return true;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Check if end date is before start date
    if (endDate < startDate) {
      setDateFilter(prev => ({ ...prev, error: 'End date must be after start date' }));
      return false;
    }
    
    // Calculate difference in days
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 60) {
      setDateFilter(prev => ({ ...prev, error: 'Date range cannot exceed 60 days' }));
      return false;
    }
    
    setDateFilter(prev => ({ ...prev, error: '' }));
    return true;
  };

  // Handle date filter change
  const handleDateChange = (field, value) => {
    setDateFilter(prev => ({ ...prev, [field]: value, error: '' }));
  };

  // Apply date filter
  const applyDateFilter = () => {
    if (!validateDateRange(dateFilter.startDate, dateFilter.endDate)) {
      return;
    }
    
    const filters = buildFilters();
    loadUrls(1, 10, filters);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateFilter({ startDate: '', endDate: '', error: '' });
    loadUrls(1, 10, {});
  };

  // Start editing title
  const startEditTitle = (urlId, currentTitle) => {
    setTitleEdit({
      editingId: urlId,
      editValue: currentTitle || '',
      updating: false
    });
  };

  // Cancel editing title
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
      const response = await axios.put(`${API_BASE}/url-shortner/`, {
        url_id: urlCode,
        title: trimmedTitle === '' ? null : trimmedTitle
      }, {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        // Update the local state
        setUrlHistory(prev => ({
          ...prev,
          data: prev.data.map(url => 
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
        setUrlHistory(prev => ({
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

        // Reload URLs to sync with backend and update pagination
        await loadUrls(urlHistory.pagination.current_page);
      } else {
        alert(result.message || 'Failed to delete URLs');
        setDeleteState(prev => ({ ...prev, deleting: false }));
      }
    } catch (error) {
      alert('An error occurred while deleting URLs');
      setDeleteState(prev => ({ ...prev, deleting: false }));
    }
  };

  // Load URLs on component mount
  useEffect(() => {
    loadUrls();
  }, []);

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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Dashboard</span>
              </button>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                URL History
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Your Complete URL History
              {urlHistory.pagination.total_items > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({urlHistory.pagination.total_items} total)
                </span>
              )}
            </h3>
            
            {/* Date Filter - Right Corner */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  placeholder="Start Date"
                  className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  placeholder="End Date"
                  className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                />
                <button
                  onClick={applyDateFilter}
                  disabled={!dateFilter.startDate && !dateFilter.endDate}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Search URLs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                {(dateFilter.startDate || dateFilter.endDate) && (
                  <button
                    onClick={clearDateFilter}
                    className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
                    title="Clear filter"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {dateFilter.error && (
                <div className="text-xs text-red-600 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {dateFilter.error}
                </div>
              )}
              {!dateFilter.error && (dateFilter.startDate || dateFilter.endDate) && (
                <p className="text-xs text-gray-500">Max 60 days range</p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            
            {/* Selection Mode Toggle */}
            {urlHistory.data.length > 0 && (
              <div className="flex items-center space-x-3">
                {!deleteState.selectionMode ? (
                  <button
                    onClick={toggleSelectionMode}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors cursor-pointer text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Select URLs</span>
                  </button>
                ) : (
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
              </div>
            )}
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
              <p>Create your first short URL to get started!</p>
            </div>
          )}

          {/* URL List */}
          {!urlHistory.loading && !urlHistory.error && urlHistory.data.length > 0 && (
            <div className="space-y-4">
              {urlHistory.data.map((urlItem) => (
                <div key={urlItem.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
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
                    
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium text-gray-900 truncate" title={urlItem.url}>
                        {urlItem.url.length > 60 ? `${urlItem.url.substring(0, 60)}...` : urlItem.url}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-blue-600 font-mono text-sm">
                          {API_HOST}/{urlItem.code}
                        </span>
                        {!deleteState.selectionMode && (
                          <button
                            onClick={() => openDeleteModal(urlItem.code)}
                            className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer hover:scale-110"
                            title="Delete URL"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => shareUrl(`${API_HOST}/${urlItem.code}`, 'Check out this link from Shortify!')}
                          className="ml-2 p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title="Share URL"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => copyToClipboard(`${API_HOST}/${urlItem.code}`)}
                          className="ml-2 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
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
                          className="ml-2 text-gray-400 hover:text-green-600 transition-colors cursor-pointer"
                          title="Open short URL"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      {/* Title display - below short URL, above stats */}
                      {titleEdit.editingId === urlItem.id ? (
                        <div className="flex items-center gap-2 mt-1 mb-1">
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
                              }
                            }}
                            maxLength={15}
                            placeholder="Enter title (max 15 chars)"
                            disabled={titleEdit.updating}
                            className="flex-1 px-3 py-1.5 text-sm border-2 border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <span className="text-xs text-gray-500">{titleEdit.editValue.length}/15</span>
                          <button
                            onClick={() => updateTitle(urlItem.id)}
                            disabled={titleEdit.updating}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer disabled:opacity-50"
                            title="Save title"
                          >
                            {titleEdit.updating ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={cancelEditTitle}
                            disabled={titleEdit.updating}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer disabled:opacity-50"
                            title="Cancel"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEditTitle(urlItem.id, urlItem.title)}
                          className="cursor-pointer hover:bg-gray-50 rounded px-2 py-1.5 mt-1 mb-1 inline-block"
                          title="Click to edit title"
                        >
                          {urlItem.title && urlItem.title !== null && urlItem.title.trim() !== '' ? (
                            <p className="text-sm text-gray-700 font-semibold">🏷️ {urlItem.title}</p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No title</p>
                          )}
                        </div>
                      )}
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

export default History;

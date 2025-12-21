import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

const History = () => {
  usePageTitle('History');
  
  const { fetchUrls, deleteUrls, API_BASE, API_HOST } = useAuth();
  const navigate = useNavigate();
  
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
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Your Complete URL History
              {urlHistory.pagination.total_items > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({urlHistory.pagination.total_items} total)
                </span>
              )}
            </h3>
            
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
    </div>
  );
};

export default History;

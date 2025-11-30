import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

const History = () => {
  usePageTitle('History');
  
  const { fetchUrls, API_BASE } = useAuth();
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
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Load URLs on component mount
  useEffect(() => {
    loadUrls();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
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
      </main>
    </div>
  );
};

export default History;

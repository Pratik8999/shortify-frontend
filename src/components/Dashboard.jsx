import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Shortify Dashboard
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome back!</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
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
          
          {/* URL Shortener Form - We'll implement this next */}
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
                <div className="flex gap-3">
                  <input
                    type="url"
                    placeholder="https://example.com/very-long-url-here"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300">
                    Shorten
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent URLs Section */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Your Recent URLs
            </h3>
            <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
              No URLs shortened yet. Create your first short URL above!
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

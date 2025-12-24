import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import usePageTitle from '../hooks/usePageTitle';

const HelpCenter = () => {
  usePageTitle('Help Center - Shortify');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          question: 'How do I create a shortened URL?',
          answer: 'To create a shortened URL, sign up or log in to your account, go to your dashboard, and paste your long URL in the input field. You can optionally add a custom short code. Click "Shorten URL" and your short link will be generated instantly.'
        },
        {
          question: 'Do I need an account to use Shortify?',
          answer: 'Yes, you need to create a free account to use Shortify. This allows you to manage your links, track analytics, view history, and access all features. Registration is quick and only requires your name, email, and password.'
        },
        {
          question: 'Is Shortify free to use?',
          answer: 'Yes, Shortify is completely free to use. You can create unlimited shortened URLs, track analytics, and access all core features at no cost.'
        }
      ]
    },
    {
      category: 'URL Management',
      questions: [
        {
          question: 'Can I customize my short URLs?',
          answer: 'Yes! When creating a shortened URL, you can provide a custom short code instead of using the randomly generated one. Custom codes must be unique and can contain letters, numbers, hyphens, and underscores.'
        },
        {
          question: 'How do I delete a shortened URL?',
          answer: 'You can delete URLs from your History page. Select the URLs you want to delete using the checkboxes, then click the "Delete Selected" button. Once deleted, the short links will no longer redirect to the original URLs.'
        },
        {
          question: 'Can I edit a URL after creating it?',
          answer: 'Currently, you cannot edit the destination URL of an existing short link. If you need to change the destination, you\'ll need to create a new shortened URL and delete the old one.'
        },
        {
          question: 'Is there a limit to how many URLs I can shorten?',
          answer: 'No, there is no limit. You can create as many shortened URLs as you need with your free account.'
        }
      ]
    },
    {
      category: 'Analytics & Tracking',
      questions: [
        {
          question: 'What analytics data can I track?',
          answer: 'Shortify provides comprehensive analytics including: total clicks, unique clicks, geographic data (countries and cities), device types, browsers, operating systems, referrer sources, and click timestamps. You can view all this data on the Analytics page.'
        },
        {
          question: 'How do I view analytics for my shortened URLs?',
          answer: 'Navigate to the Analytics page from your dashboard. You can select any of your shortened URLs from the dropdown menu to view detailed statistics and charts for that specific link.'
        },
        {
          question: 'Are analytics updated in real-time?',
          answer: 'Yes, analytics data is updated in real-time. Every time someone clicks your shortened URL, the analytics are immediately recorded and will be reflected when you refresh the Analytics page.'
        },
        {
          question: 'What information do you collect from visitors?',
          answer: 'When someone clicks your shortened URL, we collect browser information, device type, operating system, approximate location (country/city), and referrer source. This data is used solely for analytics purposes and is anonymized. No personally identifiable information is stored.'
        }
      ]
    },
    {
      category: 'Account & Security',
      questions: [
        {
          question: 'How do I reset my password?',
          answer: 'Currently, you can update your password through your Profile settings in the dashboard. Navigate to your profile, enter your current password and new password, and save the changes. If you\'ve forgotten your password, please contact support.'
        },
        {
          question: 'Is my data secure?',
          answer: 'Yes, we take security seriously. All passwords are encrypted, we use secure HTTPS connections, and implement industry-standard security measures to protect your data. See our Privacy Policy for more details.'
        },
        {
          question: 'Can I delete my account?',
          answer: 'Yes, you can delete your account from the Profile settings. Please note that this will permanently delete all your shortened URLs, analytics data, and account information. This action cannot be undone.'
        },
        {
          question: 'How do I update my profile information?',
          answer: 'Go to the Profile section in your dashboard. There you can update your name, email, and password. Make sure to save your changes before leaving the page.'
        }
      ]
    },
    {
      category: 'Link Behavior',
      questions: [
        {
          question: 'Do shortened URLs expire?',
          answer: 'No, shortened URLs do not expire. They will continue to work indefinitely unless you manually delete them from your account.'
        },
        {
          question: 'What happens if someone clicks a deleted short URL?',
          answer: 'If a short URL has been deleted, visitors will see an error page indicating that the link is no longer available or does not exist.'
        },
        {
          question: 'Are there any restrictions on what URLs I can shorten?',
          answer: 'Yes, we do not allow URLs that contain illegal content, malware, phishing attempts, adult content, hate speech, or violate intellectual property rights. Violating our Acceptable Use Policy may result in account termination.'
        }
      ]
    },
    {
      category: 'Technical Issues',
      questions: [
        {
          question: 'My shortened URL is not working. What should I do?',
          answer: 'First, verify that the URL still exists in your History page. If it does, check that the original URL is still valid and accessible. If problems persist, try creating a new shortened URL or contact our support team.'
        },
        {
          question: 'Why can\'t I log in to my account?',
          answer: 'Make sure you\'re using the correct email and password. Check that Caps Lock is off and there are no extra spaces. If you\'ve forgotten your password, please contact support for assistance.'
        },
        {
          question: 'The analytics page is not loading. What can I do?',
          answer: 'Try refreshing the page or clearing your browser cache. Make sure you have a stable internet connection. If the issue persists, try using a different browser or contact support.'
        },
        {
          question: 'I\'m getting an error when creating a short URL. Why?',
          answer: 'This could be due to several reasons: the custom code you chose might already be taken, the original URL might be invalid, or there might be a temporary server issue. Try using a different custom code or refreshing the page.'
        }
      ]
    },
    {
      category: 'Privacy & Legal',
      questions: [
        {
          question: 'What data do you collect about me?',
          answer: 'We collect your name, email, and password when you register. We also collect analytics data when people click your shortened URLs (browser info, device type, location). See our Privacy Policy for complete details.'
        },
        {
          question: 'Do you share my data with third parties?',
          answer: 'No, we do not sell your data to third parties. We may share data with trusted service providers who help us operate our platform, but only as necessary. See our Privacy Policy for more information.'
        },
        {
          question: 'Can I export my data?',
          answer: 'Yes, you can export your URL history and analytics data. This feature is available in your dashboard settings.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="w-full z-10 px-5 py-5 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div 
            onClick={() => navigate('/')}
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer"
          >
            Shortify
          </div>
          <button
            onClick={() => navigate(user?.isAuthenticated ? '/dashboard' : '/')}
            className="px-5 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            ← Back to {user?.isAuthenticated ? 'Dashboard' : 'Home'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-5 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Help Center
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Find answers to common questions about Shortify. Can't find what you're looking for?{' '}
            <a href="/contact" className="text-blue-600 hover:underline font-medium">
              Contact us
            </a>
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div 
            onClick={() => navigate('/contact')}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-100"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Contact Support</h3>
            <p className="text-gray-600 text-sm">Get in touch with our support team for personalized help</p>
          </div>

          <div 
            onClick={() => navigate('/privacy')}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-100"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Privacy Policy</h3>
            <p className="text-gray-600 text-sm">Learn how we protect and manage your data</p>
          </div>

          <div 
            onClick={() => navigate('/terms')}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-100"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Terms of Service</h3>
            <p className="text-gray-600 text-sm">Read our terms and acceptable use policy</p>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Frequently Asked Questions</h2>
          
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-8 last:mb-0">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mr-3"></span>
                {category.category}
              </h3>
              
              <div className="space-y-3">
                {category.questions.map((faq, faqIndex) => {
                  const globalIndex = `${categoryIndex}-${faqIndex}`;
                  const isOpen = openFaq === globalIndex;
                  
                  return (
                    <div 
                      key={faqIndex}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-all"
                    >
                      <button
                        onClick={() => toggleFaq(globalIndex)}
                        className="w-full px-5 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                        <svg 
                          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {isOpen && (
                        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still Need Help Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Still need help?</h2>
          <p className="mb-6 text-blue-100">
            Our support team is here to help you with any questions or issues
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-full hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
          >
            Contact Support
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-gray-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Shortify. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HelpCenter;

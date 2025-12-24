import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

const PrivacyPolicy = () => {
  usePageTitle('Privacy Policy - Shortify');
  const navigate = useNavigate();

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
            onClick={() => navigate('/')}
            className="px-5 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            ← Back to Home
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-5 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-gray-500 mb-8">Last updated: December 24, 2025</p>

          <div className="space-y-8 text-gray-700">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Introduction</h2>
              <p className="leading-relaxed">
                Welcome to Shortify. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you about how we look after your personal data when you visit our 
                website and use our URL shortening services, and tell you about your privacy rights.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Information We Collect</h2>
              <p className="leading-relaxed mb-3">
                We collect and process the following types of information:
              </p>
              <div className="ml-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">2.1 Account Information</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Password (encrypted)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">2.2 URL Data</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Original URLs you shorten</li>
                    <li>Custom short codes (if provided)</li>
                    <li>Creation timestamps</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">2.3 Analytics Information</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Browser type and version</li>
                    <li>Device information</li>
                    <li>A few similar parameters for analytics purposes</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. How We Use Your Information</h2>
              <p className="leading-relaxed mb-3">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>To provide and maintain our URL shortening service</li>
                <li>To create and manage your account</li>
                <li>To generate analytics and statistics for your shortened URLs</li>
                <li>To improve our services and user experience</li>
                <li>To communicate with you about service updates or issues</li>
                <li>To prevent fraud and ensure platform security</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Data Sharing and Disclosure</h2>
              <p className="leading-relaxed mb-3">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Service Providers:</strong> We may share data with trusted third-party service providers who assist us in operating our platform</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid legal requests</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred</li>
                <li><strong>With Your Consent:</strong> We may share information with your explicit consent for specific purposes</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Data Security</h2>
              <p className="leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data against 
                unauthorized access, alteration, disclosure, or destruction. This includes:
              </p>
              <ul className="list-disc ml-6 space-y-2 mt-3">
                <li>Encryption of sensitive data (passwords, tokens)</li>
                <li>Secure HTTPS connections</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure data storage practices</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Data Retention</h2>
              <p className="leading-relaxed">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined 
                in this privacy policy. When you delete your account, we will delete or anonymize your personal data, 
                except where we are required to retain it for legal or legitimate business purposes.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Your Privacy Rights</h2>
              <p className="leading-relaxed mb-3">
                You have the following rights regarding your personal data:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Access:</strong> Request access to your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Export:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Opt-out:</strong> Opt-out of marketing communications</li>
              </ul>
              <p className="leading-relaxed mt-3">
                To exercise these rights, please contact us at the email address provided below.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Cookies and Tracking</h2>
              <p className="leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience on our platform. 
                These technologies help us remember your preferences, analyze usage patterns, and improve our services. 
                You can control cookie settings through your browser preferences.
              </p>
            </section>

            {/* Third-Party Links */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Third-Party Links</h2>
              <p className="leading-relaxed">
                Our service allows you to shorten URLs that link to third-party websites. We are not responsible 
                for the privacy practices or content of these external sites. We encourage you to review the 
                privacy policies of any third-party sites you visit.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Children's Privacy</h2>
              <p className="leading-relaxed">
                Our service is not intended for children under the age of 13. We do not knowingly collect 
                personal information from children. If you believe we have collected information from a child, 
                please contact us immediately, and we will take steps to delete such information.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Changes to This Privacy Policy</h2>
              <p className="leading-relaxed">
                We may update this privacy policy from time to time to reflect changes in our practices or for 
                legal, operational, or regulatory reasons. We will notify you of any material changes by posting 
                the updated policy on this page with a new "Last updated" date. We encourage you to review this 
                policy periodically.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">12. Contact Us</h2>
              <p className="leading-relaxed mb-3">
                If you have any questions, concerns, or requests regarding this privacy policy or our data practices, 
                please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="font-semibold text-gray-900 mb-2">Contact Information:</p>
                <p className="text-gray-700">Email: <a href="mailto:privacy@shortify.com" className="text-blue-600 hover:underline">privacy@shortify.com</a></p>
                <p className="text-gray-700 mt-2">Or use our <a href="/contact" className="text-blue-600 hover:underline">Contact Form</a></p>
              </div>
            </section>
          </div>
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

export default PrivacyPolicy;

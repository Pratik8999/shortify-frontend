import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

const TermsOfService = () => {
  usePageTitle('Terms of Service - Shortify');
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
            Terms of Service
          </h1>
          <p className="text-gray-500 mb-8">Last updated: December 24, 2025</p>

          <div className="space-y-8 text-gray-700">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using Shortify ("the Service"), you accept and agree to be bound by these Terms of Service 
                ("Terms"). If you do not agree to these Terms, please do not use our Service. We reserve the right to 
                modify these Terms at any time, and your continued use of the Service constitutes acceptance of any changes.
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Service Description</h2>
              <p className="leading-relaxed mb-3">
                Shortify is a URL shortening service that allows you to:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Convert long URLs into shorter, more manageable links</li>
                <li>Create custom short codes for your URLs</li>
                <li>Track analytics and statistics for your shortened URLs</li>
                <li>Manage your URL history through a personal dashboard</li>
                <li>Access detailed click analytics including geographic data, device information, and referrer sources</li>
              </ul>
            </section>

            {/* Account Registration */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. Account Registration and Security</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">3.1 Account Creation</h3>
                  <p className="leading-relaxed">
                    To use certain features of the Service, you must register for an account. You agree to provide 
                    accurate, current, and complete information during registration and to update such information 
                    to keep it accurate and current.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">3.2 Account Security</h3>
                  <p className="leading-relaxed">
                    You are responsible for maintaining the confidentiality of your account credentials and for all 
                    activities that occur under your account. You agree to immediately notify us of any unauthorized 
                    use of your account or any other breach of security.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">3.3 Age Requirement</h3>
                  <p className="leading-relaxed">
                    You must be at least 13 years old to use this Service. By using the Service, you represent and 
                    warrant that you meet this age requirement.
                  </p>
                </div>
              </div>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Acceptable Use Policy</h2>
              <p className="leading-relaxed mb-3">
                You agree not to use the Service to shorten URLs that:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Contain or promote illegal content, activities, or services</li>
                <li>Distribute malware, viruses, or other harmful software</li>
                <li>Facilitate phishing, fraud, or identity theft</li>
                <li>Contain adult content, violence, or hate speech</li>
                <li>Infringe upon intellectual property rights of others</li>
                <li>Spam, harass, or send unsolicited communications</li>
                <li>Violate the privacy rights of others</li>
                <li>Mislead or deceive users about the destination URL</li>
                <li>Attempt to bypass, circumvent, or disable security features</li>
              </ul>
              <p className="leading-relaxed mt-3">
                We reserve the right to remove any shortened URLs and terminate accounts that violate these policies 
                without prior notice.
              </p>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Data Collection and Usage</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">5.1 Information We Collect</h3>
                  <p className="leading-relaxed mb-2">
                    To enhance our services and provide you with detailed analytics, we may collect the following 
                    information when users click on your shortened URLs:
                  </p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Browser type, version, and user agent string</li>
                    <li>Device type and operating system</li>
                    <li>IP address (anonymized for privacy)</li>
                    <li>Geographic location (country and city level)</li>
                    <li>Referrer website or source</li>
                    <li>Timestamp of click events</li>
                    <li>Screen resolution and browser window size</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">5.2 Purpose of Data Collection</h3>
                  <p className="leading-relaxed">
                    This information is collected solely for the purpose of providing analytics, improving our services, 
                    preventing abuse, and enhancing user experience. We do not sell this data to third parties. 
                    For more details, please refer to our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">5.3 Cookie Usage</h3>
                  <p className="leading-relaxed">
                    We use cookies and similar technologies to maintain your session, remember your preferences, 
                    and analyze usage patterns. By using our Service, you consent to our use of cookies as described 
                    in our Privacy Policy.
                  </p>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Intellectual Property Rights</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">6.1 Our Rights</h3>
                  <p className="leading-relaxed">
                    The Service, including its design, features, functionality, and all related intellectual property, 
                    is owned by Shortify and is protected by copyright, trademark, and other intellectual property laws.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">6.2 Your Content</h3>
                  <p className="leading-relaxed">
                    You retain all rights to the URLs you shorten. By using our Service, you grant us a limited license 
                    to store, process, and display your URLs and related data solely for the purpose of providing the Service.
                  </p>
                </div>
              </div>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Service Availability and Modifications</h2>
              <p className="leading-relaxed">
                We strive to provide reliable and uninterrupted service, but we do not guarantee that the Service will 
                always be available, error-free, or secure. We reserve the right to:
              </p>
              <ul className="list-disc ml-6 space-y-2 mt-3">
                <li>Modify, suspend, or discontinue any aspect of the Service at any time</li>
                <li>Impose limits on certain features or restrict access to parts of the Service</li>
                <li>Perform maintenance and updates that may temporarily interrupt service</li>
              </ul>
              <p className="leading-relaxed mt-3">
                We will make reasonable efforts to notify users of significant changes or extended service interruptions.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Disclaimer and Limitation of Liability</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">8.1 "As Is" Service</h3>
                  <p className="leading-relaxed">
                    The Service is provided "as is" and "as available" without warranties of any kind, either express 
                    or implied, including but not limited to warranties of merchantability, fitness for a particular 
                    purpose, or non-infringement.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">8.2 Third-Party Content</h3>
                  <p className="leading-relaxed">
                    We are not responsible for the content, accuracy, or legality of the URLs you shorten or the 
                    websites they link to. You use the Service at your own risk.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">8.3 Limitation of Liability</h3>
                  <p className="leading-relaxed">
                    To the maximum extent permitted by law, Shortify and its affiliates shall not be liable for any 
                    indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, 
                    whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
                  </p>
                </div>
              </div>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Indemnification</h2>
              <p className="leading-relaxed">
                You agree to indemnify, defend, and hold harmless Shortify, its affiliates, officers, directors, employees, 
                and agents from any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' 
                fees) arising out of or relating to:
              </p>
              <ul className="list-disc ml-6 space-y-2 mt-3">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>The content of URLs you shorten</li>
              </ul>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Termination</h2>
              <p className="leading-relaxed mb-3">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or 
                liability, for any reason, including but not limited to:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Breach of these Terms</li>
                <li>Violation of our Acceptable Use Policy</li>
                <li>Fraudulent or illegal activity</li>
                <li>Extended period of inactivity</li>
              </ul>
              <p className="leading-relaxed mt-3">
                Upon termination, your right to use the Service will immediately cease. You may also delete your account 
                at any time through your account settings.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Governing Law and Dispute Resolution</h2>
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to 
                conflict of law principles. Any disputes arising from these Terms or your use of the Service shall be 
                resolved through good faith negotiation. If a resolution cannot be reached, disputes may be submitted 
                to binding arbitration or the appropriate courts.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">12. Changes to Terms</h2>
              <p className="leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of material changes by 
                posting the updated Terms on this page with a new "Last updated" date. Your continued use of the Service 
                after such changes constitutes your acceptance of the new Terms. We encourage you to review these Terms 
                periodically.
              </p>
            </section>

            {/* Miscellaneous */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">13. Miscellaneous</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">13.1 Entire Agreement</h3>
                  <p className="leading-relaxed">
                    These Terms, together with our Privacy Policy, constitute the entire agreement between you and 
                    Shortify regarding the use of the Service.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">13.2 Severability</h3>
                  <p className="leading-relaxed">
                    If any provision of these Terms is found to be unenforceable or invalid, that provision will be 
                    limited or eliminated to the minimum extent necessary, and the remaining provisions will remain 
                    in full force and effect.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">13.3 No Waiver</h3>
                  <p className="leading-relaxed">
                    Our failure to enforce any right or provision of these Terms will not be considered a waiver of 
                    those rights.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">14. Contact Information</h2>
              <p className="leading-relaxed mb-3">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="font-semibold text-gray-900 mb-2">Contact Information:</p>
                <p className="text-gray-700">Email: <a href="mailto:support@shortify.com" className="text-blue-600 hover:underline">support@shortify.com</a></p>
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

export default TermsOfService;

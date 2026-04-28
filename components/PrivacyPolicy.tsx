import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../utils/useDocumentMeta';
import LegalNav from './LegalNav';

const PrivacyPolicy: React.FC = () => {
  useDocumentMeta({
    title: 'Privacy Policy - HEADZ Hair Fixing App',
    description:
      'How HEADZ collects, uses, and protects your personal data, including details about Google Sign-In and how we handle uploaded photos.',
    path: '/privacy',
  });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LegalNav />

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="pt-28 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#E1262D]">
            Privacy Policy
          </h1>

          <div className="text-gray-700 space-y-8 leading-relaxed">
            <p className="text-lg">
              <strong>Effective Date:</strong> September 8, 2024
            </p>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">1. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#E1262D] mb-2">Photos and Images</h3>
                  <p>We collect and process the photos you upload to our platform for the purpose of providing AI-powered hairstyle transformations. These images are temporarily stored during processing and are automatically deleted after 24 hours.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#E1262D] mb-2">Account Information</h3>
                  <p>We use Google Sign-In as our only authentication method. When you sign in, we receive your name, email address, and Google account profile picture from Google. We do not collect or store passwords. You may also voluntarily provide your phone number and location during sign-up to help us improve your experience.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#E1262D] mb-2">Usage Data</h3>
                  <p>We collect anonymous usage statistics to improve our service, including feature usage patterns and performance metrics.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Process your photos to generate hairstyle transformations</li>
                <li>Provide personalized hairstyle recommendations</li>
                <li>Maintain and improve our AI algorithms</li>
                <li>Send important service updates and notifications</li>
                <li>Ensure platform security and prevent abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">3. Data Security</h2>
              <p>We implement industry-standard security measures to protect your personal information:</p>
              <ul className="list-disc list-inside mt-4 space-y-2">
                <li>End-to-end encryption for image uploads and processing</li>
                <li>Secure data storage with regular security audits</li>
                <li>Limited access controls for our team members</li>
                <li>Automatic deletion of processed images within 24 hours</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">4. Data Sharing</h2>
              <p>We do not sell, rent, or share your personal information with third parties except:</p>
              <ul className="list-disc list-inside mt-4 space-y-2">
                <li>When required by law or legal process</li>
                <li>To protect our rights, property, or safety</li>
                <li>With trusted service providers who assist in operating our platform (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside mt-4 space-y-2">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of non-essential communications</li>
                <li>Request data portability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">6. Cookies and Tracking</h2>
              <p>We use essential cookies to maintain your session and improve your experience. We do not use third-party tracking cookies for advertising purposes.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">7. Children's Privacy</h2>
              <p>Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">8. Updates to This Policy</h2>
              <p>We may update this privacy policy from time to time. We will notify you of any significant changes via email or through our platform.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">9. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at:</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p>Email: privacy@HEADZ HAIR FIXING APP</p>
                <p>Address: HEADZ HAIR FIXING APP Privacy Team</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-2xl font-bold text-[#E1262D] mb-4 md:mb-0">
              HEADZ HAIR FIXING APP
            </div>
            <div className="flex gap-6 text-gray-500">
              <Link to="/" className="hover:text-[#E1262D] transition-colors">Home</Link>
              <Link to="/app" className="hover:text-[#E1262D] transition-colors">App</Link>
              <Link to="/privacy" className="hover:text-[#E1262D] transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-[#E1262D] transition-colors">Terms</Link>
            </div>
          </div>
          <div className="text-center text-gray-400 mt-8">
            © 2024 HEADZ HAIR FIXING APP. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
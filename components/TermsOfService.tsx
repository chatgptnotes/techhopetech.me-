import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../utils/useDocumentMeta';
import LegalNav from './LegalNav';

const TermsOfService: React.FC = () => {
  useDocumentMeta({
    title: 'Terms of Service - HEADZ Hair Fixing App',
    description:
      'The terms that govern your use of HEADZ Hair Fixing App, including acceptable use, account responsibilities, and limitations of liability.',
    path: '/terms',
  });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LegalNav />

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="pt-28 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#E1262D]">
            Terms of Service
          </h1>

          <div className="text-gray-700 space-y-8 leading-relaxed">
            <p className="text-lg">
              <strong>Effective Date:</strong> September 8, 2024
            </p>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">1. Acceptance of Terms</h2>
              <p>By accessing and using HEADZ HAIR FIXING APP ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">2. Description of Service</h2>
              <p>HEADZ HAIR FIXING APP is an AI-powered virtual hairstyling platform that allows users to try on different hairstyles and looks using artificial intelligence technology. Our service includes:</p>
              <ul className="list-disc list-inside mt-4 space-y-2">
                <li>Virtual hairstyle try-on using uploaded photos</li>
                <li>A library of preset hairstyles and AI-generated custom styles from text prompts</li>
                <li>Personal gallery of your generated transformations</li>
                <li>Downloadable images of your generated results after sign-in</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">3. User Responsibilities</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#E1262D] mb-2">Account Security</h3>
                  <p>You are responsible for keeping your linked Google account secure and for all activities that occur under your HEADZ account. We do not collect or store passwords; sign-in is handled by Google.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#E1262D] mb-2">Content Guidelines</h3>
                  <p>You agree to only upload photos that you own or have permission to use. You must not upload:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Photos of minors without parental consent</li>
                    <li>Inappropriate, offensive, or explicit content</li>
                    <li>Photos that violate others' privacy or rights</li>
                    <li>Copyrighted images without permission</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">4. Intellectual Property</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#E1262D] mb-2">Your Content</h3>
                  <p>You retain ownership of the photos you upload. By using our service, you grant us a temporary license to process your images for the sole purpose of providing hairstyle transformations.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#E1262D] mb-2">Our Technology</h3>
                  <p>All AI models, algorithms, and generated transformations are proprietary to HEADZ HAIR FIXING APP. You may not reverse engineer, copy, or distribute our technology.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">5. Service Availability</h2>
              <p>While we strive for 99.9% uptime, we cannot guarantee uninterrupted service. We reserve the right to:</p>
              <ul className="list-disc list-inside mt-4 space-y-2">
                <li>Modify or discontinue the service with reasonable notice</li>
                <li>Perform scheduled maintenance that may temporarily affect availability</li>
                <li>Limit usage to ensure fair access for all users</li>
                <li>Suspend accounts that violate these terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">6. AI Technology Disclaimer</h2>
              <p>Our AI-generated hairstyle transformations are for entertainment and preview purposes only. Please note:</p>
              <ul className="list-disc list-inside mt-4 space-y-2">
                <li>Results may not be 100% accurate to real-world styling</li>
                <li>Individual hair texture and type may affect actual results</li>
                <li>We recommend consulting with professional stylists before making significant changes</li>
                <li>Results are not guaranteed and may vary based on photo quality</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">7. Limitation of Liability</h2>
              <p>HEADZ HAIR FIXING APP shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:</p>
              <ul className="list-disc list-inside mt-4 space-y-2">
                <li>Dissatisfaction with AI-generated results</li>
                <li>Hair styling decisions based on our transformations</li>
                <li>Temporary service interruptions</li>
                <li>Loss of data due to technical issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">8. Privacy and Data Protection</h2>
              <p>Your privacy is important to us. Our data practices are outlined in our Privacy Policy, which is incorporated into these Terms by reference. Key points include:</p>
              <ul className="list-disc list-inside mt-4 space-y-2">
                <li>Uploaded photos are automatically deleted within 24 hours</li>
                <li>We do not share personal data with third parties for marketing</li>
                <li>Account data is encrypted and securely stored</li>
                <li>You can request data deletion at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">9. Account and Sign-In</h2>
              <p>HEADZ HAIR FIXING APP is currently free to use. Authentication is handled exclusively through Google Sign-In; you do not create or manage a password with us. Some features (such as downloading your generated image without a watermark) require sign-in.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">10. Termination</h2>
              <p>We may terminate or suspend your account immediately, without prior notice, if you breach these Terms of Service. Upon termination, your data will be deleted in accordance with our Privacy Policy.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">11. Changes to Terms</h2>
              <p>We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or platform notification. Continued use of the service after changes constitutes acceptance of the new terms.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">12. Governing Law</h2>
              <p>These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#E1262D] mb-4">13. Contact Information</h2>
              <p>If you have any questions about these Terms of Service, please contact us at:</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p>Email: support@HEADZ HAIR FIXING APP</p>
                <p>Legal: legal@HEADZ HAIR FIXING APP</p>
                <p>Address: HEADZ HAIR FIXING APP Legal Team</p>
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

export default TermsOfService;
import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function PrivacyPolicy() {
  return (
    <Layout>
      <Head>
        <title>TESOLA - Privacy Policy</title>
        <meta name="description" content="TESOLA NFT project privacy policy" />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800/30 border border-purple-500/20 rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1-.257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
            </svg>
            TESOLA Privacy Policy
          </h1>
          <p className="text-gray-400 mb-6">Effective Date: May 5, 2025</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">1. Scope of This Policy</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>This Privacy Policy applies to all users who visit the TESOLA website, participate in NFT minting or staking, or engage with our services.</li>
                <li>This Policy does not cover third-party websites or external services that may be linked from our website. Users should review the privacy policies of any third-party services they interact with.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">2. Information We Collect</h2>
              <p className="text-gray-300 mb-3">We may collect different types of information, including personal data and technical information, when you interact with our platform.</p>
              
              <h3 className="text-lg font-semibold text-white mb-2">Personal Information (Provided by You)</h3>
              <p className="text-gray-300 mb-2">We collect personal information when you voluntarily provide it, including but not limited to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>Cryptocurrency wallet address (for NFT minting, staking, and TESOLA token transactions)</li>
                <li>Telegram username (when joining our community channel for updates)</li>
                <li>Social media handles (when participating in community activities)</li>
                <li>Any other details you voluntarily submit through our Telegram support channel</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-white mt-4 mb-2">Automatically Collected Information</h3>
              <p className="text-gray-300 mb-2">When you access our website, we may automatically collect certain information through cookies and similar tracking technologies, including:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>IP address</li>
                <li>Device and browser type</li>
                <li>Operating system details</li>
                <li>Time and date of your visit</li>
                <li>Website navigation behavior (e.g., pages visited, time spent on each page)</li>
                <li>Blockchain transaction data (which is publicly available on the Solana blockchain)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">3. How We Use Your Information</h2>
              <p className="text-gray-300 mb-2">We process collected data for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>To facilitate NFT minting, staking, and distribution of TESOLA tokens.</li>
                <li>To provide customer support and respond to inquiries.</li>
                <li>To improve the functionality and security of our website.</li>
                <li>To communicate with you regarding updates, announcements, and important project developments.</li>
                <li>To track and distribute staking rewards.</li>
                <li>To comply with applicable laws and regulations, including fraud prevention.</li>
              </ul>
              <p className="text-gray-300 mt-3">We will never sell, rent, or trade your personal data to third parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">4. Sharing and Disclosure of Information</h2>
              <p className="text-gray-300 mb-2">We value your privacy and limit the sharing of your information to specific circumstances:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><span className="font-semibold text-white">Third-Party Service Providers:</span> We may share data with trusted third-party partners who assist in operating our website and services, such as analytics providers or security services.</li>
                <li><span className="font-semibold text-white">Legal Compliance:</span> We may disclose information when required to comply with legal obligations, governmental authorities, or court orders.</li>
                <li><span className="font-semibold text-white">Business Transfers:</span> In the event of a merger, acquisition, or restructuring, user information may be transferred as part of the process.</li>
              </ul>
              <p className="text-gray-300 mt-3">We do not sell or share personal data for advertising purposes.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">5. Cookies and Tracking Technologies</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>We use cookies, pixel tags, and similar technologies to enhance user experience, analyze website traffic, and optimize platform performance.</li>
                <li>Cookies allow us to remember user preferences and improve functionality.</li>
                <li>You may adjust your browser settings to reject cookies, but some site features may not function properly without them.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">6. Data Security Measures</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>We implement industry-standard security measures to protect your information from unauthorized access, disclosure, or misuse.</li>
                <li>We use encryption protocols and secure servers to safeguard user data.</li>
                <li>Access to sensitive information is restricted to authorized personnel only.</li>
                <li>While we take all reasonable precautions, no method of data transmission is 100% secure. Users are responsible for securing their own devices and cryptocurrency wallets.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">7. Your Rights and Choices</h2>
              <p className="text-gray-300 mb-2">Depending on your jurisdiction, you may have rights regarding your personal information, including:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>The right to access your personal data.</li>
                <li>The right to request corrections or updates to inaccurate information.</li>
                <li>The right to request deletion of your data (subject to legal and operational requirements).</li>
                <li>The right to withdraw consent for processing your data where applicable.</li>
                <li>The right to opt out of marketing emails by unsubscribing at any time.</li>
              </ul>
              <p className="text-gray-300 mt-3">To exercise any of these rights, please contact us through our official Telegram channel: <a href="https://t.me/tesolachat" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">@tesolachat</a></p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">8. Third-Party Links and Services</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>Our platform may contain links to third-party websites or services.</li>
                <li>We are not responsible for the privacy practices of external sites.</li>
                <li>Users should review their respective privacy policies before engaging with them.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">9. Blockchain Transparency</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>TESOLA operates on the Solana blockchain, which is a public and transparent ledger.</li>
                <li>Transactions involving wallet addresses, NFT ownership, staking activities, and token transfers are publicly visible on the blockchain.</li>
                <li>While wallet addresses themselves do not contain personal information, they may be linked to identities if users have publicly associated their addresses with their personal information elsewhere.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">10. Policy Updates and Modifications</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>We may update this Privacy Policy from time to time.</li>
                <li>Changes will be posted on this page with an updated "Effective Date" at the top.</li>
                <li>Continued use of our platform after modifications constitutes acceptance of the updated policy.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">11. Contact Information</h2>
              <p className="text-gray-300 mb-3">For any privacy-related concerns or requests, please contact us through our official Telegram channel:</p>
              <p><a href="https://t.me/tesolachat" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">@tesolachat</a></p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-700">
            <p className="text-gray-400">By using the TESOLA platform, you confirm that you have read, understood, and agreed to the terms outlined in this Privacy Policy.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
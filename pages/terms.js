import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function TermsOfService() {
  return (
    <Layout>
      <Head>
        <title>TESOLA - Terms of Service</title>
        <meta name="description" content="TESOLA NFT project terms of service" />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800/30 border border-purple-500/20 rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            TESOLA Terms of Service
          </h1>
          <p className="text-gray-400 mb-6">Last Updated: May 5, 2025</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-300 mb-2">By accessing or using the TESOLA website, participating in NFT minting, staking activities, or interacting with our smart contracts, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our services.</p>
              <p className="text-gray-300">These Terms constitute a legally binding agreement between you and TESOLA regarding your use of our platform and services.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">2. Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>You must be at least 18 years old to use our services.</li>
                <li>You must have the legal capacity to enter into these Terms and to use the TESOLA platform in accordance with these Terms.</li>
                <li>You must not be a resident of or located in any jurisdiction where the use of our services would be contrary to applicable laws or regulations.</li>
                <li>If you are using our services on behalf of a business entity, you represent that you have the authority to bind that entity to these Terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">3. TESOLA NFTs and Tokens</h2>
              <h3 className="text-lg font-semibold text-white mb-2">3.1 NFT Ownership</h3>
              <p className="text-gray-300 mb-4">When you purchase a TESOLA NFT, you own the NFT on the Solana blockchain, which includes the right to transfer or sell that NFT. However, ownership of the NFT does not grant you ownership of the underlying intellectual property associated with the NFT content, except as expressly stated in these Terms.</p>
              
              <h3 className="text-lg font-semibold text-white mb-2">3.2 License to NFT Content</h3>
              <p className="text-gray-300 mb-4">As a TESOLA NFT holder, you are granted a worldwide, non-exclusive, royalty-free license to use, display, and enjoy the artwork associated with your owned NFT for personal, non-commercial purposes. This includes displaying the artwork online, using it as a profile picture, and sharing it on social media platforms.</p>
              
              <h3 className="text-lg font-semibold text-white mb-2">3.3 TESOLA Tokens</h3>
              <p className="text-gray-300 mb-4">TESOLA tokens are utility tokens that can be earned through staking NFTs. These tokens do not represent any ownership stake, equity, or rights to future profits in the TESOLA project or any associated entities. TESOLA tokens are not investment products and should not be purchased with expectations of financial returns.</p>
              
              <h3 className="text-lg font-semibold text-white mb-2">3.4 Staking</h3>
              <p className="text-gray-300">Staking TESOLA NFTs is subject to the terms of our staking smart contracts. Rewards are distributed based on predetermined algorithms and may be adjusted over time. While we strive to ensure the security of the staking process, you acknowledge the inherent risks associated with interacting with blockchain technology.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">4. User Conduct</h2>
              <p className="text-gray-300 mb-2">When using the TESOLA platform, you agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Use the platform for any illegal activities or to promote illegal activities</li>
                <li>Attempt to interfere with, compromise, or disrupt the TESOLA platform or its servers</li>
                <li>Use automated systems or software to extract data from the platform (scraping)</li>
                <li>Impersonate TESOLA team members or other users</li>
                <li>Upload or transmit viruses, malware, or other malicious code</li>
                <li>Engage in activities that may damage or tarnish the TESOLA brand and reputation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">5. Risks and Disclaimers</h2>
              <h3 className="text-lg font-semibold text-white mb-2">5.1 Blockchain Risks</h3>
              <p className="text-gray-300 mb-4">You acknowledge the inherent risks associated with blockchain technology, cryptocurrency, and NFTs, including but not limited to price volatility, technological risks, protocol changes, and regulatory uncertainties. TESOLA is not responsible for any losses that may occur due to these risks.</p>
              
              <h3 className="text-lg font-semibold text-white mb-2">5.2 Smart Contract Risks</h3>
              <p className="text-gray-300 mb-4">While we implement security best practices, smart contracts may contain bugs, vulnerabilities, or other issues. You understand that interactions with our smart contracts are at your own risk.</p>
              
              <h3 className="text-lg font-semibold text-white mb-2">5.3 Disclaimer of Warranties</h3>
              <p className="text-gray-300">THE TESOLA PLATFORM, NFTS, AND TOKENS ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">6. Limitation of Liability</h2>
              <p className="text-gray-300">TO THE MAXIMUM EXTENT PERMITTED BY LAW, TESOLA AND ITS AFFILIATES, DIRECTORS, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE PLATFORM; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE PLATFORM; (C) ANY CONTENT OBTAINED FROM THE PLATFORM; OR (D) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">7. Intellectual Property Rights</h2>
              <p className="text-gray-300 mb-2">All intellectual property rights in the TESOLA platform, including but not limited to logos, trademarks, service marks, trade names, artwork, code, designs, and content that is not user-generated, are owned by or licensed to TESOLA.</p>
              <p className="text-gray-300">Except for the limited license expressly granted to NFT holders, nothing in these Terms grants you any rights in the TESOLA name, logos, or any other TESOLA intellectual property.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">8. Modifications to Terms</h2>
              <p className="text-gray-300 mb-2">We reserve the right to modify these Terms at any time. When we make changes, we will post the updated Terms on our website and update the "Last Updated" date at the top of these Terms.</p>
              <p className="text-gray-300">Your continued use of our platform after the updated Terms are posted constitutes your acceptance of the revised Terms. If you do not agree to the new Terms, you must stop using our services.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">9. Governing Law</h2>
              <p className="text-gray-300">These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law principles. Any disputes arising under these Terms shall be resolved in the courts of [Jurisdiction].</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">10. Severability</h2>
              <p className="text-gray-300">If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that the Terms will otherwise remain in full force and effect and enforceable.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-purple-400 mb-3">11. Contact Information</h2>
              <p className="text-gray-300 mb-3">For any questions regarding these Terms, please contact us at:</p>
              <p><a href="mailto:legal@tesola.xyz" className="text-purple-400 hover:text-purple-300 transition-colors">legal@tesola.xyz</a></p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-700">
            <p className="text-gray-400">By using the TESOLA platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    
    // This would be replaced with an actual API call
    setTimeout(() => {
      console.log('Form submission data:', formData);
      // Simulate successful submission
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    }, 1500);
  };

  return (
    <Layout>
      <Head>
        <title>TESOLA - Contact Us</title>
        <meta name="description" content="Contact the TESOLA NFT project team" />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800/30 border border-purple-500/20 rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Contact Us
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-purple-400 mb-4">Get in Touch</h2>
              <p className="text-gray-300 mb-6">
                Have questions about TESOLA NFTs, staking, or any other aspects of our project? 
                We're here to help! Fill out the form or reach out to us through our community channels.
              </p>

              <div className="space-y-5">
                <div className="flex items-start">
                  <div className="bg-purple-900/30 p-3 rounded-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Telegram</h3>
                    <p className="text-gray-300">
                      <a href="https://t.me/tesolachat" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">
                        @tesolachat
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-purple-900/30 p-3 rounded-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Discord</h3>
                    <p className="text-gray-300 flex items-center">
                      <span className="text-purple-400">Coming Soon</span>
                      <span className="ml-2 inline-block bg-gradient-to-r from-blue-400 to-purple-400 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-md animate-pulse">
                        SOON
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-purple-900/30 p-3 rounded-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Twitter</h3>
                    <p className="text-gray-300">
                      <a href="https://twitter.com/TESLAINSOLANA" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">
                        @TESLAINSOLANA
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-purple-900/30 p-3 rounded-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Support Hours</h3>
                    <p className="text-gray-300">
                      Our team is available 24/7 to assist you with any questions or concerns
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-gray-900/50 rounded-lg p-6 border border-purple-500/20">
                <h2 className="text-xl font-bold text-purple-400 mb-4">Contact Us Directly</h2>
                
                <div className="mb-6">
                  <p className="text-gray-300 mb-4">
                    We've simplified our contact process! For the fastest response and best support experience, please contact us directly on Telegram.
                  </p>
                  
                  <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg p-4 mb-6 border border-blue-500/20">
                    <h3 className="text-lg font-semibold text-blue-400 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                      Why Telegram?
                    </h3>
                    <ul className="list-disc pl-5 text-gray-300 space-y-1">
                      <li>24/7 support from our dedicated team</li>
                      <li>Faster response times than email</li>
                      <li>Direct access to our community managers</li>
                      <li>Ability to share screenshots and videos easily</li>
                      <li>Join our growing community of TESOLA enthusiasts</li>
                    </ul>
                  </div>
                </div>
                
                <a
                  href="https://t.me/tesolachat"
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-blue-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 mr-2 fill-current">
                    <path d="M12 0c-6.626 0-12 5.372-12 12 0 6.627 5.374 12 12 12 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12zm3.224 17.871c.188.133.43.131.618-.002.401-.286.175-.857-.394-.857h-6.895c-.57 0-.796.571-.395.857.188.133.43.131.618-.002.932-.661 1.608-1.734 1.608-2.953 0-1.984-1.602-3.592-3.58-3.592s-3.58 1.608-3.58 3.592c0 1.219.676 2.292 1.608 2.953.188.133.43.131.618-.002.401-.286.175-.857-.394-.857h-3.592c-.57 0-.796.571-.395.857.188.133.43.131.618-.002.932-.661 1.608-1.734 1.608-2.953 0-1.984-1.602-3.592-3.58-3.592s-3.58 1.608-3.58 3.592c0 1.219.676 2.292 1.608 2.953zm-.649-5.443c.654-1.561 2.067-3.182 3.425-3.182s2.771 1.621 3.425 3.182c.146.35.681.336.682-.071 0-2.235-1.836-4.046-4.107-4.046s-4.107 1.811-4.107 4.046c0 .407.536.421.682.071z"/>
                  </svg>
                  Contact Us on Telegram
                </a>
                
                <div className="mt-6 text-center text-sm text-gray-400">
                  Our team typically responds within 1-2 hours during business hours.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-700">
            <h2 className="text-xl font-bold text-purple-400 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="bg-gray-900/40 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">How can I mint a TESOLA NFT?</h3>
                <p className="text-gray-300">To mint a TESOLA NFT, connect your Solana wallet to our website and navigate to the mint section. Follow the prompts to complete the minting process.</p>
              </div>
              
              <div className="bg-gray-900/40 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">What are the staking rewards?</h3>
                <p className="text-gray-300">Staking rewards vary based on your NFT's tier and staking duration. Check the staking dashboard for real-time information on current reward rates.</p>
              </div>
              
              <div className="bg-gray-900/40 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">How do I report a technical issue?</h3>
                <p className="text-gray-300">For technical issues, please contact us on <a href="https://t.me/tesolachat" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Telegram (@tesolachat)</a> where our support team is available 24/7 to help you.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
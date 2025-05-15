import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ComingSoonSocialPage() {
  const router = useRouter();
  const { returnUrl, type = 'discord' } = router.query;
  const [animationClass, setAnimationClass] = useState('opacity-0');
  
  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setAnimationClass('opacity-100 transform-none'), 100);
    return () => clearTimeout(timer);
  }, []);

  // Social platform information
  const socialInfo = {
    discord: {
      title: "Discord Community",
      description: "The TESOLA Discord community is coming soon. Join us for the latest updates, exclusive information, and special events.",
      color: "indigo",
      bgColor: "bg-indigo-700",
      borderColor: "border-indigo-500",
      bgGradient: "from-indigo-900/60 to-gray-900/60",
      textColor: "text-indigo-400",
      gradient: "from-indigo-400 via-purple-500 to-indigo-600",
      icon: (
        <svg className="w-12 h-12 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
        </svg>
      ),
      benefits: [
        "Priority whitelist opportunities",
        "Real-time project updates",
        "Direct communication with developers and team",
        "Community-exclusive events and prizes"
      ],
      alternative: "Meet us on Twitter first!"
    },
    github: {
      title: "GitHub Repository",
      description: "The TESOLA open source project will be available soon. Contribute to technical development and collaboration.",
      color: "gray",
      bgColor: "bg-gray-700",
      borderColor: "border-gray-500",
      bgGradient: "from-gray-900/60 to-gray-900/60",
      textColor: "text-gray-400",
      gradient: "from-gray-600 via-gray-500 to-gray-700",
      icon: (
        <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
      benefits: [
        "Access to source code and contributions",
        "Technical documentation and architecture understanding",
        "Collaboration with developer community",
        "Participation in technical proposals and reviews"
      ],
      alternative: "Check Twitter for project updates!"
    }
  };

  // Current platform info (default: discord)
  const currentPlatform = type && socialInfo[type] ? type : 'discord';
  const info = socialInfo[currentPlatform];
  
  return (
    <div className="min-h-screen bg-black bg-[url('/stars.jpg')] bg-cover bg-center flex flex-col items-center justify-center p-4" style={{ minHeight: '-webkit-fill-available' }}>
      <Head>
        <title>{info.title} Coming Soon | TESOLA</title>
        <meta name="description" content={`TESOLA ${info.title} Coming Soon - Join our community for exclusive updates and benefits.`} />
      </Head>
    
      <div 
        className={`max-w-2xl w-full transition-all duration-1000 ease-out transform translate-y-10 ${animationClass}`}
      >
        {/* Top logo / title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            {info.icon}
          </div>
          <h1 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${info.gradient} bg-clip-text text-transparent mb-3`}>
            {info.title}
          </h1>
          <div className="text-xl md:text-2xl font-bold text-white">
            <span className={`${info.bgColor} px-3 py-1 rounded-md`}>COMING SOON</span>
          </div>
        </div>
        
        {/* Main content */}
        <div className={`bg-gradient-to-br ${info.bgGradient} backdrop-blur-lg rounded-2xl border ${info.borderColor}/30 overflow-hidden shadow-2xl`}>
          {/* Top decoration */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${info.gradient}`}></div>
          
          {/* Main announcement */}
          <div className="p-4 sm:p-6 md:p-8">
            <p className={`bg-${info.color}-900/30 p-3 sm:p-4 rounded-lg border-l-4 ${info.borderColor} text-xs sm:text-sm md:text-base leading-tight sm:leading-normal text-gray-200 mb-4 sm:mb-6`}>
              {info.description}
            </p>
            
            <div className="bg-black/30 rounded-lg p-3 sm:p-4 md:p-5 mb-4 sm:mb-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${info.textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Participation Benefits
              </h3>
              
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm md:text-base">
                {info.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${info.textColor} mt-0.5 flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-200 leading-tight line-clamp-2 sm:line-clamp-none">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-3 sm:p-4 md:p-5 text-center">
              <p className="text-gray-300 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">{info.alternative}</p>
              <a
                href="https://x.com/TESLAINSOLANA"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors w-full sm:w-auto text-sm sm:text-base"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                Follow on Twitter/X
              </a>
            </div>
          </div>
          
          {/* Bottom buttons */}
          <div className="bg-black/40 p-4 sm:p-6 flex justify-center">
            <button 
              onClick={() => router.push(returnUrl || '/')}
              className="px-4 sm:px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm sm:text-base"
            >
              Go Back
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          &copy; 2025 TESOLA. All rights reserved.
        </div>
      </div>
      
      {/* Background decoration elements */}
      <div className="fixed top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-20 left-10 w-64 h-64 bg-${info.color}-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob`}></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-blob animation-delay-4000"></div>
      </div>
      
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 15s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Prevent text overflow on small screens */
        @media (max-width: 340px) {
          .text-3xl, .text-4xl {
            font-size: 1.5rem !important;
          }
          .text-xl, .text-lg {
            font-size: 1rem !important;
          }
          h1, h2, h3 {
            word-break: break-word;
          }
        }
      `}</style>
    </div>
  );
}
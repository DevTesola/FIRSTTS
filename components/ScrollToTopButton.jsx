import React, { useState, useEffect } from 'react';

/**
 * Floating button that appears when scrolling down,
 * allowing users to quickly return to the top of the page
 */
const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-20 right-4 z-40 md:bottom-6 bg-gradient-to-r from-purple-600 to-blue-600 
                   text-white w-10 h-10 rounded-full shadow-lg shadow-purple-900/30
                   flex items-center justify-center transform transition-all duration-300
                   hover:scale-110 active:scale-95 hover:shadow-purple-600/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
          </svg>
        </button>
      )}
    </>
  );
};

export default ScrollToTopButton;
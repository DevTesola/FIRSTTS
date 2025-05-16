// components/common/ScrollableTabs.jsx
import React, { useRef, useEffect, useState } from 'react';

/**
 * ScrollableTabs - A mobile-optimized component for horizontally scrollable tabs
 * Features:
 * - Horizontal scrolling with snap points for touch interaction
 * - Active tab indicator with gradient 
 * - Auto-scroll to make active tab visible
 * - Touch-friendly design with proper sizing
 * 
 * @param {Array} tabs - Array of tab objects with id and label properties
 * @param {string} activeTab - ID of the currently active tab
 * @param {Function} onTabChange - Function to handle tab change events
 * @param {string} className - Additional CSS classes
 * @param {Object} props - Additional props
 */
export default function ScrollableTabs({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = "",
  colorFrom = "purple-600",
  colorTo = "pink-600",
  minTouchTarget = 44,
  ...props 
}) {
  const scrollRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [showLeftScrollButton, setShowLeftScrollButton] = useState(false);
  const [showRightScrollButton, setShowRightScrollButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Get reference to the active tab
  const activeTabRef = useRef(null);
  
  // Update container dimensions on window resize and check if mobile
  useEffect(() => {
    const updateDimensions = () => {
      // Check if mobile (768px is typical breakpoint)
      setIsMobile(window.innerWidth < 768);
      
      if (scrollRef.current) {
        const scrollContainer = scrollRef.current;
        const containerWidth = scrollContainer.clientWidth;
        const scrollWidth = scrollContainer.scrollWidth;
        const scrollLeft = scrollContainer.scrollLeft;
        
        setContainerWidth(containerWidth);
        setMaxScroll(scrollWidth - containerWidth);
        setScrollPosition(scrollLeft);
        
        setShowLeftScrollButton(scrollLeft > 0);
        setShowRightScrollButton(scrollLeft < scrollWidth - containerWidth - 5);
      }
    };
    
    updateDimensions();
    
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [tabs]);
  
  // Update scroll buttons visibility on scroll
  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const scrollLeft = scrollContainer.scrollLeft;
      
      setScrollPosition(scrollLeft);
      setShowLeftScrollButton(scrollLeft > 5);
      setShowRightScrollButton(scrollLeft < maxScroll - 5);
    }
  };
  
  // Scroll the active tab into view when tab changes
  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      const tab = activeTabRef.current;
      const container = scrollRef.current;
      
      // Calculate position to center the active tab
      const tabRect = tab.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const tabCenterX = tabRect.left + tabRect.width / 2;
      const containerCenterX = containerRect.left + containerRect.width / 2;
      const offsetX = tabCenterX - containerCenterX;
      
      // Scroll with a smooth animation
      container.scrollBy({
        left: offsetX,
        behavior: 'smooth'
      });
    }
  }, [activeTab]);
  
  // Scroll left/right buttons handlers
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };
  
  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <div className={`relative ${className}`} {...props}>
      {/* Left scroll button - only on mobile */}
      {isMobile && showLeftScrollButton && (
        <button 
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-900/80 hover:bg-gray-800 rounded-r-lg p-1 text-white shadow-lg"
          style={{ minHeight: `${minTouchTarget}px`, minWidth: `${minTouchTarget/2}px` }}
          aria-label="Scroll left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      
      {/* Tabs container - scrollable on mobile, regular on desktop */}
      <div
        ref={scrollRef}
        className={`flex items-center justify-center py-2 px-2 -mx-2 ${
          isMobile ? 'overflow-x-auto scrollbar-hide scroll-smooth' : 'overflow-visible'
        }`}
        onScroll={handleScroll}
        style={isMobile ? { 
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          width: '100%'
        } : {}}
      >
        <div className={`flex items-center ${isMobile ? 'justify-start' : 'justify-center'} w-auto`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              ref={tab.id === activeTab ? activeTabRef : null}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative px-4 py-2.5 mx-1 rounded-lg font-medium transition-all duration-300 flex-shrink-0
                ${tab.id === activeTab 
                  ? 'text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }
              `}
              style={{ 
                minHeight: `${minTouchTarget}px`, 
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                scrollSnapAlign: 'start'
              }}
              aria-selected={tab.id === activeTab}
              role="tab"
            >
              {tab.id === activeTab && (
                <span 
                  className={`absolute inset-0 rounded-lg bg-gradient-to-r from-${colorFrom} to-${colorTo}`}
                  aria-hidden="true"
                ></span>
              )}
              <span className="relative flex items-center justify-center">
                {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Right scroll button - only on mobile */}
      {isMobile && showRightScrollButton && (
        <button 
          onClick={scrollRight}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-900/80 hover:bg-gray-800 rounded-l-lg p-1 text-white shadow-lg"
          style={{ minHeight: `${minTouchTarget}px`, minWidth: `${minTouchTarget/2}px` }}
          aria-label="Scroll right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
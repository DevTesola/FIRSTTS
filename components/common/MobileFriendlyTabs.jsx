import React, { useState, useRef, useEffect } from 'react';

/**
 * MobileFriendlyTabs - A mobile-optimized tab navigation component
 * 
 * Features:
 * - Large touch targets (44px minimum)
 * - Horizontal scrolling when tabs overflow
 * - Smooth scrolling to active tab
 * - Active indicator with animation
 * - Snap scrolling on mobile
 */
const MobileFriendlyTabs = ({
  tabs = [],
  activeIndex = 0,
  onChange,
  className = '',
  tabClassName = '',
  variant = 'default' // 'default', 'pill', 'underline'
}) => {
  const [activeTab, setActiveTab] = useState(activeIndex);
  const tabsRef = useRef(null);
  const activeTabRef = useRef(null);

  // Handle tab change
  const handleTabChange = (index) => {
    setActiveTab(index);
    if (onChange) onChange(index);
    
    // Scroll active tab into view on mobile
    setTimeout(() => {
      if (activeTabRef.current && tabsRef.current) {
        const container = tabsRef.current;
        const tabElement = activeTabRef.current;
        
        // Calculate scroll position to center the active tab
        const scrollLeft = tabElement.offsetLeft - (container.offsetWidth / 2) + (tabElement.offsetWidth / 2);
        
        // Smooth scroll to the active tab
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }, 10);
  };

  // When activeIndex changes from parent
  useEffect(() => {
    setActiveTab(activeIndex);
  }, [activeIndex]);

  // Scroll to active tab on mount and when active tab changes
  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const container = tabsRef.current;
      const tabElement = activeTabRef.current;
      
      // Calculate scroll position to center the active tab
      const scrollLeft = tabElement.offsetLeft - (container.offsetWidth / 2) + (tabElement.offsetWidth / 2);
      
      // Smooth scroll to the active tab
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [activeTab]);

  // Get styles based on variant
  const getTabStyles = (isActive) => {
    switch (variant) {
      case 'pill':
        return isActive
          ? 'bg-purple-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700';
      case 'underline':
        return isActive
          ? 'text-white border-b-2 border-purple-500'
          : 'text-gray-400 border-b-2 border-transparent hover:text-gray-300 hover:border-gray-700';
      default:
        return isActive
          ? 'text-white bg-gray-800'
          : 'text-gray-400 hover:text-white hover:bg-gray-800/50';
    }
  };

  return (
    <div 
      className={`w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pb-1 snap-x ${className}`}
      ref={tabsRef}
    >
      <div className="flex space-x-1 min-w-max">
        {tabs.map((tab, index) => (
          <button
            key={index}
            ref={index === activeTab ? activeTabRef : null}
            onClick={() => handleTabChange(index)}
            className={`px-4 py-3 font-medium rounded-lg transition-colors min-h-[44px] min-w-[44px] text-center whitespace-nowrap ${getTabStyles(index === activeTab)} ${tabClassName}`}
            aria-selected={index === activeTab}
            role="tab"
          >
            {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileFriendlyTabs;
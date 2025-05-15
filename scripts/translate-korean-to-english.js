// translate-korean-to-english.js
// This script replaces Korean text with English in all project files

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Korean to English translation mapping for common terms
const translations = {
  // Comments and code descriptions
  'Image object pool': 'Image object pool',
  'Prevents memory leaks by releasing objects after use': 'Prevents memory leaks by releasing objects after use',
  'Improves image loading performance': 'Improves image loading performance',
  'Maximum number of image objects': 'Maximum number of image objects',
  'Use already created available images': 'Use already created available images',
  'Create new image object': 'Create new image object',
  'Create new object if the pool is full': 'Create new object if the pool is full',
  'Release image after use': 'Release image after use',
  'Cleanup': 'Cleanup',
  
  // IPFS Gateway comments
  'IPFS gateway list definition': 'IPFS gateway list definition',
  'Private gateway (highest priority)': 'Private gateway (highest priority)',
  'Pinata gateway': 'Pinata gateway',
  'NFT.Storage (stable)': 'NFT.Storage (stable)',
  
  // Loading indicators and image processing
  'Loading indicator special URL handling': 'Loading indicator special URL handling',
  'Improved thumbnail loading process': 'Improved thumbnail loading process',
  'Improved performance with caching enabled': 'Improved performance with caching enabled',
  
  // Parallel loading strategies
  'Parallel loading strategy': 'Parallel loading strategy',
  'Load thumbnail and full image simultaneously': 'Load thumbnail and full image simultaneously',
  'Provides faster experience to the user': 'Provides faster experience to the user',
  
  // Error messages
  'Image load failed': 'Image load failed',
  'Error loading image': 'Error loading image',
  
  // Resource management
  'Improved resource cleanup and memory release': 'Improved resource cleanup and memory release',
  'Return to pool': 'Return to pool',
  
  // React optimization
  'Optimization using React.memo': 'Optimization using React.memo',
  'Prevent unnecessary re-rendering': 'Prevent unnecessary re-rendering',
  'Applied memo externally to maintain standard React code pattern': 'Applied memo externally to maintain standard React code pattern',
  
  // NFT Gallery comments
  'First exclude already staked NFTs': 'First exclude already staked NFTs',
  'Image loading logic modified to match my-collection page approach': 'Image loading logic modified to match my-collection page approach',
  'Use image URL directly provided by the API': 'Use image URL directly provided by the API',
  'If URL is provided and starts with http/https': 'If URL is provided and starts with http/https',
  'Verify URL validity': 'Verify URL validity',
  'Add stable cache busting parameter': 'Add stable cache busting parameter',
  'Use consistent value': 'Use consistent value',
  'Extract NFT ID': 'Extract NFT ID',
  'Create URL directly from IPFS gateway': 'Create URL directly from IPFS gateway',
  'Last resort': 'Last resort',
  'Use stable cache key': 'Use stable cache key'
};

// File extensions to process
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.md'];

// Directories to exclude
const excludeDirs = ['node_modules', '.git', '.next', 'out', 'dist', 'build'];

// Translate Korean text in file
async function translateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;

    // Replace Korean comments and strings with English translations
    for (const [korean, english] of Object.entries(translations)) {
      if (content.includes(korean)) {
        content = content.replace(new RegExp(korean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), english);
        modified = true;
      }
    }

    // Only write back if changes were made
    if (modified) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Translated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error translating ${filePath}:`, error.message);
    return false;
  }
}

// Special handling for the Korean implementation plan - complete translation
async function translateKoreanPlan() {
  const planPath = path.join(process.cwd(), 'korean-implementation-plan.md');
  try {
    await fs.access(planPath);
    
    // Create English version
    const englishContent = `# Detailed Implementation Plan for NFT Platform Improvement

## 1. NFT Minting Randomization System Improvement
- Implement safer randomization in purchaseNFT.js file
- Improve Supabase functions: Implement transactions using FOR UPDATE SKIP LOCKED
- Add automatic lock release timeout mechanism (auto-release after 5 minutes)

## 2. Strengthen Duplicate Minting Prevention Mechanism
- Strengthen lock validation logic in completeMinting.js
- Add lock validity period check (expire locks older than 10 minutes)
- Ensure atomicity with database transaction processing
- Strengthen current state validation during state changes

## 3. Build Staking Synchronization System
- Implement blockchain-database synchronization helper functions
- Add automatic verification logic at staking completion
- Create cron jobs for periodic synchronization
- Implement discrepancy detection and automatic recovery functionality

## 4. Improve Error Handling and Recovery System
- Classify detailed error types and provide customized recovery methods
- Implement recovery utilities for failed minting and staking transactions
- Build recovery API endpoints
- Systematic error logging and monitoring

## Additional Recommendations
- Improve admin dashboard
- Build monitoring and notification system
- Implement regular data consistency checks
- Load testing and performance optimization
- Operational documentation and training`;

    await fs.writeFile(path.join(process.cwd(), 'implementation-plan.md'), englishContent, 'utf8');
    console.log('✅ Created English implementation plan');
    
    // Rename the original file to keep it as a backup
    await fs.rename(planPath, planPath + '.bak');
    console.log('✅ Renamed original Korean plan to .bak');
    
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Korean implementation plan file not found, skipping');
    } else {
      console.error('Error handling Korean implementation plan:', error.message);
    }
    return false;
  }
}

// Scan directory for files to translate
async function scanDirectory(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let translatedCount = 0;

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip excluded directories
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          translatedCount += await scanDirectory(fullPath);
        }
      } 
      // Process files with matching extensions
      else if (entry.isFile() && fileExtensions.includes(path.extname(entry.name))) {
        const wasTranslated = await translateFile(fullPath);
        if (wasTranslated) translatedCount++;
      }
    }
    
    return translatedCount;
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
    return 0;
  }
}

// Optimize mobile styles by injecting standard mobile optimizations
async function optimizeMobileStyles() {
  const cssPath = path.join(process.cwd(), 'styles', 'mobile-responsive.css');
  
  try {
    await fs.access(cssPath);
    
    const mobileOptimizations = `
/* Standardized mobile optimizations - Added by script */
@media (max-width: 640px) {
  /* Ensure accessible touch targets (44px minimum) */
  button, a, input, select, [role="button"], .clickable {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Improved touch scrolling */
  .scrollable, [data-scrollable], div[class*="overflow-auto"], div[class*="overflow-y-auto"], div[class*="overflow-x-auto"] {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    scrollbar-width: thin;
  }
  
  /* Improve tap target spacing */
  .space-y-2 {
    margin-top: 0.625rem;
    margin-bottom: 0.625rem;
  }
  
  /* Better form inputs */
  input, select, textarea {
    font-size: 16px !important; /* Prevents iOS zoom */
    padding: 12px !important;
  }
  
  /* Improved scrolling containers */
  .snap-container {
    scroll-snap-type: x mandatory;
    scroll-padding: 1rem;
  }
  
  .snap-item {
    scroll-snap-align: start;
  }
  
  /* Fix iOS 100vh issue */
  .h-screen {
    height: 100vh;
    height: -webkit-fill-available;
  }
}

/* iOS Safari specific fixes */
@supports (-webkit-touch-callout: none) {
  .h-screen {
    height: -webkit-fill-available;
  }
  
  .ios-vh-fix {
    height: 100%;
    position: fixed;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }
}
`;

    // Append optimizations to CSS file
    await fs.appendFile(cssPath, mobileOptimizations, 'utf8');
    console.log('✅ Added mobile optimizations to mobile-responsive.css');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Mobile CSS file not found, creating new one');
      try {
        // Create directory if it doesn't exist
        await fs.mkdir(path.dirname(cssPath), { recursive: true });
        await fs.writeFile(cssPath, mobileOptimizations, 'utf8');
        console.log('✅ Created new mobile-responsive.css with optimizations');
        return true;
      } catch (createError) {
        console.error('Error creating mobile CSS file:', createError.message);
        return false;
      }
    } else {
      console.error('Error optimizing mobile styles:', error.message);
      return false;
    }
  }
}

// Create a mobile-friendly touch input component
async function createTouchFriendlyInput() {
  const componentPath = path.join(process.cwd(), 'components', 'common', 'TouchFriendlyInput.jsx');
  
  try {
    // Check if it already exists
    await fs.access(componentPath);
    console.log('TouchFriendlyInput component already exists, skipping');
    return false;
  } catch (error) {
    if (error.code === 'ENOENT') {
      try {
        // Create directory if it doesn't exist
        await fs.mkdir(path.dirname(componentPath), { recursive: true });
        
        const componentContent = `// components/common/TouchFriendlyInput.jsx
import React, { useState, useRef } from 'react';

/**
 * TouchFriendlyInput - Mobile optimized input component
 * Features:
 * - Minimum 44px touch target
 * - Clear button for easy text clearing
 * - Prevents iOS zoom
 * - Optimized for touch interactions
 */
const TouchFriendlyInput = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onClear,
  className = '',
  iconLeft = null,
  iconRight = null,
  min,
  max,
  disabled = false,
  required = false,
  autoComplete = 'off',
  name,
  id,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  
  // Handle clear button click
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
    
    // Focus back on input after clearing
    inputRef.current?.focus();
  };
  
  return (
    <div className={\`relative w-full \${className}\`}>
      {/* Left icon if provided */}
      {iconLeft && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          {iconLeft}
        </div>
      )}
      
      {/* Input element with mobile optimizations */}
      <input
        ref={inputRef}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        name={name}
        id={id}
        autoComplete={autoComplete}
        min={min}
        max={max}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={\`w-full bg-gray-900 border \${
          isFocused ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-700'
        } rounded-lg \${
          iconLeft ? 'pl-10' : 'pl-4'
        } \${
          (iconRight || (value && value.length > 0)) ? 'pr-10' : 'pr-4'
        } py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[44px] text-base\`}
        style={{ fontSize: '16px' }} // Prevents iOS zoom
        {...props}
      />
      
      {/* Clear button or right icon */}
      {value && value.length > 0 ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Clear input"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </button>
      ) : iconRight ? (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          {iconRight}
        </div>
      ) : null}
    </div>
  );
};

export default TouchFriendlyInput;
`;

        await fs.writeFile(componentPath, componentContent, 'utf8');
        console.log('✅ Created TouchFriendlyInput component');
        return true;
      } catch (createError) {
        console.error('Error creating TouchFriendlyInput component:', createError.message);
        return false;
      }
    } else {
      console.error('Error checking TouchFriendlyInput component:', error.message);
      return false;
    }
  }
}

// Create mobile-friendly tabs component
async function createMobileFriendlyTabs() {
  const componentPath = path.join(process.cwd(), 'components', 'common', 'MobileFriendlyTabs.jsx');
  
  try {
    // Check if it already exists
    await fs.access(componentPath);
    console.log('MobileFriendlyTabs component already exists, skipping');
    return false;
  } catch (error) {
    if (error.code === 'ENOENT') {
      try {
        // Create directory if it doesn't exist
        await fs.mkdir(path.dirname(componentPath), { recursive: true });
        
        const componentContent = `// components/common/MobileFriendlyTabs.jsx
import React, { useState, useRef, useEffect } from 'react';

/**
 * MobileFriendlyTabs - Touch-optimized tabs with horizontal scrolling
 * Features:
 * - Horizontal scrolling with snap points
 * - Auto-scroll active tab into view
 * - Minimum 44px touch targets
 * - Smooth animations
 */
const MobileFriendlyTabs = ({
  tabs = [],
  initialTab = 0,
  onChange,
  className = '',
  tabClassName = '',
  activeTabClassName = '',
  contentClassName = '',
  children,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const tabsRef = useRef(null);
  const activeTabRef = useRef(null);
  
  // Scroll active tab into view when it changes
  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const container = tabsRef.current;
      const activeElement = activeTabRef.current;
      
      // Calculate position to scroll to
      const containerWidth = container.clientWidth;
      const activeElementLeft = activeElement.offsetLeft;
      const activeElementWidth = activeElement.clientWidth;
      
      // Center the active tab
      const scrollPosition = activeElementLeft - (containerWidth / 2) + (activeElementWidth / 2);
      
      // Smooth scroll to position
      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [activeTab]);
  
  // Handle tab change
  const handleTabChange = (index) => {
    setActiveTab(index);
    if (onChange) {
      onChange(index);
    }
  };
  
  return (
    <div className={\`w-full \${className}\`}>
      {/* Tabs navigation */}
      <div 
        ref={tabsRef}
        className="flex overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-800 snap-x"
        style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}
      >
        {tabs.map((tab, index) => (
          <button
            key={index}
            ref={index === activeTab ? activeTabRef : null}
            onClick={() => handleTabChange(index)}
            className={\`px-4 py-3 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 snap-start min-h-[44px] min-w-[44px] \${
              index === activeTab
                ? \`bg-purple-600 text-white \${activeTabClassName}\`
                : \`bg-gray-800 text-gray-300 hover:bg-gray-700 \${tabClassName}\`
            }\`}
            role="tab"
            aria-selected={index === activeTab}
            aria-controls={\`panel-\${index}\`}
            id={\`tab-\${index}\`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div className={\`mt-1 \${contentClassName}\`}>
        {Array.isArray(children) 
          ? children.map((child, index) => (
              <div
                key={index}
                role="tabpanel"
                id={\`panel-\${index}\`}
                aria-labelledby={\`tab-\${index}\`}
                className={\`\${index === activeTab ? 'block' : 'hidden'}\`}
              >
                {child}
              </div>
            ))
          : <div role="tabpanel">{children}</div>
        }
      </div>
    </div>
  );
};

export default MobileFriendlyTabs;
`;

        await fs.writeFile(componentPath, componentContent, 'utf8');
        console.log('✅ Created MobileFriendlyTabs component');
        return true;
      } catch (createError) {
        console.error('Error creating MobileFriendlyTabs component:', createError.message);
        return false;
      }
    } else {
      console.error('Error checking MobileFriendlyTabs component:', error.message);
      return false;
    }
  }
}

// Update CLAUDE.md with mobile optimization guidelines
async function updateClaudeMdWithMobileGuidelines() {
  const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md');
  
  try {
    let content = await fs.readFile(claudeMdPath, 'utf8');
    
    // Check if mobile guidelines already exist
    if (content.includes('## Mobile Optimization Guidelines')) {
      console.log('Mobile optimization guidelines already exist in CLAUDE.md, skipping');
      return false;
    }
    
    // Mobile optimization guidelines to add
    const mobileGuidelines = `
## Mobile Optimization Guidelines

When optimizing components for mobile:

1. **Touch Targets**
   - All interactive elements (buttons, links, inputs) should be at least 44x44px
   - Add padding where necessary to increase touch area
   - Use \`min-height: 44px; min-width: 44px;\` in CSS

2. **Loading States**
   - Include clear loading indicators for network operations
   - Add descriptive loading text when possible
   - Use skeleton loaders for content-heavy components

3. **Form Inputs**
   - Increase form input height to at least 44px
   - Add clear buttons for text inputs
   - Position icons with enough spacing
   - Use the \`TouchFriendlyInput\` component for consistency

4. **Tab Navigation**
   - Implement horizontal scrolling for tab navigation
   - Use snap scrolling for better UX (\`scroll-snap-align: start\`)
   - Ensure active tab is visible on viewport
   - Consider using the \`MobileFriendlyTabs\` component

5. **Responsive Images**
   - Use the Next.js Image component or ResponsiveImageLoader
   - Implement proper loading states for images
   - Consider lower quality settings for gallery views 

6. **Scrolling Enhancements**
   - Add momentum scrolling with \`-webkit-overflow-scrolling: touch\`
   - Implement smooth scrolling with \`scroll-behavior: smooth\`
   - Use horizontal scrolling with snap points for galleries

7. **Testing**
   - Test on actual mobile devices
   - Check all touch interactions
   - Verify performance on slower connections
   - Test usability with one-handed operation

*Last updated: May 15, 2025*
`;

    // Append guidelines to CLAUDE.md
    content += mobileGuidelines;
    await fs.writeFile(claudeMdPath, content, 'utf8');
    console.log('✅ Updated CLAUDE.md with mobile optimization guidelines');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('CLAUDE.md file not found, skipping mobile guidelines update');
    } else {
      console.error('Error updating CLAUDE.md:', error.message);
    }
    return false;
  }
}

// Main function to run all operations
async function main() {
  console.log('🚀 Starting Korean to English translation and mobile optimization...');
  
  // Step 1: Translate the Korean implementation plan
  await translateKoreanPlan();
  
  // Step 2: Scan and translate all project files
  const translatedCount = await scanDirectory(process.cwd());
  console.log(`✅ Translated Korean text in ${translatedCount} files`);
  
  // Step 3: Optimize mobile styles
  await optimizeMobileStyles();
  
  // Step 4: Create mobile-friendly components
  await createTouchFriendlyInput();
  await createMobileFriendlyTabs();
  
  // Step 5: Update CLAUDE.md with mobile guidelines
  await updateClaudeMdWithMobileGuidelines();
  
  console.log('✅ All tasks completed successfully!');
}

// Run the script
main().catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
});
# Presale Page Mobile Optimization

This document outlines the mobile optimization improvements made to the PresalePage component.

## Overview

The PresalePage component has been optimized for mobile devices by:
- Implementing responsive text sizes
- Adjusting padding and margins for touch interfaces
- Enhancing button dimensions for better mobile usability
- Improving scrolling behavior for horizontal elements
- Adding optimal spacing for small screens
- Using responsive design patterns consistently throughout

## Specific Optimizations

### Header and Title
- Reduced heading size on mobile (`text-3xl sm:text-4xl md:text-5xl`)
- Added smaller text for description (`text-sm sm:text-base md:text-lg`)
- Added horizontal padding to prevent text from touching edges
- Made badge elements wrap properly with reduced padding on mobile

### Video Section
- Optimized YouTube button sizes for mobile
- Adjusted icon sizes across screen sizes (`h-4 w-4 sm:h-5 sm:w-5`)
- Reduced spacing for mobile while preserving desktop aesthetics
- Improved subscription benefits text scaling

### Terms Modal
- Added responsive padding for modal content (`p-4 sm:p-6`)
- Reduced heading size on mobile (`text-xl sm:text-2xl`)
- Used smaller text for content on mobile (`text-sm sm:text-base`)
- Optimized buttons for touch (`py-2 sm:py-3 px-4 sm:px-6`)
- Improved spacing between content sections

### Tab Navigation
- Implemented horizontally scrollable tabs with hidden scrollbar
- Added minimum width to each tab button (`min-w-[80px]`)
- Made text smaller on mobile (`text-xs sm:text-sm`)
- Added `whitespace-nowrap` to prevent text wrapping within tabs
- Reduced padding for better fit on small screens

### Wallet and Purchase Sections
- Scaled down wallet information display (`text-xs sm:text-sm`)
- Adjusted padding on wallet section for better spacing
- Optimized token amount input and buttons
- Made quick amount buttons more compact but still touch-friendly
- Improved cost display text sizing and padding

### Purchase Form
- Optimized input field padding and font size
- Made token amount buttons more compact but still usable on mobile
- Added responsive spacing throughout the form
- Adjusted purchase button size and icon dimensions
- Improved guidance text with tiny text class (`text-xxs sm:text-xs`)

### CSS Utilities Added
```css
.text-xxs {
  font-size: 0.65rem;
  line-height: 0.9rem;
}

.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
```

## Implementation Details

1. The implementation follows a mobile-first approach, using breakpoints for progressive enhancement:
   - Base styles for mobile (no prefix)
   - Small screens (sm: prefix) - 640px and up
   - Medium screens (md: prefix) - 768px and up

2. A consistent pattern is used throughout:
   - Reduced padding on mobile: `p-3 sm:p-4`
   - Smaller text on mobile: `text-xs sm:text-sm`
   - Compact spacing: `gap-1.5 sm:gap-2`
   - Touch-optimized buttons: `py-2 sm:py-3 px-2 sm:px-4`

3. A global CSS style block was added with custom utility classes:
   - `text-xxs` for extremely small text
   - `scrollbar-hide` for cleaner horizontally scrollable elements

## Mobile-Specific Improvements

- The tab navigation now scrolls horizontally on mobile without a scrollbar
- All touch targets are optimized to be at least 44px (following accessibility guidelines)
- Text is more readable at small screen sizes
- Content is properly contained without overflow issues
- UI remains functional and aesthetically consistent across all screen sizes

These optimizations ensure that the Presale Page provides a user-friendly experience on mobile devices while maintaining its full functionality.
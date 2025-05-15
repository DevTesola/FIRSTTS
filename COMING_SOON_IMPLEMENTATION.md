# Coming Soon Pages Implementation Guide

This guide outlines how the Coming Soon pages for NFT minting, token presale, and social media links are implemented.

## Overview

The implementation is designed to be minimally invasive and easily revertible. It works by:

1. Redirecting button clicks to Coming Soon pages instead of performing their original actions
2. Using direct component modification to replace functionality
3. Providing an easy way to restore the original functionality

## Files Created

### Coming Soon Pages
- `/pages/coming-soon-mint.js` - Coming soon page for NFT minting
- `/pages/coming-soon-presale.js` - Coming soon page for token presale
- `/pages/coming-soon-social.js` - Coming soon page for social links (Discord/GitHub)

### Modified Components (Originals Backed Up)
- `/components/MintSection.jsx` - Modified to redirect mint button clicks
- `/components/presale/PresaleSection.jsx` - Modified to redirect presale button clicks
- `/components/presale/PresalePage.jsx` - Modified to redirect presale page button clicks
- `/components/Layout.jsx` - Modified to redirect social link clicks

### Backup Files
- `/components/MintSection.jsx.original` - Original mint button component
- `/components/presale/PresaleSection.jsx.original` - Original presale button component
- `/components/presale/PresalePage.jsx.original` - Original presale page component
- `/components/Layout.jsx.original` - Original social links component

## Implementation Details

### Direct Component Modification (Currently Used)

The original component files have been directly modified to redirect to Coming Soon pages:

1. In `MintSection.jsx`, the `handlePurchase` function was modified to:
   ```javascript
   const handlePurchase = () => {
     const returnUrl = encodeURIComponent(router.asPath);
     router.push(`/coming-soon-mint?returnUrl=${returnUrl}`);
   };
   ```

2. In `PresaleSection.jsx`, the `handlePurchase` function was modified to:
   ```javascript
   const handlePurchase = () => {
     const returnUrl = encodeURIComponent(router.asPath);
     router.push(`/coming-soon-presale?returnUrl=${returnUrl}`);
   };
   ```

3. In `PresalePage.jsx`, the `handlePurchase` function was modified to:
   ```javascript
   const handlePurchase = () => {
     const returnUrl = encodeURIComponent(router.asPath);
     router.push(`/coming-soon-presale?returnUrl=${returnUrl}`);
   };
   ```

4. In `Layout.jsx`, a new function was added to handle social link clicks:
   ```javascript
   const handleSocialLinkClick = (e, type) => {
     e.preventDefault();
     const returnUrl = encodeURIComponent(router.asPath);
     router.push(`/coming-soon-social?type=${type}&returnUrl=${returnUrl}`);
   };
   ```
   And the Discord and GitHub link onClick handlers were updated to use this function.

## How to Restore Original Functionality

To revert to the original functionality, restore the backup files with these commands:

```bash
cp /home/tesola/ttss/tesolafixjs/components/MintSection.jsx.original /home/tesola/ttss/tesolafixjs/components/MintSection.jsx
cp /home/tesola/ttss/tesolafixjs/components/presale/PresaleSection.jsx.original /home/tesola/ttss/tesolafixjs/components/presale/PresaleSection.jsx
cp /home/tesola/ttss/tesolafixjs/components/presale/PresalePage.jsx.original /home/tesola/ttss/tesolafixjs/components/presale/PresalePage.jsx
cp /home/tesola/ttss/tesolafixjs/components/Layout.jsx.original /home/tesola/ttss/tesolafixjs/components/Layout.jsx
```

## Testing

After implementation, test each path to ensure redirection works properly:

1. Click the mint button on the NFT page
2. Click the buy button on the presale page
3. Click Discord and GitHub links in the footer

Each should redirect to the appropriate Coming Soon page with the ability to return to the original page.

## Coming Soon Page Features

The Coming Soon pages include:

- Countdown timers (June 15, 2025 for minting, July 25, 2025 for presale)
- Mobile-responsive design with animations
- Navigation back to the original page
- Page-specific content that explains upcoming features
- Dynamic content for social links based on the link type (Discord or GitHub)
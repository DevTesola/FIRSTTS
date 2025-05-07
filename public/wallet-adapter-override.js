// Direct wallet adapter font override script
(function() {
  console.log('Wallet adapter font override script executed');
  
  // Function to apply the font override
  function applyOrbitronToWalletElements() {
    // All elements with wallet-adapter in class name
    const walletElements = document.querySelectorAll('[class*="wallet-adapter"]');
    
    walletElements.forEach(element => {
      console.log('Applying font override to wallet element', element);
      element.style.setProperty('font-family', "'Orbitron', sans-serif", "important");
      
      // Apply to all child elements
      Array.from(element.getElementsByTagName('*')).forEach(child => {
        child.style.setProperty('font-family', "'Orbitron', sans-serif", "important");
      });
    });
  }
  
  // Run immediately
  applyOrbitronToWalletElements();
  
  // Also run after a short delay to catch dynamically loaded content
  setTimeout(applyOrbitronToWalletElements, 500);
  setTimeout(applyOrbitronToWalletElements, 1000);
  setTimeout(applyOrbitronToWalletElements, 2000);
  
  // Set up mutation observer to catch wallet elements when they appear
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        applyOrbitronToWalletElements();
      }
    });
  });
  
  // Start observing document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Intercept font loading
  if (window.FontFace) {
    const originalFontFace = window.FontFace;
    window.FontFace = function(family, source, descriptors) {
      // Redirect DM Sans to Orbitron
      if (family === 'DM Sans' || (typeof family === 'string' && family.includes('DM Sans'))) {
        console.log('Intercepted DM Sans font, replacing with Orbitron');
        family = 'Orbitron';
      }
      return new originalFontFace(family, source, descriptors);
    };
  }
})();
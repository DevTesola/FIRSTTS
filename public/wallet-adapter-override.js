// Direct wallet adapter font override script
(function() {
  console.log('Wallet adapter font override script initialized');
  
  // Track elements to avoid duplicate processing
  const processedElements = new WeakSet();
  
  // Function to apply the font override
  function applyOrbitronToWalletElements() {
    // All elements with wallet-adapter in class name
    const walletElements = document.querySelectorAll('[class*="wallet-adapter"]');
    
    let newElementsFound = false;
    
    walletElements.forEach(element => {
      // Skip if already processed
      if (processedElements.has(element)) {
        return;
      }
      
      // Mark as processed
      processedElements.add(element);
      newElementsFound = true;
      
      // Apply font
      element.style.setProperty('font-family', 'Orbitron, sans-serif', 'important');
      
      // Apply to all child elements
      Array.from(element.getElementsByTagName('*')).forEach(child => {
        if (!processedElements.has(child)) {
          processedElements.add(child);
          child.style.setProperty('font-family', 'Orbitron, sans-serif', 'important');
        }
      });
    });
    
    // Only log if new elements were found
    if (newElementsFound) {
      console.log('Font override applied to new wallet elements');
    }
  }
  
  // Run immediately
  applyOrbitronToWalletElements();
  
  // Also run after a short delay to catch dynamically loaded content
  setTimeout(applyOrbitronToWalletElements, 500);
  setTimeout(applyOrbitronToWalletElements, 1000);
  setTimeout(applyOrbitronToWalletElements, 2000);
  
  // Set up mutation observer to catch wallet elements when they appear
  const observer = new MutationObserver(mutations => {
    let needsUpdate = false;
    
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        // Check if any added nodes contain wallet elements
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && // Element node
              (node.className && node.className.includes && node.className.includes('wallet-adapter') ||
               node.querySelector && node.querySelector('[class*="wallet-adapter"]'))) {
            needsUpdate = true;
          }
        });
      }
    });
    
    // Only apply if wallet elements were found
    if (needsUpdate) {
      applyOrbitronToWalletElements();
    }
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
      // Redirect DM Sans to Orbitron (silently)
      if (family === 'DM Sans' || (typeof family === 'string' && family.includes('DM Sans'))) {
        family = 'Orbitron';
      }
      return new originalFontFace(family, source, descriptors);
    };
  }
})();
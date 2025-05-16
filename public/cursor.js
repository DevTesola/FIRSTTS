// Custom cursor implementation - visible all the time, follows on click
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔮 Custom cursor initialized');

  // Create cursor elements if they don't exist
  if (!document.querySelector('.cursor-dot') && !document.querySelector('.cursor-outline')) {
    const cursorDot = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    
    const cursorOutline = document.createElement('div');
    cursorOutline.className = 'cursor-outline';
    
    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorOutline);
    
    // Add explicit styles
    cursorDot.style.position = 'fixed';
    cursorDot.style.width = '12px';
    cursorDot.style.height = '12px';
    cursorDot.style.backgroundColor = 'rgb(168, 85, 247)';
    cursorDot.style.borderRadius = '50%';
    cursorDot.style.pointerEvents = 'none';
    cursorDot.style.zIndex = '9999';
    cursorDot.style.transform = 'translate3d(0, 0, 0) translate(-50%, -50%)';
    cursorDot.style.transition = 'width 0.2s, height 0.2s, background-color 0.2s';
    cursorDot.style.boxShadow = '0 0 10px rgba(168, 85, 247, 0.8), 0 0 20px rgba(168, 85, 247, 0.6), 0 0 30px rgba(168, 85, 247, 0.4)';
    cursorDot.style.mixBlendMode = 'screen';
    // Hardware acceleration for better performance
    cursorDot.style.willChange = 'transform';
    cursorDot.style.backfaceVisibility = 'hidden';
    
    cursorOutline.style.position = 'fixed';
    cursorOutline.style.width = '32px';
    cursorOutline.style.height = '32px';
    cursorOutline.style.border = '2px solid rgb(59, 130, 246)';
    cursorOutline.style.borderRadius = '50%';
    cursorOutline.style.pointerEvents = 'none';
    cursorOutline.style.zIndex = '9998';
    cursorOutline.style.transform = 'translate3d(0, 0, 0) translate(-50%, -50%)';
    cursorOutline.style.transition = 'width 0.2s, height 0.2s, border-color 0.2s';
    cursorOutline.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.5), 0 0 25px rgba(59, 130, 246, 0.3)';
    cursorOutline.style.mixBlendMode = 'exclusion';
    // Hardware acceleration for better performance
    cursorOutline.style.willChange = 'transform';
    cursorOutline.style.backfaceVisibility = 'hidden';
    
    // Track cursor position - initialize to center of viewport
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    
    // Animation variables - initialize to match mouse position
    let dotX = mouseX;
    let dotY = mouseY;
    let outlineX = mouseX;
    let outlineY = mouseY;
    
    // Smoothing factor (smaller = smoother)
    const smoothingNormal = 0.15;
    const smoothingClick = 0.3; // Faster tracking when clicked
    
    // Current smoothing
    let currentSmoothing = smoothingNormal;
    
    // Track states
    let isHovering = false;
    let isMouseDown = false;
    
    // Update cursor position when clicking
    document.addEventListener('mousedown', () => {
      isMouseDown = true;
      currentSmoothing = smoothingClick; // Faster tracking when clicked
      
      // Change style on click
      cursorDot.style.backgroundColor = 'rgb(59, 130, 246)'; // Change color on click
      cursorOutline.style.borderColor = 'rgb(168, 85, 247)';
      cursorDot.style.width = '16px';
      cursorDot.style.height = '16px';
      cursorOutline.style.width = '40px';
      cursorOutline.style.height = '40px';
    });
    
    document.addEventListener('mouseup', () => {
      isMouseDown = false;
      currentSmoothing = smoothingNormal;
      
      // Restore style
      if (!isHovering) {
        cursorDot.style.backgroundColor = 'rgb(168, 85, 247)';
        cursorOutline.style.borderColor = 'rgb(59, 130, 246)';
        cursorDot.style.width = '12px';
        cursorDot.style.height = '12px';
        cursorOutline.style.width = '32px';
        cursorOutline.style.height = '32px';
      }
    });
    
    // Update mouse position on move
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    
    // Track hover over interactive elements
    document.addEventListener('mouseover', (e) => {
      if (
        e.target.tagName.toLowerCase() === 'a' ||
        e.target.tagName.toLowerCase() === 'button' ||
        e.target.getAttribute('role') === 'button' ||
        e.target.closest('a') ||
        e.target.closest('button') ||
        e.target.closest('[role="button"]')
      ) {
        isHovering = true;
        cursorDot.style.backgroundColor = 'rgb(96, 165, 250)';
        cursorOutline.style.borderColor = 'rgb(168, 85, 247)';
        cursorDot.style.width = '18px';
        cursorDot.style.height = '18px';
      }
    });
    
    document.addEventListener('mouseout', (e) => {
      if (
        e.target.tagName.toLowerCase() === 'a' ||
        e.target.tagName.toLowerCase() === 'button' ||
        e.target.getAttribute('role') === 'button' ||
        e.target.closest('a') ||
        e.target.closest('button') ||
        e.target.closest('[role="button"]')
      ) {
        isHovering = false;
        if (!isMouseDown) {
          cursorDot.style.backgroundColor = 'rgb(168, 85, 247)';
          cursorOutline.style.borderColor = 'rgb(59, 130, 246)';
          cursorDot.style.width = '12px';
          cursorDot.style.height = '12px';
          cursorOutline.style.width = '32px';
          cursorOutline.style.height = '32px';
        }
      }
    });
    
    // High-performance animation loop with immediate responsiveness
    function animateCursor() {
      // Extremely fast response for dot (nearly instant)
      // Only when mouse is down, add very slight smoothing for visual polish
      if (isMouseDown) {
        // Very minimal smoothing when mouse is down (barely noticeable)
        dotX += (mouseX - dotX) * 0.65; // Extremely responsive
        dotY += (mouseY - dotY) * 0.65;
        
        // Outline follows with slight lag for visual effect
        outlineX += (mouseX - outlineX) * 0.45;
        outlineY += (mouseY - outlineY) * 0.45;
      } else {
        // When not clicked, dot instantly follows mouse - no lag
        dotX = mouseX;
        dotY = mouseY;
        
        // Outline has minimal lag for visual interest only
        outlineX += (mouseX - outlineX) * 0.8; // Very responsive 
        outlineY += (mouseY - outlineY) * 0.8;
      }
      
      // Apply positions with high-performance technique
      cursorDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
      cursorOutline.style.transform = `translate3d(${outlineX}px, ${outlineY}px, 0) translate(-50%, -50%)`;
      
      // Continue animation
      requestAnimationFrame(animateCursor);
    }
    
    // Start animation
    animateCursor();
    
    // Hide default cursor only (no additional styling)
    const style = document.createElement('style');
    style.textContent = `
      html {
        cursor: none;
      }
    `;
    document.head.appendChild(style);
    
    // Handle cursor visibility when leaving/entering window
    document.addEventListener('mouseenter', () => {
      cursorDot.style.opacity = '1';
      cursorOutline.style.opacity = '1';
    });
    
    document.addEventListener('mouseleave', () => {
      cursorDot.style.opacity = '0';
      cursorOutline.style.opacity = '0';
    });
    
    // Log completion
    console.log('🎯 Custom cursor fully initialized');
  }
});
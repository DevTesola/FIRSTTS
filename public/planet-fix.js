/**
 * Planet Animation Fix
 * This script directly manipulates planet animations to ensure they work consistently
 * across all devices regardless of CSS conflicts.
 */

(function() {
  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initPlanetAnimations, 500); // Short delay to ensure all components are rendered
  });

  function initPlanetAnimations() {
    // [Planet-Fix] Initializing planet animations...
    
    // Find all planets by their specific classes
    const leftPlanet = document.querySelector('.left-planet');
    const rightPlanet = document.querySelector('.right-planet');
    const devPlanet = document.querySelector('.dev-planet');
    
    if (!leftPlanet && !rightPlanet && !devPlanet) {
      // [Planet-Fix] No planets found, will retry in 1 second
      setTimeout(initPlanetAnimations, 1000);
      return;
    }
    
    // [Planet-Fix] Found planets
    
    // Apply animations to each planet
    if (leftPlanet) animatePlanetFromLeft(leftPlanet);
    if (rightPlanet) animatePlanetFromRight(rightPlanet);
    if (devPlanet) animatePlanetFromBottom(devPlanet);
    
    // Center the rocket flame if it exists
    centerRocketFlame();
    
    // Enhance planet glow effects
    enhancePlanetGlow();
  }
  
  function animatePlanetFromLeft(planet) {
    // [Planet-Fix] Animating left planet
    
    // Reset any existing transform to avoid conflicts
    resetPlanetStyle(planet);
    
    // Set initial position off-screen
    planet.style.transition = 'none';
    planet.style.transform = 'translate(-800px, 400px) scale(0.1)';
    planet.style.opacity = '0';
    
    // Force reflow
    void planet.offsetWidth;
    
    // Animate to final position
    planet.style.transition = 'transform 5s ease-out, opacity 5s ease-out';
    planet.style.transform = 'translate(0, 0) scale(0.9)';
    planet.style.opacity = '1';
    
    // 행성 도착 시 광원 효과 생성
    setTimeout(() => {
      // [Planet-Fix] Left planet arrival - creating burst effect
      // 행성 내부에 광원 폭발 효과 요소 생성
      const burstEffect = document.createElement('div');
      burstEffect.className = 'planet-burst-effect';
      burstEffect.style.cssText = `
        position: absolute;
        width: 150%;
        height: 150%;
        border-radius: 9999px;
        background: radial-gradient(circle, rgba(100,150,255,0.4) 0%, rgba(140,100,255,0.3) 50%, transparent 100%);
        filter: blur(15px);
        z-index: 31;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        animation: burstAnimation 1.2s forwards ease-out;
      `;
      planet.appendChild(burstEffect);
      
      // 1.2초 후 폭발 효과 제거
      setTimeout(() => {
        burstEffect.remove();
      }, 1200);
      
      // Add subtle bounce effect after burst
      setTimeout(() => {
        planet.style.transition = 'transform 9s ease-in-out infinite';
        planet.style.transform = 'translate(0, 0) scale(0.9)';
        planet.style.animation = 'bounce 9s ease-in-out infinite';
      }, 300);
    }, 5000);
  }
  
  function animatePlanetFromRight(planet) {
    // [Planet-Fix] Animating right planet
    
    // Reset any existing transform to avoid conflicts
    resetPlanetStyle(planet);
    
    // Set initial position off-screen
    planet.style.transition = 'none';
    planet.style.transform = 'translate(800px, 400px) scale(0.1)';
    planet.style.opacity = '0';
    
    // Force reflow
    void planet.offsetWidth;
    
    // Animate to final position with delay
    setTimeout(() => {
      planet.style.transition = 'transform 5s ease-out, opacity 5s ease-out';
      planet.style.transform = 'translate(0, 0) scale(0.9)';
      planet.style.opacity = '1';
      
      // 행성 도착 시 광원 효과 생성
      setTimeout(() => {
        // [Planet-Fix] Right planet arrival - creating burst effect
        // 행성 내부에 광원 폭발 효과 요소 생성
        const burstEffect = document.createElement('div');
        burstEffect.className = 'planet-burst-effect';
        burstEffect.style.cssText = `
          position: absolute;
          width: 150%;
          height: 150%;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(255,200,100,0.4) 0%, rgba(255,100,50,0.3) 50%, transparent 100%);
          filter: blur(15px);
          z-index: 31;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
          animation: burstAnimation 1.2s forwards ease-out;
        `;
        planet.appendChild(burstEffect);
        
        // 1.2초 후 폭발 효과 제거
        setTimeout(() => {
          burstEffect.remove();
        }, 1200);
        
        // Add subtle bounce effect after burst
        setTimeout(() => {
          planet.style.transition = 'transform 9s ease-in-out infinite';
          planet.style.transform = 'translate(0, 0) scale(0.9)';
          planet.style.animation = 'bounce 9s ease-in-out infinite';
        }, 300);
      }, 5000);
    }, 700); // Delay for right planet
  }
  
  function animatePlanetFromBottom(planet) {
    // [Planet-Fix] Animating dev planet
    
    // Reset any existing transform to avoid conflicts
    resetPlanetStyle(planet);
    
    // Set initial position off-screen
    planet.style.transition = 'none';
    planet.style.transform = 'translate(0, 800px) scale(0.1)';
    planet.style.opacity = '0';
    
    // Force reflow
    void planet.offsetWidth;
    
    // Animate to final position with delay
    setTimeout(() => {
      planet.style.transition = 'transform 5s ease-out, opacity 5s ease-out';
      planet.style.transform = 'translate(0, 0) scale(0.9)';
      planet.style.opacity = '1';
      
      // 행성 도착 시 광원 효과 생성
      setTimeout(() => {
        // [Planet-Fix] Dev planet arrival - creating burst effect
        // 행성 내부에 광원 폭발 효과 요소 생성
        const burstEffect = document.createElement('div');
        burstEffect.className = 'planet-burst-effect';
        burstEffect.style.cssText = `
          position: absolute;
          width: 150%;
          height: 150%;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(255,100,150,0.4) 0%, rgba(200,50,100,0.3) 50%, transparent 100%);
          filter: blur(15px);
          z-index: 31;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
          animation: burstAnimation 1.2s forwards ease-out;
        `;
        planet.appendChild(burstEffect);
        
        // 1.2초 후 폭발 효과 제거
        setTimeout(() => {
          burstEffect.remove();
        }, 1200);
        
        // Add subtle bounce effect after burst
        setTimeout(() => {
          planet.style.transition = 'transform 9s ease-in-out infinite';
          planet.style.transform = 'translate(0, 0) scale(0.9)';
          planet.style.animation = 'bounce 9s ease-in-out infinite';
        }, 300);
      }, 5000);
    }, 1400); // Longer delay for dev planet
  }
  
  function resetPlanetStyle(planet) {
    // Remove any existing animations or transforms that might conflict
    planet.style.animation = 'none';
    planet.style.transform = 'none';
    
    // Remove any CSS classes that might interfere
    planet.classList.remove('animate-bounce');
    planet.classList.remove('animate-pulse');
    
    // Make sure planets are visible and have proper z-index
    planet.style.display = 'block';
    planet.style.opacity = '0'; // Start invisible for animation
    planet.style.zIndex = '10';
    
    // Ensure proper will-change property for performance
    planet.style.willChange = 'transform, opacity';
  }
  
  function centerRocketFlame() {
    // Find the rocket flame element
    const rocketFlame = document.querySelector('.rocket-flame');
    if (rocketFlame) {
      // [Planet-Fix] Rocket flame found, but not modifying position
      // 로켓 플레임 위치 강제 변경 제거 - 원래 CSS 위치 유지
    }
  }
  
  function enhancePlanetGlow() {
    // Find all planet glow elements
    const glowElements = document.querySelectorAll('.planet-glow');
    
    glowElements.forEach(glow => {
      // [Planet-Fix] Enhancing planet glow
      glow.style.width = '120%';
      glow.style.height = '120%';
      glow.style.filter = 'blur(20px)';
      glow.style.opacity = '0.3';
      glow.style.background = 'radial-gradient(circle, rgba(126, 58, 242, 0.5) 0%, rgba(24, 109, 242, 0.2) 70%, transparent 100%)';
      glow.style.transition = 'opacity 3s ease-in';
      glow.style.opacity = '0.4';
    });
  }
  
  // Define keyframes for bounce and burst animations if they don't exist
  if (!document.querySelector('#planet-keyframes')) {
    const style = document.createElement('style');
    style.id = 'planet-keyframes';
    style.textContent = `
      @keyframes bounce {
        0%, 100% { transform: translate(0, 0) scale(0.9); }
        50% { transform: translate(0, -20px) scale(0.9); }
      }
      
      @keyframes burstAnimation {
        0% { transform: translate(-50%, -50%) scale(0.7); opacity: 0.2; }
        25% { transform: translate(-50%, -50%) scale(1.0); opacity: 0.6; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
        75% { transform: translate(-50%, -50%) scale(1.0); opacity: 0.4; }
        100% { transform: translate(-50%, -50%) scale(0.7); opacity: 0; }
      }
      
      /* 성능 최적화를 위한 transform 및 opacity 애니메이션 최적화 */
      .planet-burst-effect {
        will-change: transform, opacity;
      }
    `;
    document.head.appendChild(style);
  }
  
  // 전체 애니메이션 성능 최적화
  // [Planet-Fix] Optimizing rendering performance
  document.querySelectorAll('.left-planet, .right-planet, .dev-planet').forEach(planet => {
    planet.style.willChange = 'transform, opacity';
    planet.style.backfaceVisibility = 'hidden';
    planet.style.perspective = '1000px';
    planet.style.transform = 'translateZ(0)';
  });
})();
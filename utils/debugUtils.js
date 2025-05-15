/**
 * Debugging utilities for the application
 * Provides consistent logging and debugging tools
 */

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

/**
 * Enhanced console logging that only runs in development mode
 * @param {string} component - Component name for log source
 * @param {string} message - Log message
 * @param {any} data - Optional data to log
 */
function debugLog(component, message, data) {
  if (!isDev) return;
  
  const componentName = component ? `[${component}]` : '';
  
  if (data !== undefined) {
    console.log(`${componentName} ${message}`, data);
  } else {
    console.log(`${componentName} ${message}`);
  }
}

/**
 * Enhanced error logging that only shows full details in development mode
 * @param {string} component - Component name for log source
 * @param {string} message - Error message
 * @param {Error|any} error - The error object or data
 */
function debugError(component, message, error) {
  const componentName = component ? `[${component}]` : '';
  
  if (isDev) {
    console.error(`${componentName} ${message}`, error);
  } else {
    // In production, log minimal error info without potentially sensitive details
    console.error(`${componentName} ${message}`);
  }
}

/**
 * Performance logging utility for timing operations
 * Only logs in development mode
 */
class PerformanceTimer {
  constructor(operationName) {
    this.operationName = operationName;
    this.startTime = performance.now();
    this.markers = {};
  }

  /**
   * Mark a point in time during the operation
   * @param {string} markerName - Name of the marker
   */
  mark(markerName) {
    if (!isDev) return;
    this.markers[markerName] = performance.now();
  }

  /**
   * End the timer and log performance results
   * @param {string} [finalMarker] - Optional final marker name
   */
  end(finalMarker) {
    if (!isDev) return;
    
    const endTime = performance.now();
    if (finalMarker) {
      this.markers[finalMarker] = endTime;
    }
    
    const totalTime = endTime - this.startTime;
    
    console.log(`[Performance] ${this.operationName} - Total: ${totalTime.toFixed(2)}ms`);
    
    let lastTime = this.startTime;
    Object.entries(this.markers).forEach(([name, time]) => {
      const duration = time - lastTime;
      const totalPercent = ((time - this.startTime) / totalTime * 100).toFixed(1);
      
      console.log(`  → ${name}: ${duration.toFixed(2)}ms (${totalPercent}% of total)`);
      lastTime = time;
    });
  }
}

module.exports = {
  debugLog,
  debugError,
  PerformanceTimer,
  isDev
};
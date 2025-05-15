"use client";

/**
 * Collection of utility functions for safely executing client-side code
 * Prevents errors caused by browser API usage in SSR environment
 */

// Check if running in client environment
export const isClient = typeof window !== 'undefined';

/**
 * Execute function only on client side and return fallback value on server side
 * @param {Function} fn - Function to execute on client side
 * @param {any} fallbackValue - Fallback value to return on server side
 * @returns {any} - Result of fn() on client side, fallbackValue on server side
 */
export function safeClientSide(fn, fallbackValue = null) {
  if (isClient) {
    try {
      return fn();
    } catch (error) {
      console.error('Client-side execution error:', error);
      return fallbackValue;
    }
  }
  return fallbackValue;
}

/**
 * Safely access localStorage
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Default value
 * @returns {any} - Stored value or default value
 */
export function safeLocalStorage(key, defaultValue = null) {
  return safeClientSide(() => {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  }, defaultValue);
}

/**
 * Safely set localStorage
 * @param {string} key - localStorage key
 * @param {string} value - Value to store
 * @returns {boolean} - Success status
 */
export function safeSetLocalStorage(key, value) {
  return safeClientSide(() => {
    localStorage.setItem(key, value);
    return true;
  }, false);
}

/**
 * Safely access navigator properties
 * @param {string} property - Navigator property name
 * @param {any} defaultValue - Default value
 * @returns {any} - Navigator property value or default value
 */
export function safeNavigator(property, defaultValue = null) {
  return safeClientSide(() => {
    return navigator[property] || defaultValue;
  }, defaultValue);
}

/**
 * Safely get connection information
 * @returns {Object} - Connection information
 */
export function getConnectionInfo() {
  return safeClientSide(() => {
    const online = navigator.onLine;
    
    // Handle browsers without navigator.connection
    if (!navigator.connection) {
      return { online, saveData: false, connectionType: 'unknown' };
    }
    
    return {
      online,
      saveData: navigator.connection.saveData || false,
      connectionType: navigator.connection.effectiveType || 'unknown'
    };
  }, { online: true, saveData: false, connectionType: 'unknown' });
}

/**
 * Safely get window dimensions
 * @returns {Object} - Window dimensions
 */
export function getWindowDimensions() {
  return safeClientSide(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }), { width: 1200, height: 800 }); // Reasonable default values for SSR
}

/**
 * Safely add event listener
 * @param {EventTarget} target - Event target
 * @param {string} event - Event name
 * @param {Function} handler - Handler function
 * @param {Object} options - Event options
 * @returns {Function} - Function to remove event listener
 */
export function safeAddEventListener(target, event, handler, options) {
  return safeClientSide(() => {
    target.addEventListener(event, handler, options);
    return () => target.removeEventListener(event, handler, options);
  }, () => {});
}

/**
 * Safely get document reference
 * @returns {Document|null} - document object or null
 */
export function safeDocument() {
  return safeClientSide(() => document, null);
}

/**
 * Safely access document.cookie
 * @param {string} name - Cookie name
 * @param {string} defaultValue - Default value
 * @returns {string} - Cookie value or default value
 */
export function safeCookie(name, defaultValue = '') {
  return safeClientSide(() => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : defaultValue;
  }, defaultValue);
}
// Test script to verify infobox functionality
// This can be run in the browser console on the map page

console.log('Testing infobox functionality...');

// Check if Google Maps is loaded
if (window.google && window.google.maps) {
  console.log('✓ Google Maps API is loaded');
  
  // Check if map exists
  const mapElement = document.querySelector('[style*="position: relative"]');
  if (mapElement) {
    console.log('✓ Map container found');
  } else {
    console.log('✗ Map container not found');
  }
  
  // Check for infobox overlays
  const overlays = document.querySelectorAll('[style*="position: absolute"]');
  console.log(`Found ${overlays.length} overlay elements`);
  
  overlays.forEach((overlay, index) => {
    console.log(`Overlay ${index + 1}:`, {
      text: overlay.textContent,
      visible: overlay.style.opacity !== '0',
      position: overlay.style.position
    });
  });
  
} else {
  console.log('✗ Google Maps API not loaded');
}

// Check React state (if accessible)
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('✓ React DevTools available - check component state there');
}
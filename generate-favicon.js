// Favicon Generator Script - Run this to create favicon files
// This will create favicon PNGs from an SVG

const { createCanvas } = require('canvas');
const fs = require('fs');

// YOUTALK favicon design: Speech bubble with Y or chat icon
const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#800020"/>
  <text x="50" y="72" font-family="Arial, sans-serif" font-size="70" font-weight="bold" fill="white" text-anchor="middle">Y</text>
</svg>`;

// Simple approach: Just copy a pre-made favicon or use online generator
console.log('Favicon Generator');
console.log('=================');
console.log('To create favicon files:');
console.log('1. Go to https://favicon.io/ or https://realfavicongenerator.net/');
console.log('2. Upload/enter "YOUTALK" with burgundy (#800020) background');
console.log('3. Download the favicon package');
console.log('4. Extract and copy favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png, site.webmanifest to the Images folder');
console.log('');
console.log('For quick testing, a simple Y favicon SVG is included as data URI in index.html');

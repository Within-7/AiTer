const png2icons = require('png2icons');
const fs = require('fs');
const path = require('path');

const input = path.join(__dirname, '../assets/APP_ICON.png');
const outputIcns = path.join(__dirname, '../build/icon.icns');
const outputIco = path.join(__dirname, '../build/icon.ico');

console.log('Reading APP_ICON.png...');
const pngBuffer = fs.readFileSync(input);

console.log('Generating icon.icns for macOS...');
const icnsBuffer = png2icons.createICNS(pngBuffer, png2icons.BICUBIC, 0);
fs.writeFileSync(outputIcns, icnsBuffer);
console.log('✓ Generated icon.icns');

console.log('Generating icon.ico for Windows...');
const icoBuffer = png2icons.createICO(pngBuffer, png2icons.BICUBIC, 0, true);
fs.writeFileSync(outputIco, icoBuffer);
console.log('✓ Generated icon.ico');

console.log('\nIcon generation complete!');
console.log('  - macOS: build/icon.icns');
console.log('  - Windows: build/icon.ico');

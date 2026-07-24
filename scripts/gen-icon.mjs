import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'fs';

let svgContent = '';
if (existsSync('assets/icon.svg')) {
  svgContent = readFileSync('assets/icon.svg', 'utf-8');
} else {
  svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="120" y1="80" x2="900" y2="940" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#171923"/>
      <stop offset="0.52" stop-color="#0B0C12"/>
      <stop offset="1" stop-color="#05060A"/>
    </linearGradient>
    <linearGradient id="accent" x1="260" y1="210" x2="790" y2="820" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#67E8F9"/>
      <stop offset="0.42" stop-color="#60A5FA"/>
      <stop offset="1" stop-color="#A855F7"/>
    </linearGradient>
  </defs>
  <rect x="52" y="52" width="920" height="920" rx="228" fill="url(#bg)"/>
</svg>`;
}

async function main() {
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = await Promise.all(
    sizes.map(s => sharp(Buffer.from(svgContent))
      .resize(s, s)
      .png()
      .toBuffer())
  );

  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);     // reserved
  icoHeader.writeUInt16LE(1, 2);     // ICO type
  icoHeader.writeUInt16LE(sizes.length, 4); // count

  const dirSize = 16 * sizes.length;
  let offset = 6 + dirSize;
  const dirEntries = [];

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);      // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1);      // height
    entry.writeUInt8(0, 2);   // colors
    entry.writeUInt8(0, 3);   // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(buf.length, 8);  // size
    entry.writeUInt32LE(offset, 12);     // offset
    dirEntries.push(entry);
    offset += buf.length;
  }

  const ico = Buffer.concat([icoHeader, ...dirEntries, ...pngBuffers]);
  writeFileSync('assets/icon.ico', ico);
  
  // Also save as PNG for main window or renderer uses if needed
  writeFileSync('assets/icon.png', await sharp(Buffer.from(svgContent)).resize(512, 512).png().toBuffer());
  
  console.log('Successfully generated assets/icon.ico and assets/icon.png');
}

main().catch(console.error);

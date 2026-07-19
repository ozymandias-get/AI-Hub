import sharp from 'sharp';
import { writeFileSync } from 'fs';

const svgContent = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Cyan to Magenta Cyber Gradient -->
    <linearGradient id="cyberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F5FF" />
      <stop offset="40%" stop-color="#7B2CBF" />
      <stop offset="100%" stop-color="#FF007F" />
    </linearGradient>
  </defs>

  <!-- Background Circle (Dark Obsidian) -->
  <circle cx="256" cy="256" r="236" fill="#0d0e15" stroke="url(#cyberGradient)" stroke-width="16" />

  <!-- Brain Circuit Group -->
  <g transform="translate(106, 106) scale(12.5)">
    <!-- Main Brain Outlines -->
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" 
          fill="none" stroke="url(#cyberGradient)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" 
          fill="none" stroke="url(#cyberGradient)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    
    <!-- Connecting Circuits -->
    <path d="M9 13a4.5 4.5 0 0 0 3-4" fill="none" stroke="url(#cyberGradient)" stroke-width="1.5" stroke-linecap="round" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4" fill="none" stroke="url(#cyberGradient)" stroke-width="1.5" stroke-linecap="round" />
    
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" fill="none" stroke="url(#cyberGradient)" stroke-width="1.5" stroke-linecap="round" />
    <path d="M17.997 5.125a3 3 0 0 1-.398 1.375" fill="none" stroke="url(#cyberGradient)" stroke-width="1.5" stroke-linecap="round" />
    
    <path d="M3.477 10.896a4 4 0 0 1 .556 6.588" fill="none" stroke="url(#cyberGradient)" stroke-width="1.5" stroke-linecap="round" />
    <path d="M20.523 10.896a4 4 0 0 0-.556 6.588" fill="none" stroke="url(#cyberGradient)" stroke-width="1.5" stroke-linecap="round" />

    <!-- Neural Nodes / Dots -->
    <circle cx="12" cy="5" r="1.2" fill="#00F5FF" />
    <circle cx="12" cy="18" r="1.2" fill="#FF007F" />
    <circle cx="12" cy="9" r="1.0" fill="#7B2CBF" />
    
    <!-- Left nodes -->
    <circle cx="6" cy="5.1" r="0.8" fill="#00F5FF" />
    <circle cx="3.5" cy="10.9" r="0.8" fill="#00F5FF" />
    
    <!-- Right nodes -->
    <circle cx="18" cy="5.1" r="0.8" fill="#FF007F" />
    <circle cx="20.5" cy="10.9" r="0.8" fill="#FF007F" />
  </g>
</svg>`;

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

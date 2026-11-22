import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clean dual-bubble Nexo logo WITHOUT any "N" letter
// Vibrant royal blue back bubble + smooth blue->purple->pink gradient front bubble with subtle soft drop shadow
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <linearGradient id="frontGrad" x1="10%" y1="10%" x2="95%" y2="95%">
      <stop offset="0%" stop-color="#0055ff" />
      <stop offset="48%" stop-color="#7b2cbf" />
      <stop offset="100%" stop-color="#d946ef" />
    </linearGradient>
    <linearGradient id="backGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#003cd6" />
      <stop offset="100%" stop-color="#0055ff" />
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity="0.32" />
    </filter>
    <filter id="innerGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
      <feFlood flood-color="#ffffff" flood-opacity="0.25" />
      <feComposite in2="shadowDiff" operator="in" />
      <feComposite in2="SourceGraphic" operator="over" />
    </filter>
  </defs>

  <!-- 1. Back Bubble (Royal Blue) scaled nicely for 512x512 -->
  <path
    d="M170 80 C170 48 198 32 230 32 H385 C420 32 450 62 450 96 V238 C450 274 420 304 385 304 H350 L390 376 L298 304 H230 C195 304 170 274 170 238 Z"
    fill="url(#backGrad)"
    filter="url(#softShadow)"
  />

  <!-- 2. Overlapping Front Bubble (Blue -> Purple -> Pink Gradient) with bottom-left tail and NO "N" letter -->
  <path
    d="M72 188 C72 136 114 96 164 96 H338 C388 96 430 136 430 188 V318 C430 370 388 410 338 410 H184 L92 482 V390 C72 370 72 340 72 318 Z"
    fill="url(#frontGrad)"
    filter="url(#softShadow)"
  />

  <!-- Subtle glossy highlight reflection on front bubble -->
  <ellipse cx="250" cy="150" rx="140" ry="24" fill="#ffffff" opacity="0.12" />
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: {
    mode: 'width',
    value: 512,
  },
});

const pngData = resvg.render();
const pngBuffer = pngData.asPng();

const outPath = path.resolve(__dirname, '../public/logo.png');
fs.writeFileSync(outPath, pngBuffer);
console.log('Successfully generated public/logo.png (' + pngBuffer.length + ' bytes)');

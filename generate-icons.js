#!/usr/bin/env node
// Generates icons/icon{16,48,128}.png — dark #0c0b0a background, white "V".
// No npm dependencies — uses only Node.js built-ins (zlib, fs, path).
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const l = Buffer.allocUnsafe(4); l.writeUInt32BE(data.length);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([l, t, data, crcBuf]);
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function makePNG(size) {
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGB

  const stride = 1 + size * 3;
  const raw = Buffer.allocUnsafe(size * stride);

  const cx = size / 2;
  const top = size * 0.2;
  const bot = size * 0.76;
  const hw = size * 0.32;
  const thick = Math.max(1.5, size * 0.11);

  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter byte: none
    for (let x = 0; x < size; x++) {
      const off = y * stride + 1 + x * 3;
      const dL = distToSegment(x + 0.5, y + 0.5, cx - hw, top, cx, bot);
      const dR = distToSegment(x + 0.5, y + 0.5, cx + hw, top, cx, bot);
      const onV = Math.min(dL, dR) < thick;
      raw[off]     = onV ? 255 : 12;
      raw[off + 1] = onV ? 255 : 11;
      raw[off + 2] = onV ? 255 : 10;
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

fs.mkdirSync(path.join(__dirname, 'icons'), { recursive: true });
for (const size of [16, 48, 128]) {
  const data = makePNG(size);
  const outPath = path.join(__dirname, `icons/icon${size}.png`);
  fs.writeFileSync(outPath, data);
  console.log(`Written: icons/icon${size}.png (${data.length} bytes)`);
}

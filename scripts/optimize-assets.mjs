import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
const entries = [
  ["scene-v2", 720, 1280, 83],
  ["suitcase-red-v1", 300, 450, 85],
  ["suitcase-yellow-v1", 260, 390, 85],
  ["suitcase-purple-v1", 220, 330, 85],
  ["ball-v1", 240, 240, 85],
  ["flamingo-v1", 360, 360, 85],
  ["flamingo-flat-v1", 320, 220, 85],
];
await mkdir(new URL("../src/assets/", import.meta.url), { recursive: true });
let before = 0,
  after = 0;
for (const [name, width, height, quality] of entries) {
  const source = new URL(`../public/assets/${name}.png`, import.meta.url);
  const output = new URL(`../src/assets/${name}.webp`, import.meta.url);
  await sharp(source.pathname.replace(/^\/(\w:)/, "$1"))
    .resize({ width, height, fit: "inside", withoutEnlargement: true })
    .webp({ quality, alphaQuality: 100, effort: 6 })
    .toFile(output.pathname.replace(/^\/(\w:)/, "$1"));
  const a = (await stat(source)).size,
    b = (await stat(output)).size;
  before += a;
  after += b;
  console.log(`${name}: ${a} -> ${b} bytes`);
}
console.log(
  JSON.stringify({
    before,
    after,
    reductionPercent: ((1 - after / before) * 100).toFixed(1),
  }),
);

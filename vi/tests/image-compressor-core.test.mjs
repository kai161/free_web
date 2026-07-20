import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  MAX_FILE_BYTES,
  constrainDimensions,
  extensionForMime,
  formatBytes,
  nextDimensions,
  parseTargetBytes,
  searchQuality,
  savingsPercent,
  supportsQualitySearch,
  validateFileMetadata,
} from "../assets/js/image-compressor-core.mjs";

const viRoot = fileURLToPath(new URL("..", import.meta.url));

function readViFile(relativePath) {
  return readFileSync(new URL(relativePath, new URL("../", import.meta.url)), "utf8");
}

test("parseTargetBytes converts KB and MB using binary units", () => {
  assert.equal(parseTargetBytes(500, "KB"), 512_000);
  assert.equal(parseTargetBytes(2, "MB"), 2_097_152);
  assert.equal(parseTargetBytes("1.5", "MB"), 1_572_864);
});

test("parseTargetBytes rejects invalid targets and units", () => {
  assert.throws(() => parseTargetBytes(0, "KB"), RangeError);
  assert.throws(() => parseTargetBytes(-1, "MB"), RangeError);
  assert.throws(() => parseTargetBytes("abc", "KB"), RangeError);
  assert.throws(() => parseTargetBytes(10, "GB"), RangeError);
});

test("constrainDimensions preserves ratio and avoids enlargement", () => {
  assert.deepEqual(constrainDimensions(8000, 4000, 4096), { width: 4096, height: 2048 });
  assert.deepEqual(constrainDimensions(1200, 800, 4096), { width: 1200, height: 800 });
  assert.deepEqual(constrainDimensions(3000, 6000, 3000), { width: 1500, height: 3000 });
});

test("constrainDimensions rejects invalid dimensions", () => {
  assert.throws(() => constrainDimensions(0, 100, 4096), RangeError);
  assert.throws(() => constrainDimensions(100, Number.NaN, 4096), RangeError);
  assert.throws(() => constrainDimensions(100, 100, 0), RangeError);
});

test("formatBytes creates compact user-facing values", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(999), "999 B");
  assert.equal(formatBytes(1024), "1 KB");
  assert.equal(formatBytes(1536), "1.5 KB");
  assert.equal(formatBytes(2 * 1024 * 1024), "2 MB");
});

test("savingsPercent is clamped to a useful range", () => {
  assert.equal(savingsPercent(1000, 400), 60);
  assert.equal(savingsPercent(1000, 1000), 0);
  assert.equal(savingsPercent(1000, 1200), 0);
  assert.equal(savingsPercent(0, 0), 0);
});

test("validateFileMetadata accepts supported non-empty images", () => {
  assert.deepEqual(
    validateFileMetadata({ type: "image/jpeg", size: 1024 }),
    { valid: true, code: "ok" },
  );
  assert.deepEqual(
    validateFileMetadata({ type: "image/webp", size: MAX_FILE_BYTES }),
    { valid: true, code: "ok" },
  );
});

test("validateFileMetadata returns stable error codes", () => {
  assert.deepEqual(validateFileMetadata(null), { valid: false, code: "missing_file" });
  assert.deepEqual(
    validateFileMetadata({ type: "image/gif", size: 100 }),
    { valid: false, code: "unsupported_type" },
  );
  assert.deepEqual(
    validateFileMetadata({ type: "image/png", size: 0 }),
    { valid: false, code: "empty_file" },
  );
  assert.deepEqual(
    validateFileMetadata({ type: "image/png", size: MAX_FILE_BYTES + 1 }),
    { valid: false, code: "file_too_large" },
  );
});

test("searchQuality keeps the highest tested quality under the target", async () => {
  const encode = async quality => ({ size: Math.round(quality * 1000) });
  const result = await searchQuality(encode, 600, {
    minQuality: 0.3,
    maxQuality: 0.9,
    iterations: 8,
  });

  assert.equal(result.metTarget, true);
  assert.ok(result.blob.size <= 600);
  assert.ok(result.quality > 0.59);
  assert.ok(result.quality <= 0.6);
  assert.ok(result.attempts <= 10);
});

test("searchQuality returns the smallest result when the target cannot be met", async () => {
  const encode = async quality => ({ size: 1200 + Math.round(quality * 100) });
  const result = await searchQuality(encode, 1000, {
    minQuality: 0.3,
    maxQuality: 0.9,
    iterations: 5,
  });

  assert.equal(result.metTarget, false);
  assert.equal(result.quality, 0.3);
  assert.equal(result.blob.size, 1230);
});

test("searchQuality rejects invalid encoder output", async () => {
  await assert.rejects(
    () => searchQuality(async () => null, 1000),
    /valid Blob-like value/,
  );
});

test("nextDimensions reduces area while preserving ratio", () => {
  assert.deepEqual(nextDimensions(4000, 2000, 4_000_000, 1_000_000), {
    width: 2000,
    height: 1000,
  });
  assert.deepEqual(nextDimensions(1200, 800, 500_000, 600_000), {
    width: 1200,
    height: 800,
  });
});

test("nextDimensions respects the minimum long edge", () => {
  assert.deepEqual(nextDimensions(400, 200, 10_000_000, 1_000_000, 320), {
    width: 320,
    height: 160,
  });
});

test("mime helpers distinguish quality-controlled formats", () => {
  assert.equal(supportsQualitySearch("image/jpeg"), true);
  assert.equal(supportsQualitySearch("image/webp"), true);
  assert.equal(supportsQualitySearch("image/png"), false);
  assert.equal(extensionForMime("image/jpeg"), "jpg");
  assert.equal(extensionForMime("image/webp"), "webp");
  assert.equal(extensionForMime("image/png"), "png");
  assert.throws(() => extensionForMime("image/gif"), RangeError);
});

test("Vietnamese home page is self-contained and localized", () => {
  const html = readViFile("index.html");
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /https:\/\/vi\.freetools\.best\//);
  assert.match(html, /href="assets\/styles\.css"/);
  assert.match(html, /href="nen-anh\.html"/);
  assert.doesNotMatch(html, /(?:href|src)="\.\.\//);
});

test("image compressor page contains the MVP controls", () => {
  const html = readViFile("nen-anh.html");
  assert.match(html, /<html lang="vi">/);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/vi\.freetools\.best\/nen-anh\.html">/,
  );
  for (const id of [
    "fileInput",
    "dropZone",
    "targetPreset",
    "customTarget",
    "targetUnit",
    "outputFormat",
    "compressButton",
    "statusRegion",
    "previewImage",
    "downloadButton",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
  }
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /Nén ảnh/);
  assert.doesNotMatch(html, /(?:href|src)="\.\.\//);
});

test("image compressor page loads the browser application module", () => {
  const html = readViFile("nen-anh.html");
  assert.match(
    html,
    /<script type="module" src="assets\/js\/image-compressor-app\.mjs"><\/script>/,
  );
});

test("browser application keeps image processing local and releases object URLs", () => {
  const app = readViFile("assets/js/image-compressor-app.mjs");
  assert.match(app, /createImageBitmap/);
  assert.match(app, /new Image\(\)/);
  assert.match(app, /\.toBlob\(/);
  assert.match(app, /URL\.createObjectURL/);
  assert.match(app, /URL\.revokeObjectURL/);
  assert.match(app, /Không thể/);
  assert.doesNotMatch(app, /fetch\(|XMLHttpRequest|FormData/);
});

test("robots and sitemap describe only the Vietnamese site", () => {
  const robots = readViFile("robots.txt");
  const sitemap = readViFile("sitemap.xml");

  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/vi\.freetools\.best\/sitemap\.xml/);
  assert.match(sitemap, /https:\/\/vi\.freetools\.best\/<\/loc>/);
  assert.match(sitemap, /https:\/\/vi\.freetools\.best\/nen-anh\.html<\/loc>/);
  assert.equal((sitemap.match(/<url>/g) || []).length, 2);
  assert.doesNotMatch(sitemap, /br\.freetools\.best/);
});

test("both Vietnamese pages expose complete indexable metadata", () => {
  for (const page of ["index.html", "nen-anh.html"]) {
    const html = readViFile(page);
    assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large">/);
    assert.match(html, /<link rel="alternate" hreflang="vi-VN" href="https:\/\/vi\.freetools\.best\//);
    assert.match(html, /<meta property="og:url" content="https:\/\/vi\.freetools\.best\//);
    assert.doesNotMatch(html, /br\.freetools\.best|pt-BR|Brasil Tools/);
  }
});

test("image compressor exposes FAQ structured data for visible questions", () => {
  const html = readViFile("nen-anh.html");
  assert.match(html, /"@type": "FAQPage"/);
  assert.match(html, /"@type": "Question"/);
  assert.match(html, /Ảnh có được tải lên máy chủ không\?/);
  assert.match(html, /Nén ảnh có làm giảm chất lượng không\?/);
});

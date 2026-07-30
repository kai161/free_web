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
import {
  buildCharacterSets,
  estimateEntropy,
  generatePassword,
  secureRandomIndex,
  strengthFromEntropy,
} from "../assets/js/password-generator-core.mjs";
import {
  analyzeText,
  normalizeSpaces,
  removeBlankLines,
  removeDuplicateLines,
  sortLines,
  toLowercase,
  toTitleCase,
  toUppercase,
} from "../assets/js/text-toolbox-core.mjs";

const viRoot = fileURLToPath(new URL("..", import.meta.url));

function readViFile(relativePath) {
  return readFileSync(new URL(relativePath, new URL("../", import.meta.url)), "utf8");
}

test("analyzeText returns zero metrics for empty text", () => {
  assert.deepEqual(analyzeText(""), {
    characters: 0,
    charactersNoWhitespace: 0,
    words: 0,
    sentences: 0,
    lines: 0,
    bytes: 0,
    readingMinutes: 0,
  });
});

test("analyzeText counts Vietnamese text, emoji and lines", () => {
  const text = "Xin chào 👋!\nBạn khỏe không?";
  const result = analyzeText(text);

  assert.equal(result.characters, 27);
  assert.equal(result.charactersNoWhitespace, 22);
  assert.equal(result.words, 6);
  assert.equal(result.sentences, 2);
  assert.equal(result.lines, 2);
  assert.equal(result.bytes, new TextEncoder().encode(text).length);
  assert.equal(result.readingMinutes, 1);
});

test("analyzeText treats Unicode whitespace and simple emoji correctly", () => {
  const whitespace = analyzeText("a\u00a0b\tc");
  const emoji = analyzeText("👋");

  assert.equal(whitespace.characters, 5);
  assert.equal(whitespace.charactersNoWhitespace, 3);
  assert.equal(emoji.characters, 1);
  assert.equal(emoji.bytes, 4);
});

test("analyzeText handles whitespace-only and unpunctuated text", () => {
  const whitespaceOnly = analyzeText(" \t\n");
  const unpunctuated = analyzeText("Xin chào");

  assert.equal(whitespaceOnly.words, 0);
  assert.equal(whitespaceOnly.sentences, 0);
  assert.equal(whitespaceOnly.lines, 2);
  assert.equal(unpunctuated.words, 2);
  assert.equal(unpunctuated.sentences, 1);
});

test("analyzeText calculates reading-time and line boundaries", () => {
  const twoHundredWords = Array(200).fill("từ").join(" ");
  const twoHundredOneWords = `${twoHundredWords} từ`;

  assert.equal(analyzeText(twoHundredWords).readingMinutes, 1);
  assert.equal(analyzeText(twoHundredOneWords).readingMinutes, 2);
  assert.equal(analyzeText("a\r\nb\nc").lines, 3);
});

test("Vietnamese casing uses the vi locale", () => {
  assert.equal(toUppercase("tiếng việt"), "TIẾNG VIỆT");
  assert.equal(toLowercase("TIẾNG VIỆT"), "tiếng việt");
  assert.equal(toTitleCase("công cụ TRỰC TUYẾN"), "Công Cụ Trực Tuyến");
});

test("normalizeSpaces preserves line structure", () => {
  assert.equal(normalizeSpaces("  xin   chào  \n  việt nam "), "xin chào\nviệt nam");
  assert.equal(normalizeSpaces(" a\t\tb\r\n c  d "), "a b\nc d");
});

test("line helpers preserve deterministic results", () => {
  assert.equal(removeBlankLines("a\n \nb"), "a\nb");
  assert.equal(removeBlankLines("a\r\n\r\nb"), "a\nb");
  assert.equal(removeDuplicateLines("b\na\nb"), "b\na");
  assert.equal(sortLines("b\na\nb"), "a\nb\nb");
});

test("text transformations handle empty input without mutating source text", () => {
  const source = " b\n a\n b";

  for (const transform of [
    toUppercase,
    toLowercase,
    toTitleCase,
    normalizeSpaces,
    removeBlankLines,
    removeDuplicateLines,
    sortLines,
  ]) {
    assert.equal(transform(""), "");
    transform(source);
    assert.equal(source, " b\n a\n b");
  }
});

test("removeDuplicateLines keeps the first complete line occurrence", () => {
  assert.equal(removeDuplicateLines("xin chào\nviệt nam\nxin chào\nXin chào"), [
    "xin chào",
    "việt nam",
    "Xin chào",
  ].join("\n"));
});

test("buildCharacterSets returns only enabled character groups", () => {
  assert.deepEqual(
    buildCharacterSets({
      upper: true,
      lower: false,
      numbers: true,
      symbols: false,
      excludeAmbiguous: false,
    }),
    ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0123456789"],
  );
});

test("buildCharacterSets removes ambiguous characters when requested", () => {
  const groups = buildCharacterSets({
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: true,
  });

  assert.equal(groups.length, 4);
  assert.equal(groups.join("").match(/[0O1lI]/), null);
});

test("secureRandomIndex rejects biased values before applying modulo", () => {
  const values = [0xffff_ffff, 7];
  const fillRandom = target => {
    target[0] = values.shift();
  };

  assert.equal(secureRandomIndex(10, fillRandom), 7);
  assert.equal(values.length, 0);
});

test("secureRandomIndex rejects invalid ranges", () => {
  assert.throws(() => secureRandomIndex(0), RangeError);
  assert.throws(() => secureRandomIndex(-1), RangeError);
  assert.throws(() => secureRandomIndex(1.5), RangeError);
});

test("generatePassword guarantees every selected character group", () => {
  const password = generatePassword(
    {
      length: 20,
      upper: true,
      lower: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: false,
    },
    () => 0,
  );

  assert.equal(password.length, 20);
  assert.match(password, /[A-Z]/);
  assert.match(password, /[a-z]/);
  assert.match(password, /[0-9]/);
  assert.match(password, /[!@#$%&*?+\-_=\.]/);
});

test("generatePassword honors ambiguous-character exclusion", () => {
  const password = generatePassword(
    {
      length: 64,
      upper: true,
      lower: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: true,
    },
    () => 0,
  );

  assert.equal(password.match(/[0O1lI]/), null);
});

test("generatePassword validates length and selected groups", () => {
  const baseOptions = {
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: true,
  };

  assert.throws(() => generatePassword({ ...baseOptions, length: 7 }), RangeError);
  assert.throws(() => generatePassword({ ...baseOptions, length: 65 }), RangeError);
  assert.throws(
    () =>
      generatePassword({
        length: 20,
        upper: false,
        lower: false,
        numbers: false,
        symbols: false,
      }),
    /character_group_required/,
  );
});

test("estimateEntropy returns rounded bits for the effective pool", () => {
  assert.equal(estimateEntropy(20, 62), 119);
  assert.equal(estimateEntropy(8, 10), 27);
  assert.throws(() => estimateEntropy(0, 62), RangeError);
  assert.throws(() => estimateEntropy(20, 1), RangeError);
});

test("strengthFromEntropy maps stable Vietnamese strength labels", () => {
  assert.deepEqual(strengthFromEntropy(39), { level: "weak", label: "Yếu" });
  assert.deepEqual(strengthFromEntropy(40), { level: "medium", label: "Trung bình" });
  assert.deepEqual(strengthFromEntropy(60), { level: "strong", label: "Mạnh" });
  assert.deepEqual(strengthFromEntropy(80), {
    level: "very-strong",
    label: "Rất mạnh",
  });
});

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
  assert.match(html, /href="tao-mat-khau-ngau-nhien\.html"/);
  assert.match(html, /href="dem-ky-tu\.html"/);
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

test("password generator page contains the approved Vietnamese controls", () => {
  const html = readViFile("tao-mat-khau-ngau-nhien.html");

  assert.match(html, /<html lang="vi">/);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/vi\.freetools\.best\/tao-mat-khau-ngau-nhien\.html">/,
  );

  for (const id of [
    "passwordOutput",
    "passwordLength",
    "passwordLengthValue",
    "includeUpper",
    "includeLower",
    "includeNumbers",
    "includeSymbols",
    "excludeAmbiguous",
    "generateButton",
    "copyButton",
    "generateBatchButton",
    "batchResults",
    "strengthLabel",
    "entropyValue",
    "passwordStatus",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
  }

  assert.match(html, /id="passwordLength"[^>]+min="8"[^>]+max="64"[^>]+value="20"/);
  assert.match(html, /Tạo mật khẩu ngẫu nhiên/);
  assert.doesNotMatch(html, /(?:href|src)="\.\.\//);
});

test("password generator page exposes matching SEO and FAQ schemas", () => {
  const html = readViFile("tao-mat-khau-ngau-nhien.html");

  assert.match(html, /"@type": "WebApplication"/);
  assert.match(html, /"@type": "BreadcrumbList"/);
  assert.match(html, /"@type": "FAQPage"/);
  assert.match(html, /Mật khẩu có được gửi lên máy chủ không\?/);
  assert.match(html, /Mật khẩu dài bao nhiêu là an toàn\?/);
  assert.match(
    html,
    /<script type="module" src="assets\/js\/password-generator-app\.mjs"><\/script>/,
  );
  assert.match(html, /window\.va = window\.va \|\| function/);
  assert.match(html, /script\.src = ['"]\/_vercel\/insights\/script\.js['"]/);
});

test("password generator application binds local-only browser interactions", () => {
  const app = readViFile("assets/js/password-generator-app.mjs");

  assert.match(app, /generatePassword/);
  assert.match(app, /estimateEntropy/);
  assert.match(app, /strengthFromEntropy/);
  assert.match(app, /getElementById\("generateButton"\)/);
  assert.match(app, /getElementById\("copyButton"\)/);
  assert.match(app, /getElementById\("generateBatchButton"\)/);
  assert.match(app, /addEventListener\("click"/);
  assert.match(app, /navigator\.clipboard\.writeText/);
  assert.match(app, /document\.createElement\("textarea"\)/);
  assert.doesNotMatch(
    app,
    /fetch\(|XMLHttpRequest|FormData|localStorage|sessionStorage|window\.va\s*\(\s*["']event/,
  );
});

test("text toolbox page contains the approved Vietnamese controls", () => {
  const html = readViFile("dem-ky-tu.html");

  assert.match(html, /<html lang="vi">/);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/vi\.freetools\.best\/dem-ky-tu\.html">/,
  );

  for (const id of [
    "sourceText",
    "charactersWithSpaces",
    "charactersWithoutSpaces",
    "wordCount",
    "sentenceCount",
    "lineCount",
    "byteCount",
    "readingTime",
    "uppercaseButton",
    "lowercaseButton",
    "titleCaseButton",
    "normalizeSpacesButton",
    "removeBlankLinesButton",
    "removeDuplicateLinesButton",
    "sortLinesButton",
    "resultText",
    "copyResultButton",
    "downloadResultButton",
    "clearResultButton",
    "textToolStatus",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
  }

  assert.match(html, /Đếm ký tự/);
  assert.match(html, /href="assets\/styles\.css"/);
  assert.doesNotMatch(html, /(?:href|src)="\.\.\//);
});

test("text toolbox page exposes matching SEO and FAQ schemas", () => {
  const html = readViFile("dem-ky-tu.html");

  assert.match(html, /"@type": "WebApplication"/);
  assert.match(html, /"@type": "BreadcrumbList"/);
  assert.match(html, /"@type": "FAQPage"/);
  assert.match(html, /Văn bản có được gửi lên máy chủ không\?/);
  assert.match(html, /Công cụ đếm ký tự như thế nào\?/);
  assert.match(
    html,
    /<script type="module" src="assets\/js\/text-toolbox-app\.mjs"><\/script>/,
  );
  assert.match(html, /window\.va = window\.va \|\| function/);
  assert.match(html, /script\.src = ['"]\/_vercel\/insights\/script\.js['"]/);
  assert.doesNotMatch(html, /fetch\(|XMLHttpRequest|localStorage|sessionStorage/);
});

test("text toolbox application binds local-only browser interactions", () => {
  const app = readViFile("assets/js/text-toolbox-app.mjs");

  for (const importedFunction of [
    "analyzeText",
    "normalizeSpaces",
    "removeBlankLines",
    "removeDuplicateLines",
    "sortLines",
    "toLowercase",
    "toTitleCase",
    "toUppercase",
  ]) {
    assert.match(app, new RegExp(importedFunction));
  }

  assert.match(app, /getElementById\("sourceText"\)/);
  assert.match(app, /addEventListener\("input"/);
  assert.match(app, /addEventListener\("click"/);
  assert.match(app, /navigator\.clipboard\.writeText/);
  assert.match(app, /document\.createElement\("textarea"\)/);
  assert.match(app, /new Blob\(/);
  assert.match(app, /URL\.createObjectURL/);
  assert.match(app, /URL\.revokeObjectURL/);
  assert.doesNotMatch(
    app,
    /fetch\(|XMLHttpRequest|FormData|localStorage|sessionStorage|console\.|window\.va\s*\(\s*["']event/,
  );
});

test("Vietnamese navigation and home cards expose all live tools", () => {
  const home = readViFile("index.html");
  const compressor = readViFile("nen-anh.html");
  const passwordGenerator = readViFile("tao-mat-khau-ngau-nhien.html");
  const textToolbox = readViFile("dem-ky-tu.html");

  assert.match(home, /<h3>Tạo mật khẩu ngẫu nhiên<\/h3>/);
  assert.match(home, /<h3>Đếm ký tự và từ<\/h3>/);
  assert.ok(
    (home.match(/href="tao-mat-khau-ngau-nhien\.html"/g) || []).length >= 2,
    "home should link the password page from navigation and a tool card",
  );
  assert.ok(
    (home.match(/href="dem-ky-tu\.html"/g) || []).length >= 2,
    "home should link the text toolbox from navigation and a tool card",
  );
  assert.match(compressor, /href="tao-mat-khau-ngau-nhien\.html"/);
  assert.match(compressor, /href="dem-ky-tu\.html"/);
  assert.match(passwordGenerator, /href="nen-anh\.html"/);
  assert.match(passwordGenerator, /href="dem-ky-tu\.html"/);
  assert.match(passwordGenerator, /href="assets\/styles\.css"/);
  assert.match(textToolbox, /href="nen-anh\.html"/);
  assert.match(textToolbox, /href="tao-mat-khau-ngau-nhien\.html"/);
  assert.match(textToolbox, /href="assets\/styles\.css"/);

  const styles = readViFile("assets/styles.css");
  assert.match(styles, /\.text-workspace/);
  assert.match(styles, /\.text-action-grid/);
});

test("robots and sitemap describe only the Vietnamese site", () => {
  const robots = readViFile("robots.txt");
  const sitemap = readViFile("sitemap.xml");

  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/vi\.freetools\.best\/sitemap\.xml/);
  assert.match(sitemap, /https:\/\/vi\.freetools\.best\/<\/loc>/);
  assert.match(sitemap, /https:\/\/vi\.freetools\.best\/nen-anh\.html<\/loc>/);
  assert.match(
    sitemap,
    /https:\/\/vi\.freetools\.best\/tao-mat-khau-ngau-nhien\.html<\/loc>/,
  );
  assert.match(sitemap, /https:\/\/vi\.freetools\.best\/dem-ky-tu\.html<\/loc>/);
  assert.equal((sitemap.match(/<url>/g) || []).length, 4);
  assert.doesNotMatch(sitemap, /br\.freetools\.best/);
});

test("all Vietnamese pages expose complete indexable metadata", () => {
  for (const page of [
    "index.html",
    "nen-anh.html",
    "tao-mat-khau-ngau-nhien.html",
    "dem-ky-tu.html",
  ]) {
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

test("all Vietnamese pages load Vercel Web Analytics like pr-tool", () => {
  for (const page of [
    "index.html",
    "nen-anh.html",
    "tao-mat-khau-ngau-nhien.html",
    "dem-ky-tu.html",
  ]) {
    const html = readViFile(page);
    assert.match(html, /window\.va = window\.va \|\| function/);
    assert.match(html, /script\.src = ['"]\/_vercel\/insights\/script\.js['"]/);
    assert.match(html, /script\.defer = true/);
  }
});

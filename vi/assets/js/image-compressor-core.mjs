export const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAX_FILE_BYTES = 30 * 1024 * 1024;

function requirePositiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(`${label} must be a positive number`);
  }
  return number;
}

export function parseTargetBytes(value, unit) {
  const number = requirePositiveNumber(value, "target");
  const normalizedUnit = String(unit).toUpperCase();
  const multiplier = normalizedUnit === "KB"
    ? 1024
    : normalizedUnit === "MB"
      ? 1024 * 1024
      : null;

  if (!multiplier) {
    throw new RangeError("unit must be KB or MB");
  }

  return Math.round(number * multiplier);
}

export function constrainDimensions(width, height, maxLongEdge) {
  const safeWidth = requirePositiveNumber(width, "width");
  const safeHeight = requirePositiveNumber(height, "height");
  const safeMaxLongEdge = requirePositiveNumber(maxLongEdge, "maxLongEdge");
  const longEdge = Math.max(safeWidth, safeHeight);

  if (longEdge <= safeMaxLongEdge) {
    return {
      width: Math.max(1, Math.round(safeWidth)),
      height: Math.max(1, Math.round(safeHeight)),
    };
  }

  const scale = safeMaxLongEdge / longEdge;
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  };
}

export function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  const scaled = value / (1024 ** unitIndex);
  const decimals = scaled >= 10 || unitIndex === 0 ? 0 : 1;
  return `${Number(scaled.toFixed(decimals))} ${units[unitIndex]}`;
}

export function savingsPercent(beforeBytes, afterBytes) {
  const before = Number(beforeBytes);
  const after = Number(afterBytes);
  if (!Number.isFinite(before) || before <= 0 || !Number.isFinite(after)) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - (after / before)) * 100)));
}

export function validateFileMetadata(file) {
  if (!file) return { valid: false, code: "missing_file" };
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return { valid: false, code: "unsupported_type" };
  }

  const size = Number(file.size);
  if (!Number.isFinite(size) || size <= 0) {
    return { valid: false, code: "empty_file" };
  }
  if (size > MAX_FILE_BYTES) {
    return { valid: false, code: "file_too_large" };
  }
  return { valid: true, code: "ok" };
}

function validateEncodedBlob(blob) {
  if (!blob || !Number.isFinite(Number(blob.size)) || Number(blob.size) < 0) {
    throw new TypeError("encoder must return a valid Blob-like value");
  }
  return blob;
}

export async function searchQuality(encode, targetBytes, options = {}) {
  if (typeof encode !== "function") {
    throw new TypeError("encode must be a function");
  }
  const target = requirePositiveNumber(targetBytes, "targetBytes");
  const minQuality = Number(options.minQuality ?? 0.35);
  const maxQuality = Number(options.maxQuality ?? 0.92);
  const iterations = Math.max(1, Math.min(12, Math.trunc(options.iterations ?? 7)));

  if (
    !Number.isFinite(minQuality)
    || !Number.isFinite(maxQuality)
    || minQuality <= 0
    || maxQuality > 1
    || minQuality > maxQuality
  ) {
    throw new RangeError("quality bounds must satisfy 0 < min <= max <= 1");
  }

  let attempts = 0;
  const encodeAt = async quality => {
    attempts += 1;
    return validateEncodedBlob(await encode(quality));
  };

  const minimumBlob = await encodeAt(minQuality);
  if (minimumBlob.size > target) {
    return {
      blob: minimumBlob,
      quality: minQuality,
      metTarget: false,
      attempts,
    };
  }

  if (minQuality === maxQuality) {
    return {
      blob: minimumBlob,
      quality: minQuality,
      metTarget: true,
      attempts,
    };
  }

  const maximumBlob = await encodeAt(maxQuality);
  if (maximumBlob.size <= target) {
    return {
      blob: maximumBlob,
      quality: maxQuality,
      metTarget: true,
      attempts,
    };
  }

  let low = minQuality;
  let high = maxQuality;
  let bestBlob = minimumBlob;
  let bestQuality = minQuality;

  for (let index = 0; index < iterations; index += 1) {
    const quality = (low + high) / 2;
    const blob = await encodeAt(quality);
    if (blob.size <= target) {
      bestBlob = blob;
      bestQuality = quality;
      low = quality;
    } else {
      high = quality;
    }
  }

  return {
    blob: bestBlob,
    quality: bestQuality,
    metTarget: true,
    attempts,
  };
}

export function nextDimensions(
  width,
  height,
  actualBytes,
  targetBytes,
  minimumLongEdge = 320,
) {
  const safeWidth = requirePositiveNumber(width, "width");
  const safeHeight = requirePositiveNumber(height, "height");
  const actual = requirePositiveNumber(actualBytes, "actualBytes");
  const target = requirePositiveNumber(targetBytes, "targetBytes");
  const minimum = requirePositiveNumber(minimumLongEdge, "minimumLongEdge");

  if (actual <= target) {
    return { width: Math.round(safeWidth), height: Math.round(safeHeight) };
  }

  const longEdge = Math.max(safeWidth, safeHeight);
  if (longEdge <= minimum) {
    return { width: Math.round(safeWidth), height: Math.round(safeHeight) };
  }

  let scale = Math.sqrt(target / actual) * 0.92;
  scale = Math.max(0.5, Math.min(0.9, scale));
  if (longEdge * scale < minimum) {
    scale = minimum / longEdge;
  }

  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  };
}

export function supportsQualitySearch(mime) {
  return mime === "image/jpeg" || mime === "image/webp";
}

export function extensionForMime(mime) {
  const extension = {
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/png": "png",
  }[mime];
  if (!extension) throw new RangeError("unsupported output MIME type");
  return extension;
}

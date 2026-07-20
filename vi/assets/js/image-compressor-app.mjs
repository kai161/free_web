import {
  constrainDimensions,
  extensionForMime,
  formatBytes,
  nextDimensions,
  parseTargetBytes,
  savingsPercent,
  searchQuality,
  supportsQualitySearch,
  validateFileMetadata,
} from "./image-compressor-core.mjs";

const MAX_INPUT_PIXELS = 60_000_000;
const MIN_TARGET_BYTES = 10 * 1024;
const MAX_TARGET_BYTES = 30 * 1024 * 1024;
const MAX_DIMENSION_PASSES = 6;

const elements = {
  fileInput: document.getElementById("fileInput"),
  dropZone: document.getElementById("dropZone"),
  fileName: document.getElementById("fileName"),
  targetPreset: document.getElementById("targetPreset"),
  customTargetGroup: document.getElementById("customTargetGroup"),
  customTarget: document.getElementById("customTarget"),
  targetUnit: document.getElementById("targetUnit"),
  outputFormat: document.getElementById("outputFormat"),
  formatHint: document.getElementById("formatHint"),
  compressButton: document.getElementById("compressButton"),
  statusRegion: document.getElementById("statusRegion"),
  previewImage: document.getElementById("previewImage"),
  previewPlaceholder: document.getElementById("previewPlaceholder"),
  originalSize: document.getElementById("originalSize"),
  compressedSize: document.getElementById("compressedSize"),
  savedPercent: document.getElementById("savedPercent"),
  outputDimensions: document.getElementById("outputDimensions"),
  downloadButton: document.getElementById("downloadButton"),
};

const state = {
  file: null,
  sourceUrl: null,
  outputUrl: null,
  revision: 0,
  busy: false,
};

const errorMessages = {
  missing_file: "Vui lòng chọn một ảnh.",
  unsupported_type: "Định dạng không được hỗ trợ. Hãy chọn JPG, PNG hoặc WebP.",
  empty_file: "Tệp ảnh trống hoặc không đọc được.",
  file_too_large: "Ảnh lớn hơn 30MB. Vui lòng chọn tệp nhỏ hơn.",
};

function setStatus(message, status = "idle") {
  elements.statusRegion.textContent = message;
  elements.statusRegion.dataset.state = status;
}

function releaseObjectUrl(key) {
  const url = state[key];
  if (url) {
    URL.revokeObjectURL(url);
    state[key] = null;
  }
}

function resetResult(message = "Ảnh đã sẵn sàng. Chọn dung lượng và bắt đầu nén.") {
  releaseObjectUrl("outputUrl");
  if (state.sourceUrl) setPreview(state.sourceUrl, `Xem trước ${state.file?.name || "ảnh"}`);
  elements.downloadButton.classList.add("hidden");
  elements.downloadButton.removeAttribute("href");
  elements.compressedSize.textContent = "—";
  elements.savedPercent.textContent = "—";
  elements.outputDimensions.textContent = "—";
  if (state.file) setStatus(message);
}

function setBusy(busy) {
  state.busy = busy;
  elements.fileInput.disabled = busy;
  elements.targetPreset.disabled = busy;
  const customTargetActive = elements.targetPreset.value === "custom";
  elements.customTarget.disabled = busy || !customTargetActive;
  elements.targetUnit.disabled = busy || !customTargetActive;
  elements.outputFormat.disabled = busy;
  elements.compressButton.disabled = busy || !state.file;
  elements.compressButton.textContent = busy ? "Đang nén…" : "Nén ảnh";
}

function syncTargetControls() {
  const custom = elements.targetPreset.value === "custom";
  elements.customTargetGroup.classList.toggle("is-visible", custom);
  elements.customTarget.disabled = state.busy || !custom;
  elements.targetUnit.disabled = state.busy || !custom;
}

function syncFormatHint() {
  const hints = {
    "image/webp": "WebP thường cho tệp nhỏ với chất lượng tốt.",
    "image/jpeg": "JPG tương thích rộng nhưng không giữ vùng trong suốt.",
    "image/png": "PNG giữ vùng trong suốt; công cụ có thể phải giảm kích thước để đạt mục tiêu.",
  };
  elements.formatHint.textContent = hints[elements.outputFormat.value];
}

function getTargetBytes() {
  let target;
  if (elements.targetPreset.value === "1mb") {
    target = parseTargetBytes(1, "MB");
  } else if (elements.targetPreset.value === "2mb") {
    target = parseTargetBytes(2, "MB");
  } else {
    target = parseTargetBytes(elements.customTarget.value, elements.targetUnit.value);
  }

  if (target < MIN_TARGET_BYTES || target > MAX_TARGET_BYTES) {
    throw new RangeError("target_out_of_range");
  }
  return target;
}

function maxWorkingLongEdge() {
  const memory = Number(navigator.deviceMemory || 0);
  const modestDevice = window.innerWidth <= 560 || (memory > 0 && memory <= 4);
  return modestDevice ? 2800 : 4096;
}

async function decodeImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Some browsers reject valid images in createImageBitmap; use Image as fallback.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("image_decode_failed"));
      image.src = objectUrl;
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => {},
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function drawToCanvas(decoded, width, height, mime) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: mime !== "image/jpeg" });
  if (!context) throw new Error("canvas_context_unavailable");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  if (mime === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  } else {
    context.clearRect(0, 0, width, height);
  }
  context.drawImage(decoded.source, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error("image_encode_failed")),
      mime,
      quality,
    );
  });
}

async function compressToTarget(decoded, targetBytes, mime) {
  let dimensions = constrainDimensions(
    decoded.width,
    decoded.height,
    maxWorkingLongEdge(),
  );
  let smallestResult = null;
  let totalAttempts = 0;

  for (let pass = 0; pass < MAX_DIMENSION_PASSES; pass += 1) {
    const canvas = drawToCanvas(decoded, dimensions.width, dimensions.height, mime);
    let qualityResult;

    if (supportsQualitySearch(mime)) {
      qualityResult = await searchQuality(
        quality => canvasToBlob(canvas, mime, quality),
        targetBytes,
        { minQuality: 0.35, maxQuality: 0.92, iterations: 7 },
      );
    } else {
      const blob = await canvasToBlob(canvas, mime);
      qualityResult = {
        blob,
        quality: null,
        metTarget: blob.size <= targetBytes,
        attempts: 1,
      };
    }

    totalAttempts += qualityResult.attempts;
    const candidate = {
      ...qualityResult,
      width: dimensions.width,
      height: dimensions.height,
      attempts: totalAttempts,
    };
    if (!smallestResult || candidate.blob.size < smallestResult.blob.size) {
      smallestResult = candidate;
    }
    if (candidate.metTarget) return candidate;

    const reduced = nextDimensions(
      dimensions.width,
      dimensions.height,
      candidate.blob.size,
      targetBytes,
    );
    if (reduced.width === dimensions.width && reduced.height === dimensions.height) break;
    dimensions = reduced;
  }

  return { ...smallestResult, metTarget: smallestResult.blob.size <= targetBytes };
}

function safeDownloadName(fileName, mime) {
  const base = String(fileName || "anh")
    .replace(/\.[^.]+$/, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .trim() || "anh";
  return `${base}-nen.${extensionForMime(mime)}`;
}

function setPreview(url, alt) {
  elements.previewImage.src = url;
  elements.previewImage.alt = alt;
  elements.previewImage.classList.remove("hidden");
  elements.previewPlaceholder.classList.add("hidden");
}

function showSelectedFile(file) {
  releaseObjectUrl("sourceUrl");
  state.sourceUrl = URL.createObjectURL(file);
  setPreview(state.sourceUrl, `Xem trước ${file.name}`);
  elements.fileName.textContent = file.name;
  elements.originalSize.textContent = formatBytes(file.size);
}

function handleSelectedFile(file) {
  state.revision += 1;
  const validation = validateFileMetadata(file);
  if (!validation.valid) {
    releaseObjectUrl("sourceUrl");
    resetResult();
    state.file = null;
    elements.fileInput.value = "";
    elements.fileName.textContent = "Chưa chọn ảnh";
    elements.originalSize.textContent = "—";
    elements.previewImage.removeAttribute("src");
    elements.previewImage.classList.add("hidden");
    elements.previewPlaceholder.classList.remove("hidden");
    elements.compressButton.disabled = true;
    setStatus(errorMessages[validation.code] || "Không thể đọc tệp ảnh.", "error");
    return;
  }

  state.file = file;
  showSelectedFile(file);
  resetResult();
  setBusy(false);
}

function setOutput(result, targetBytes, mime) {
  releaseObjectUrl("outputUrl");
  state.outputUrl = URL.createObjectURL(result.blob);
  setPreview(state.outputUrl, "Ảnh sau khi nén");
  elements.compressedSize.textContent = formatBytes(result.blob.size);
  elements.savedPercent.textContent = `${savingsPercent(state.file.size, result.blob.size)}%`;
  elements.outputDimensions.textContent = `${result.width} × ${result.height}`;
  elements.downloadButton.href = state.outputUrl;
  elements.downloadButton.download = safeDownloadName(state.file.name, mime);
  elements.downloadButton.classList.remove("hidden");

  if (result.metTarget) {
    setStatus(
      `Đã nén xuống ${formatBytes(result.blob.size)}, dưới mục tiêu ${formatBytes(targetBytes)}.`,
      "success",
    );
  } else {
    setStatus(
      `Không thể đạt ${formatBytes(targetBytes)} mà không giảm ảnh quá nhỏ. Kết quả nhỏ nhất là ${formatBytes(result.blob.size)}.`,
      "error",
    );
  }
}

async function runCompression() {
  if (!state.file || state.busy) return;

  let targetBytes;
  try {
    targetBytes = getTargetBytes();
  } catch {
    setStatus("Dung lượng tùy chọn phải từ 10KB đến 30MB.", "error");
    return;
  }

  const mime = elements.outputFormat.value;
  const jobRevision = ++state.revision;
  setBusy(true);
  resetResult("Đang chuẩn bị ảnh…");
  setStatus("Đang đọc và nén ảnh trên thiết bị của bạn…", "working");
  let decoded;

  try {
    decoded = await decodeImage(state.file);
    if (decoded.width * decoded.height > MAX_INPUT_PIXELS) {
      throw new Error("image_dimensions_too_large");
    }

    let result;
    if (state.file.type === mime && state.file.size <= targetBytes) {
      result = {
        blob: state.file,
        quality: null,
        metTarget: true,
        attempts: 0,
        width: decoded.width,
        height: decoded.height,
      };
    } else {
      result = await compressToTarget(decoded, targetBytes, mime);
    }

    if (jobRevision !== state.revision) return;
    setOutput(result, targetBytes, mime);
  } catch (error) {
    if (jobRevision !== state.revision) return;
    const message = error?.message === "image_dimensions_too_large"
      ? "Ảnh có độ phân giải quá lớn. Vui lòng chọn ảnh dưới 60 megapixel."
      : "Không thể nén ảnh này. Hãy thử một tệp JPG, PNG hoặc WebP khác.";
    setStatus(message, "error");
  } finally {
    decoded?.close?.();
    if (jobRevision === state.revision) setBusy(false);
  }
}

elements.fileInput.addEventListener("change", event => {
  handleSelectedFile(event.target.files?.[0]);
});

for (const eventName of ["dragenter", "dragover"]) {
  elements.dropZone.addEventListener(eventName, event => {
    event.preventDefault();
    if (!state.busy) elements.dropZone.classList.add("is-dragging");
  });
}

for (const eventName of ["dragleave", "drop"]) {
  elements.dropZone.addEventListener(eventName, event => {
    event.preventDefault();
    elements.dropZone.classList.remove("is-dragging");
  });
}

elements.dropZone.addEventListener("drop", event => {
  if (!state.busy) handleSelectedFile(event.dataTransfer?.files?.[0]);
});

elements.targetPreset.addEventListener("change", () => {
  state.revision += 1;
  syncTargetControls();
  resetResult("Mục tiêu đã thay đổi. Nhấn “Nén ảnh” để tạo kết quả mới.");
});

for (const element of [elements.customTarget, elements.targetUnit]) {
  element.addEventListener("input", () => {
    state.revision += 1;
    resetResult("Mục tiêu đã thay đổi. Nhấn “Nén ảnh” để tạo kết quả mới.");
  });
}

elements.outputFormat.addEventListener("change", () => {
  state.revision += 1;
  syncFormatHint();
  resetResult("Định dạng đã thay đổi. Nhấn “Nén ảnh” để tạo kết quả mới.");
});

elements.compressButton.addEventListener("click", runCompression);

window.addEventListener("pagehide", () => {
  releaseObjectUrl("sourceUrl");
  releaseObjectUrl("outputUrl");
});

syncTargetControls();
syncFormatHint();
setBusy(false);

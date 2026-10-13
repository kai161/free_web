import { createCompressionRun } from "./analytics-core.mjs";
import { emitCompressorEvent } from "./analytics.mjs";
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
  previewOriginal: document.getElementById("previewOriginal"),
  previewOutput: document.getElementById("previewOutput"),
  openPreview: document.getElementById("openPreview"),
  resultDetails: document.getElementById("resultDetails"),
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
  analyticsRun: null,
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
  state.analyticsRun?.cancel();
  state.analyticsRun = null;
  releaseObjectUrl("outputUrl");
  elements.previewOriginal.disabled = !state.sourceUrl;
  elements.previewOutput.disabled = true;
  elements.resultDetails.textContent = "";
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
  elements.customTarget.min = elements.targetUnit.value === "MB" ? String(10 / 1024) : "10";
  elements.customTarget.max = elements.targetUnit.value === "MB" ? "30" : "30720";
}

function syncFormatHint() {
  const hints = {
    "image/webp": "WebP thường cho tệp nhỏ với chất lượng tốt.",
    "image/jpeg": "JPG tương thích rộng; vùng trong suốt được thay bằng nền trắng.",
    "image/png": "PNG giữ vùng trong suốt; công cụ có thể phải giảm kích thước để đạt mục tiêu.",
  };
  elements.formatHint.textContent = hints[elements.outputFormat.value];
}

function getTargetBytes() {
  let target;
  if (elements.targetPreset.value === "100kb") {
    target = parseTargetBytes(100, "KB");
  } else if (elements.targetPreset.value === "200kb") {
    target = parseTargetBytes(200, "KB");
  } else if (elements.targetPreset.value === "1mb") {
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
      blob => {
        if (!blob || blob.size === 0) reject(new Error("image_encode_failed"));
        else if (blob.type !== mime) reject(new Error("output_format_unsupported"));
        else resolve(blob);
      },
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
  const original = url === state.sourceUrl;
  elements.previewOriginal.setAttribute("aria-pressed", String(original));
  elements.previewOutput.setAttribute("aria-pressed", String(!original));
  elements.openPreview.href = url;
  elements.openPreview.textContent = original ? "Mở ảnh gốc để phóng to ↗" : "Mở ảnh sau nén để phóng to ↗";
  elements.openPreview.classList.remove("hidden");
}

function exactBytes(bytes) {
  return `${formatBytes(bytes)} (${bytes.toLocaleString("vi-VN")} byte)`;
}

function showSelectedFile(file) {
  releaseObjectUrl("sourceUrl");
  state.sourceUrl = URL.createObjectURL(file);
  setPreview(state.sourceUrl, `Xem trước ${file.name}`);
  elements.fileName.textContent = file.name;
  elements.originalSize.textContent = exactBytes(file.size);
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
    elements.openPreview.classList.add("hidden");
    elements.openPreview.removeAttribute("href");
    elements.compressButton.disabled = true;
    setStatus(errorMessages[validation.code] || "Không thể đọc tệp ảnh.", "error");
    return;
  }

  state.file = file;
  showSelectedFile(file);
  resetResult();
  setBusy(false);
}

function setOutput(result, targetBytes, mime, decoded) {
  releaseObjectUrl("outputUrl");
  state.outputUrl = URL.createObjectURL(result.blob);
  setPreview(state.outputUrl, "Ảnh sau khi nén");
  elements.previewOutput.disabled = false;
  elements.compressedSize.textContent = exactBytes(result.blob.size);
  elements.savedPercent.textContent = `${savingsPercent(state.file.size, result.blob.size)}%`;
  elements.outputDimensions.textContent = `${result.width} × ${result.height}`;
  elements.downloadButton.href = state.outputUrl;
  elements.downloadButton.download = safeDownloadName(state.file.name, mime);
  elements.downloadButton.classList.remove("hidden");
  elements.downloadButton.textContent = result.metTarget ? "Tải ảnh kết quả" : "Tải ảnh kết quả (chưa đạt mục tiêu)";
  const notes = [`Ảnh gốc: ${decoded.width} × ${decoded.height} px. Kết quả: ${result.width} × ${result.height} px.`];
  if (result.width !== decoded.width || result.height !== decoded.height) {
    notes.push("Đã giảm kích thước để tiết kiệm bộ nhớ hoặc tiến gần mục tiêu; chữ và chi tiết nhỏ có thể kém rõ. Hãy so sánh trước khi dùng.");
  }
  if (result.blob === state.file) notes.push("Ảnh gốc đã đạt mục tiêu và đúng định dạng; giữ nguyên tệp, không mã hóa lại.");
  if (result.blob.size > state.file.size) notes.push("Tệp kết quả lớn hơn ảnh gốc. Hãy thử JPG/WebP hoặc giữ bản gốc nếu phù hợp.");
  if (mime === "image/jpeg" && result.blob !== state.file) notes.push("JPG dùng nền trắng ở vùng trong suốt.");
  notes.push("Bản gốc trên thiết bị không bị thay đổi.");
  elements.resultDetails.textContent = notes.join(" ");

  if (result.metTarget) {
    setStatus(
      `Đạt mục tiêu: ${exactBytes(result.blob.size)} ≤ ${exactBytes(targetBytes)}.`,
      "success",
    );
  } else {
    setStatus(
      `Chưa đạt mục tiêu ${exactBytes(targetBytes)}. Kết quả nhỏ nhất đã thử: ${exactBytes(result.blob.size)}. Hãy tăng mục tiêu hoặc thử JPG/WebP nếu nơi nhận cho phép.`,
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
  const analyticsRun = createCompressionRun(emitCompressorEvent, { target: elements.targetPreset.value, format: mime });
  state.analyticsRun = analyticsRun;
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
    setOutput(result, targetBytes, mime, decoded);
    analyticsRun.complete(result.metTarget);
  } catch (error) {
    if (jobRevision !== state.revision) return;
    analyticsRun.fail(error?.message === "image_dimensions_too_large" ? "dimensions"
      : error?.message === "output_format_unsupported" ? "unsupported_output" : "processing");
    const message = error?.message === "image_dimensions_too_large"
      ? "Ảnh có độ phân giải quá lớn. Vui lòng chọn ảnh dưới 60 megapixel."
      : error?.message === "output_format_unsupported"
        ? "Trình duyệt này không hỗ trợ xuất định dạng đã chọn. Hãy thử JPG hoặc PNG."
        : "Không thể đọc hoặc nén ảnh này. Tệp có thể bị hỏng. Hãy thử một tệp JPG, PNG hoặc WebP khác.";
    setStatus(message, "error");
  } finally {
    decoded?.close?.();
    if (jobRevision === state.revision) setBusy(false);
  }
}

elements.fileInput.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (file) handleSelectedFile(file);
  event.target.value = "";
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
    syncTargetControls();
    resetResult("Mục tiêu đã thay đổi. Nhấn “Nén ảnh” để tạo kết quả mới.");
  });
}

elements.outputFormat.addEventListener("change", () => {
  state.revision += 1;
  syncFormatHint();
  resetResult("Định dạng đã thay đổi. Nhấn “Nén ảnh” để tạo kết quả mới.");
});

elements.compressButton.addEventListener("click", runCompression);

// One request per generated result, not proof that the browser saved a file.
elements.downloadButton.addEventListener("click", () => {
  if (!state.busy && state.outputUrl) state.analyticsRun?.download();
});

elements.previewOriginal.addEventListener("click", () => {
  if (state.sourceUrl) setPreview(state.sourceUrl, "Ảnh gốc — không thay đổi");
});
elements.previewOutput.addEventListener("click", () => {
  if (state.outputUrl) setPreview(state.outputUrl, "Ảnh sau khi nén");
});

window.addEventListener("pagehide", event => {
  if (event.persisted) return;
  state.revision += 1;
  state.analyticsRun?.cancel();
  releaseObjectUrl("sourceUrl");
  releaseObjectUrl("outputUrl");
});

syncTargetControls();
syncFormatHint();
setBusy(false);

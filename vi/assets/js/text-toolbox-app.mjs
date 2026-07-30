import {
  analyzeText,
  normalizeSpaces,
  removeBlankLines,
  removeDuplicateLines,
  sortLines,
  toLowercase,
  toTitleCase,
  toUppercase,
} from "./text-toolbox-core.mjs";

const sourceText = document.getElementById("sourceText");
const resultText = document.getElementById("resultText");
const charactersWithSpaces = document.getElementById("charactersWithSpaces");
const charactersWithoutSpaces = document.getElementById("charactersWithoutSpaces");
const wordCount = document.getElementById("wordCount");
const sentenceCount = document.getElementById("sentenceCount");
const lineCount = document.getElementById("lineCount");
const byteCount = document.getElementById("byteCount");
const readingTime = document.getElementById("readingTime");
const uppercaseButton = document.getElementById("uppercaseButton");
const lowercaseButton = document.getElementById("lowercaseButton");
const titleCaseButton = document.getElementById("titleCaseButton");
const normalizeSpacesButton = document.getElementById("normalizeSpacesButton");
const removeBlankLinesButton = document.getElementById("removeBlankLinesButton");
const removeDuplicateLinesButton = document.getElementById("removeDuplicateLinesButton");
const sortLinesButton = document.getElementById("sortLinesButton");
const copyResultButton = document.getElementById("copyResultButton");
const downloadResultButton = document.getElementById("downloadResultButton");
const clearResultButton = document.getElementById("clearResultButton");
const textToolStatus = document.getElementById("textToolStatus");

function setStatus(message, state = "idle") {
  textToolStatus.textContent = message;
  textToolStatus.dataset.state = state;
}

function renderStatistics() {
  const statistics = analyzeText(sourceText.value);

  charactersWithSpaces.textContent = String(statistics.characters);
  charactersWithoutSpaces.textContent = String(statistics.charactersNoWhitespace);
  wordCount.textContent = String(statistics.words);
  sentenceCount.textContent = String(statistics.sentences);
  lineCount.textContent = String(statistics.lines);
  byteCount.textContent = String(statistics.bytes);
  readingTime.textContent = `${statistics.readingMinutes} phút`;
}

function setResultControlsEnabled(enabled) {
  copyResultButton.disabled = !enabled;
  downloadResultButton.disabled = !enabled;
  clearResultButton.disabled = !enabled;
}

function renderResult(result, actionLabel) {
  resultText.value = result;
  const hasResult = result.length > 0;

  setResultControlsEnabled(hasResult);
  setStatus(
    hasResult
      ? `Đã tạo kết quả: ${actionLabel}. Văn bản gốc vẫn được giữ nguyên.`
      : "Không có nội dung để xử lý.",
    hasResult ? "success" : "idle",
  );
}

function applyTransform(transform, actionLabel) {
  renderResult(transform(sourceText.value), actionLabel);
}

async function copyText(text) {
  if (!text) {
    throw new Error("empty_result");
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Clipboard access may be blocked outside HTTPS; use a local DOM fallback.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("copy_failed");
  }
}

async function copyResult() {
  try {
    await copyText(resultText.value);
    setStatus("Đã sao chép kết quả.", "success");
  } catch {
    setStatus("Không thể sao chép tự động. Hãy chọn và sao chép thủ công.", "error");
  }
}

function downloadResult() {
  if (!resultText.value) {
    setStatus("Không có kết quả để tải xuống.", "error");
    return;
  }

  const blob = new Blob([resultText.value], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "van-ban-da-xu-ly.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus("Đã tạo tệp văn bản để tải xuống.", "success");
}

function clearResult() {
  resultText.value = "";
  setResultControlsEnabled(false);
  setStatus("Đã xóa kết quả. Văn bản gốc vẫn được giữ nguyên.", "idle");
}

sourceText.addEventListener("input", renderStatistics);
uppercaseButton.addEventListener("click", () =>
  applyTransform(toUppercase, "chuyển thành chữ hoa"),
);
lowercaseButton.addEventListener("click", () =>
  applyTransform(toLowercase, "chuyển thành chữ thường"),
);
titleCaseButton.addEventListener("click", () =>
  applyTransform(toTitleCase, "viết hoa tiêu đề"),
);
normalizeSpacesButton.addEventListener("click", () =>
  applyTransform(normalizeSpaces, "chuẩn hóa khoảng trắng"),
);
removeBlankLinesButton.addEventListener("click", () =>
  applyTransform(removeBlankLines, "xóa dòng trống"),
);
removeDuplicateLinesButton.addEventListener("click", () =>
  applyTransform(removeDuplicateLines, "xóa dòng trùng lặp"),
);
sortLinesButton.addEventListener("click", () =>
  applyTransform(sortLines, "sắp xếp dòng"),
);
copyResultButton.addEventListener("click", copyResult);
downloadResultButton.addEventListener("click", downloadResult);
clearResultButton.addEventListener("click", clearResult);

renderStatistics();
setResultControlsEnabled(false);

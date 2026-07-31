import {
  formatJson,
  inspectJson,
  minifyJson,
  validateJsonFileMetadata,
} from "./json-formatter-core.mjs";

const sourceJson = document.getElementById("sourceJson");
const jsonFileInput = document.getElementById("jsonFileInput");
const jsonValidationStatus = document.getElementById("jsonValidationStatus");
const jsonRootType = document.getElementById("jsonRootType");
const jsonNodeCount = document.getElementById("jsonNodeCount");
const formatTwoButton = document.getElementById("formatTwoButton");
const formatFourButton = document.getElementById("formatFourButton");
const minifyJsonButton = document.getElementById("minifyJsonButton");
const resultJson = document.getElementById("resultJson");
const copyJsonButton = document.getElementById("copyJsonButton");
const downloadJsonButton = document.getElementById("downloadJsonButton");
const clearJsonResultButton = document.getElementById("clearJsonResultButton");
const jsonToolStatus = document.getElementById("jsonToolStatus");

const ROOT_TYPE_LABELS = {
  object: "Đối tượng",
  array: "Mảng",
  string: "Chuỗi",
  number: "Số",
  boolean: "Đúng / sai",
  null: "Null",
};

const FILE_ERROR_MESSAGES = {
  missing_file: "Hãy chọn một tệp JSON.",
  unsupported_type: "Chỉ chấp nhận tệp có phần mở rộng .json.",
  empty_file: "Tệp JSON đang trống.",
  file_too_large: "Tệp JSON không được vượt quá 5 MB.",
};

function setToolStatus(message, state = "idle") {
  jsonToolStatus.textContent = message;
  jsonToolStatus.dataset.state = state;
}

function setValidationStatus(message, state = "idle") {
  jsonValidationStatus.textContent = message;
  jsonValidationStatus.dataset.state = state;
}

function setResultControlsEnabled(enabled) {
  copyJsonButton.disabled = !enabled;
  downloadJsonButton.disabled = !enabled;
  clearJsonResultButton.disabled = !enabled;
}

function renderValidation() {
  const inspection = inspectJson(sourceJson.value);

  if (inspection.valid) {
    jsonRootType.textContent = ROOT_TYPE_LABELS[inspection.rootType] ?? inspection.rootType;
    jsonNodeCount.textContent = String(inspection.nodeCount);
    setValidationStatus("JSON hợp lệ và sẵn sàng xử lý.", "success");
    return inspection;
  }

  jsonRootType.textContent = "—";
  jsonNodeCount.textContent = "0";
  setValidationStatus(
    inspection.error.message,
    inspection.error.code === "json_empty" ? "idle" : "error",
  );
  return inspection;
}

function renderResult(value, actionLabel) {
  resultJson.value = value;
  setResultControlsEnabled(value.length > 0);
  setToolStatus(
    `Đã ${actionLabel}. JSON gốc vẫn được giữ nguyên.`,
    "success",
  );
}

function applyJsonTransform(transform, actionLabel) {
  const inspection = renderValidation();

  if (!inspection.valid) {
    setToolStatus("Không thể tạo kết quả cho đến khi JSON hợp lệ.", "error");
    return;
  }

  renderResult(transform(sourceJson.value), actionLabel);
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
      // Clipboard access can be blocked outside HTTPS; use a local fallback.
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
    await copyText(resultJson.value);
    setToolStatus("Đã sao chép kết quả JSON.", "success");
  } catch {
    setToolStatus("Không thể sao chép tự động. Hãy sao chép thủ công.", "error");
  }
}

function downloadResult() {
  if (!resultJson.value) {
    setToolStatus("Không có kết quả JSON để tải xuống.", "error");
    return;
  }

  const blob = new Blob([resultJson.value], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "ket-qua-json.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setToolStatus("Đã tạo tệp JSON để tải xuống.", "success");
}

function clearResult() {
  resultJson.value = "";
  setResultControlsEnabled(false);
  setToolStatus("Đã xóa kết quả. JSON gốc vẫn được giữ nguyên.", "idle");
}

function loadJsonFile(file) {
  const validation = validateJsonFileMetadata(file);

  if (!validation.valid) {
    setToolStatus(FILE_ERROR_MESSAGES[validation.code], "error");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    if (typeof reader.result !== "string") {
      setToolStatus("Không thể đọc tệp JSON này.", "error");
      return;
    }

    sourceJson.value = reader.result;
    renderValidation();
    setToolStatus(`Đã tải tệp ${file.name}.`, "success");
  };
  reader.onerror = () => {
    setToolStatus("Không thể đọc tệp JSON này.", "error");
  };
  reader.readAsText(file, "utf-8");
}

sourceJson.addEventListener("input", renderValidation);
jsonFileInput.addEventListener("change", () => {
  loadJsonFile(jsonFileInput.files?.[0] ?? null);
  jsonFileInput.value = "";
});
formatTwoButton.addEventListener("click", () =>
  applyJsonTransform(source => formatJson(source, 2), "định dạng với 2 khoảng trắng"),
);
formatFourButton.addEventListener("click", () =>
  applyJsonTransform(source => formatJson(source, 4), "định dạng với 4 khoảng trắng"),
);
minifyJsonButton.addEventListener("click", () =>
  applyJsonTransform(minifyJson, "thu gọn JSON"),
);
copyJsonButton.addEventListener("click", copyResult);
downloadJsonButton.addEventListener("click", downloadResult);
clearJsonResultButton.addEventListener("click", clearResult);

renderValidation();
setResultControlsEnabled(false);

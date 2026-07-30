import {
  buildCharacterSets,
  estimateEntropy,
  generatePassword,
  strengthFromEntropy,
} from "./password-generator-core.mjs";

const passwordOutput = document.getElementById("passwordOutput");
const passwordLength = document.getElementById("passwordLength");
const passwordLengthValue = document.getElementById("passwordLengthValue");
const includeUpper = document.getElementById("includeUpper");
const includeLower = document.getElementById("includeLower");
const includeNumbers = document.getElementById("includeNumbers");
const includeSymbols = document.getElementById("includeSymbols");
const excludeAmbiguous = document.getElementById("excludeAmbiguous");
const generateButton = document.getElementById("generateButton");
const copyButton = document.getElementById("copyButton");
const generateBatchButton = document.getElementById("generateBatchButton");
const batchResults = document.getElementById("batchResults");
const strengthLabel = document.getElementById("strengthLabel");
const entropyValue = document.getElementById("entropyValue");
const passwordStatus = document.getElementById("passwordStatus");

function readOptions() {
  return {
    length: Number(passwordLength.value),
    upper: includeUpper.checked,
    lower: includeLower.checked,
    numbers: includeNumbers.checked,
    symbols: includeSymbols.checked,
    excludeAmbiguous: excludeAmbiguous.checked,
  };
}

function setStatus(message, state = "idle") {
  passwordStatus.textContent = message;
  passwordStatus.dataset.state = state;
}

function describeError(error) {
  if (error?.message === "character_group_required") {
    return "Hãy chọn ít nhất một loại ký tự.";
  }

  if (error?.message === "secure_random_unavailable") {
    return "Trình duyệt này không hỗ trợ bộ tạo số ngẫu nhiên an toàn. Vui lòng dùng trình duyệt mới hơn.";
  }

  return "Không thể tạo mật khẩu với cài đặt hiện tại.";
}

function calculateMetrics(options) {
  const poolSize = buildCharacterSets(options).join("").length;
  const entropy = estimateEntropy(options.length, poolSize);

  return {
    entropy,
    strength: strengthFromEntropy(entropy),
  };
}

function renderPassword(password, options) {
  const { entropy, strength } = calculateMetrics(options);

  passwordOutput.value = password;
  entropyValue.textContent = String(entropy);
  strengthLabel.textContent = strength.label;
  strengthLabel.dataset.level = strength.level;
  setStatus("Đã tạo mật khẩu an toàn ngay trên thiết bị của bạn.", "success");
}

function createPassword() {
  const options = readOptions();
  const password = generatePassword(options);

  renderPassword(password, options);
  return password;
}

function generateCurrentPassword() {
  try {
    createPassword();
  } catch (error) {
    setStatus(describeError(error), "error");
  }
}

async function copyText(text) {
  if (!text) {
    throw new Error("empty_password");
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Clipboard access can be blocked outside HTTPS; use the local DOM fallback.
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

async function copyCurrentPassword() {
  try {
    await copyText(passwordOutput.value);
    setStatus("Đã sao chép mật khẩu.", "success");
  } catch {
    setStatus("Không thể sao chép tự động. Hãy chọn và sao chép mật khẩu thủ công.", "error");
  }
}

function createBatchItem(password, index) {
  const item = document.createElement("li");
  const value = document.createElement("code");
  const button = document.createElement("button");

  value.textContent = password;
  button.className = "batch-copy-button";
  button.type = "button";
  button.dataset.password = password;
  button.textContent = "Sao chép";
  button.setAttribute("aria-label", `Sao chép mật khẩu số ${index + 1}`);
  item.append(value, button);

  return item;
}

function generatePasswordBatch() {
  try {
    const options = readOptions();
    const items = Array.from({ length: 5 }, (_, index) =>
      createBatchItem(generatePassword(options), index),
    );

    batchResults.replaceChildren(...items);
    setStatus("Đã tạo 5 mật khẩu theo cài đặt hiện tại.", "success");
  } catch (error) {
    setStatus(describeError(error), "error");
  }
}

async function copyBatchPassword(event) {
  const button = event.target.closest(".batch-copy-button");

  if (!button) {
    return;
  }

  try {
    await copyText(button.dataset.password);
    setStatus("Đã sao chép mật khẩu trong danh sách.", "success");
  } catch {
    setStatus("Không thể sao chép tự động. Hãy sao chép mật khẩu thủ công.", "error");
  }
}

passwordLength.addEventListener("input", () => {
  passwordLengthValue.textContent = `${passwordLength.value} ký tự`;
});
generateButton.addEventListener("click", generateCurrentPassword);
copyButton.addEventListener("click", copyCurrentPassword);
generateBatchButton.addEventListener("click", generatePasswordBatch);
batchResults.addEventListener("click", copyBatchPassword);

generateCurrentPassword();

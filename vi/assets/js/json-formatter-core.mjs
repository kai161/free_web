const ALLOWED_INDENTATIONS = new Set([2, 4]);
export const MAX_JSON_FILE_BYTES = 5 * 1024 * 1024;

function createSyntaxError(code) {
  const error = new SyntaxError(code);
  error.code = code;
  return error;
}

export function parseJson(source) {
  if (typeof source !== "string" || source.trim() === "") {
    throw createSyntaxError("json_empty");
  }

  return JSON.parse(source);
}

export function describeJsonType(value) {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  return typeof value;
}

export function countJsonNodes(value) {
  if (Array.isArray(value)) {
    return 1 + value.reduce((total, item) => total + countJsonNodes(item), 0);
  }

  if (value !== null && typeof value === "object") {
    return 1 + Object.values(value).reduce(
      (total, item) => total + countJsonNodes(item),
      0,
    );
  }

  return 1;
}

export function positionToLineColumn(source, position) {
  const safeSource = typeof source === "string" ? source : "";
  const safePosition = Math.min(
    Math.max(Number.isFinite(position) ? Math.trunc(position) : 0, 0),
    safeSource.length,
  );
  const beforePosition = safeSource.slice(0, safePosition);
  const lines = beforePosition.split("\n");

  return {
    line: lines.length,
    column: lines.at(-1).length + 1,
  };
}

export function describeParseError(source, error) {
  if (error?.code === "json_empty" || error?.message === "json_empty") {
    return {
      code: "json_empty",
      line: null,
      column: null,
      message: "Hãy nhập hoặc tải một nội dung JSON trước.",
    };
  }

  const rawMessage = typeof error?.message === "string" ? error.message : "";
  const lineColumnMatch = rawMessage.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  let location = null;

  if (lineColumnMatch) {
    location = {
      line: Number(lineColumnMatch[1]),
      column: Number(lineColumnMatch[2]),
    };
  } else {
    const positionMatch = rawMessage.match(/position\s+(\d+)/i);
    if (positionMatch) {
      location = positionToLineColumn(source, Number(positionMatch[1]));
    }
  }

  if (location) {
    return {
      code: "json_invalid",
      ...location,
      message: `JSON không hợp lệ tại dòng ${location.line}, cột ${location.column}.`,
    };
  }

  return {
    code: "json_invalid",
    line: null,
    column: null,
    message: "JSON không hợp lệ. Hãy kiểm tra dấu ngoặc, dấu phẩy và dấu ngoặc kép.",
  };
}

export function inspectJson(source) {
  try {
    const value = parseJson(source);

    return {
      valid: true,
      rootType: describeJsonType(value),
      nodeCount: countJsonNodes(value),
      error: null,
    };
  } catch (error) {
    return {
      valid: false,
      rootType: null,
      nodeCount: 0,
      error: describeParseError(source, error),
    };
  }
}

export function formatJson(source, indentation = 2) {
  if (!ALLOWED_INDENTATIONS.has(indentation)) {
    throw new RangeError("json_indentation_invalid");
  }

  return JSON.stringify(parseJson(source), null, indentation);
}

export function minifyJson(source) {
  return JSON.stringify(parseJson(source));
}

export function validateJsonFileMetadata(file) {
  if (!file) {
    return { valid: false, code: "missing_file" };
  }

  if (typeof file.name !== "string" || !file.name.toLocaleLowerCase("vi").endsWith(".json")) {
    return { valid: false, code: "unsupported_type" };
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { valid: false, code: "empty_file" };
  }

  if (file.size > MAX_JSON_FILE_BYTES) {
    return { valid: false, code: "file_too_large" };
  }

  return { valid: true, code: "ok" };
}

function toText(value) {
  return value == null ? "" : String(value);
}

function splitLines(value) {
  return toText(value).split(/\r\n?|\n/u);
}

export function analyzeText(value) {
  const text = toText(value);
  const codePoints = [...text];
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/u).length : 0;
  const sentenceParts = trimmed
    ? trimmed
        .split(/[.!?]+/u)
        .map(part => part.trim())
        .filter(Boolean)
    : [];

  return {
    characters: codePoints.length,
    charactersNoWhitespace: codePoints.filter(character => !/\s/u.test(character))
      .length,
    words,
    sentences: sentenceParts.length || (trimmed ? 1 : 0),
    lines: text.length === 0 ? 0 : text.split(/\r\n?|\n/u).length,
    bytes: new TextEncoder().encode(text).length,
    readingMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / 200)),
  };
}

export function toUppercase(value) {
  return toText(value).toLocaleUpperCase("vi");
}

export function toLowercase(value) {
  return toText(value).toLocaleLowerCase("vi");
}

export function toTitleCase(value) {
  return toLowercase(value)
    .split(/(\s+)/u)
    .map(part => {
      if (part === "" || /^\s+$/u.test(part)) {
        return part;
      }

      const [firstCharacter, ...remainingCharacters] = [...part];
      return `${firstCharacter.toLocaleUpperCase("vi")}${remainingCharacters.join("")}`;
    })
    .join("");
}

export function normalizeSpaces(value) {
  return splitLines(value)
    .map(line => line.trim().replace(/[^\S\r\n]+/gu, " "))
    .join("\n");
}

export function removeBlankLines(value) {
  return splitLines(value)
    .filter(line => line.trim() !== "")
    .join("\n");
}

export function removeDuplicateLines(value) {
  return [...new Set(splitLines(value))].join("\n");
}

export function sortLines(value) {
  return splitLines(value)
    .sort((left, right) => left.localeCompare(right, "vi"))
    .join("\n");
}

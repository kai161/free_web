export const CHARACTER_GROUPS = Object.freeze({
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%&*?+-_=.",
});

const AMBIGUOUS_CHARACTERS = new Set(["0", "O", "1", "l", "I"]);
const UINT32_RANGE = 0x1_0000_0000;

function fillWithCrypto(target) {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("secure_random_unavailable");
  }

  globalThis.crypto.getRandomValues(target);
}

export function buildCharacterSets(options = {}) {
  const excludeAmbiguous = options.excludeAmbiguous === true;

  return Object.entries(CHARACTER_GROUPS)
    .filter(([name]) => options[name] === true)
    .map(([, characters]) => {
      if (!excludeAmbiguous) {
        return characters;
      }

      return [...characters]
        .filter(character => !AMBIGUOUS_CHARACTERS.has(character))
        .join("");
    });
}

export function secureRandomIndex(max, fillRandom = fillWithCrypto) {
  if (!Number.isInteger(max) || max <= 0 || max > UINT32_RANGE) {
    throw new RangeError("max must be an integer between 1 and 2^32");
  }

  const rejectionLimit = Math.floor(UINT32_RANGE / max) * max;
  const randomValue = new Uint32Array(1);

  do {
    fillRandom(randomValue);
  } while (randomValue[0] >= rejectionLimit);

  return randomValue[0] % max;
}

function pickCharacter(characters, randomIndex) {
  const index = randomIndex(characters.length);

  if (!Number.isInteger(index) || index < 0 || index >= characters.length) {
    throw new RangeError("random index is outside the character pool");
  }

  return characters[index];
}

export function secureShuffle(items, randomIndex = secureRandomIndex) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);

    if (!Number.isInteger(swapIndex) || swapIndex < 0 || swapIndex > index) {
      throw new RangeError("random index is outside the shuffle range");
    }

    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function generatePassword(options = {}, randomIndex = secureRandomIndex) {
  const length = Number(options.length);

  if (!Number.isInteger(length) || length < 8 || length > 64) {
    throw new RangeError("password length must be an integer from 8 to 64");
  }

  const characterSets = buildCharacterSets(options);

  if (characterSets.length === 0) {
    throw new Error("character_group_required");
  }

  if (length < characterSets.length) {
    throw new RangeError("password length is shorter than the selected groups");
  }

  const pool = characterSets.join("");
  const passwordCharacters = characterSets.map(characters =>
    pickCharacter(characters, randomIndex),
  );

  while (passwordCharacters.length < length) {
    passwordCharacters.push(pickCharacter(pool, randomIndex));
  }

  return secureShuffle(passwordCharacters, randomIndex).join("");
}

export function estimateEntropy(length, poolSize) {
  if (!Number.isInteger(length) || length <= 0) {
    throw new RangeError("length must be a positive integer");
  }

  if (!Number.isInteger(poolSize) || poolSize < 2) {
    throw new RangeError("pool size must be an integer of at least 2");
  }

  return Math.round(length * Math.log2(poolSize));
}

export function strengthFromEntropy(bits) {
  if (!Number.isFinite(bits) || bits < 0) {
    throw new RangeError("entropy must be a non-negative number");
  }

  if (bits < 40) {
    return { level: "weak", label: "Yếu" };
  }

  if (bits < 60) {
    return { level: "medium", label: "Trung bình" };
  }

  if (bits < 80) {
    return { level: "strong", label: "Mạnh" };
  }

  return { level: "very-strong", label: "Rất mạnh" };
}

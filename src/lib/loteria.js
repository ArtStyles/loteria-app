export function normalizeNumber(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 99) {
    throw new Error('El numero debe estar entre 00 y 99.');
  }

  return String(number).padStart(2, '0');
}

export function getDrawDigits(numbers) {
  const present = [];

  numbers.map(normalizeNumber).forEach((number) => {
    number.split('').forEach((digit) => {
      if (!present.includes(digit)) {
        present.push(digit);
      }
    });
  });

  const missing = allDigits().filter((digit) => !present.includes(digit));
  return { present, missing };
}

export function buildNormalCombinations(numbers) {
  const { present, missing } = getDrawDigits(numbers);
  const combinations = [];

  present.forEach((leftDigit, index) => {
    const rightDigits = [
      ...present.slice(index + 1),
      ...missing,
    ];

    rightDigits.forEach((rightDigit) => {
      combinations.push(`${leftDigit}${rightDigit}`);
    });
  });

  missing.forEach((digit) => {
    combinations.push(`${digit}${digit}`);
  });

  for (let right = missing.length - 1; right > 0; right -= 1) {
    for (let left = 0; left < right; left += 1) {
      combinations.push(`${missing[right]}${missing[left]}`);
    }
  }

  return unique(combinations);
}

export function buildInverseCombinations(numbers) {
  return buildNormalCombinations(numbers).map((number) => reverseNumber(number));
}

export function buildParlets(numbers) {
  const normalized = unique(numbers.map(normalizeNumber));
  const pairs = [];

  for (let left = 0; left < normalized.length; left += 1) {
    for (let right = left + 1; right < normalized.length; right += 1) {
      pairs.push([normalized[left], normalized[right]]);
    }
  }

  return pairs;
}

export function countParlet(drawings, pair) {
  const [left, right] = pair.map(normalizeNumber);

  return drawings.filter((drawing) => {
    const numbers = drawingNumbers(drawing);
    return numbers.includes(left) && numbers.includes(right);
  }).length;
}

export function rankNumbers(drawings) {
  const counts = Object.fromEntries(allTwoDigitNumbers().map((number) => [number, 0]));

  drawings.forEach((drawing) => {
    drawingNumbers(drawing).forEach((number) => {
      counts[number] += 1;
    });
  });

  const ranked = Object.entries(counts).map(([number, count]) => ({ number, count }));
  const byMost = [...ranked].sort((a, b) => b.count - a.count || a.number.localeCompare(b.number));
  const byLeastSeen = [...ranked]
    .filter((item) => item.count > 0)
    .sort((a, b) => a.count - b.count || a.number.localeCompare(b.number));

  return {
    hot: byMost.slice(0, 10),
    frequent: byMost.slice(0, 10),
    cold: byLeastSeen.slice(0, 10),
    never: ranked.filter((item) => item.count === 0).slice(0, 10),
  };
}

export function analyzeMethods(drawings, sourceNumbers) {
  const normal = buildNormalCombinations(sourceNumbers);
  const inverse = buildInverseCombinations(sourceNumbers);

  return {
    digits: getDrawDigits(sourceNumbers),
    normal,
    inverse,
    normalParlets: analyzeParlets(drawings, normal),
    inverseParlets: analyzeParlets(drawings, inverse),
    matches: analyzeMatches(drawings, normal, inverse),
  };
}

export function analyzeParlets(drawings, numbers) {
  return buildParlets(numbers)
    .map(([left, right]) => ({
      left,
      right,
      count: countParlet(drawings, [left, right]),
    }))
    .sort((a, b) => b.count - a.count || `${a.left}${a.right}`.localeCompare(`${b.left}${b.right}`));
}

export function analyzeMatches(drawings, normalNumbers, inverseNumbers) {
  const inverseSet = new Set(inverseNumbers);
  return buildParlets(normalNumbers)
    .map(([left, right]) => {
      const inverseLeft = reverseNumber(left);
      const inverseRight = reverseNumber(right);
      if (!inverseSet.has(inverseLeft) || !inverseSet.has(inverseRight)) {
        return null;
      }

      return {
        normal: [left, right],
        inverse: [inverseLeft, inverseRight],
        normalCount: countParlet(drawings, [left, right]),
        inverseCount: countParlet(drawings, [inverseLeft, inverseRight]),
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.normalCount + b.inverseCount) - (a.normalCount + a.inverseCount));
}

export function filterMatchesByCounts(matches, filters = {}) {
  const normalCount = parseCountFilter(filters.normalCount);
  const inverseCount = parseCountFilter(filters.inverseCount);

  return matches.filter((match) => {
    const normalMatches = normalCount === null || match.normalCount === normalCount;
    const inverseMatches = inverseCount === null || match.inverseCount === inverseCount;
    return normalMatches && inverseMatches;
  });
}

export function getParletDigitSignature(parlet) {
  const pair = Array.isArray(parlet) ? parlet : [parlet.left, parlet.right];
  return pair
    .map(normalizeNumber)
    .join('')
    .split('')
    .sort()
    .join('');
}

export function findMethodDigitCoincidences(analysis, filters = {}) {
  const firstMethod = normalizeMethodFilter(filters.firstMethod);
  const secondMethod = normalizeMethodFilter(filters.secondMethod);
  const firstCount = parseCountFilter(filters.firstCount);
  const secondCount = parseCountFilter(filters.secondCount);

  if (!analysis || firstCount === null || secondCount === null) {
    return [];
  }

  const firstRows = getParletRowsByMethod(analysis, firstMethod)
    .filter((row) => row.count === firstCount);
  const secondRowsBySignature = groupRowsBySignature(
    getParletRowsByMethod(analysis, secondMethod)
      .filter((row) => row.count === secondCount),
  );

  return firstRows.flatMap((firstRow) => {
    const signature = getParletDigitSignature(firstRow);
    const secondRows = secondRowsBySignature.get(signature) || [];

    return secondRows.map((secondRow) => ({
      first: buildMethodParlet(firstMethod, firstRow),
      second: buildMethodParlet(secondMethod, secondRow),
      signature,
    }));
  });
}

export function parseCountFilter(value) {
  const text = String(value ?? '').trim();
  if (!/^\d+$/.test(text)) {
    return null;
  }

  return Number(text);
}

function normalizeMethodFilter(value) {
  return value === 'inverse' ? 'inverse' : 'normal';
}

function getParletRowsByMethod(analysis, method) {
  return method === 'inverse'
    ? analysis.inverseParlets || []
    : analysis.normalParlets || [];
}

function groupRowsBySignature(rows) {
  const grouped = new Map();

  rows.forEach((row) => {
    const signature = getParletDigitSignature(row);
    if (!grouped.has(signature)) {
      grouped.set(signature, []);
    }
    grouped.get(signature).push(row);
  });

  return grouped;
}

function buildMethodParlet(method, row) {
  return {
    method,
    left: row.left,
    right: row.right,
    count: row.count,
  };
}

function drawingNumbers(drawing) {
  return [
    drawing.fijo,
    drawing.first,
    drawing.second,
  ].map(normalizeNumber);
}

function reverseNumber(number) {
  return normalizeNumber(number).split('').reverse().join('');
}

function allDigits() {
  return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
}

function allTwoDigitNumbers() {
  return Array.from({ length: 100 }, (_, index) => normalizeNumber(index));
}

function unique(values) {
  return [...new Set(values)];
}

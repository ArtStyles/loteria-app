import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  buildInverseCombinations,
  buildNormalCombinations,
  buildParlets,
  countParlet,
  filterMatchesByCounts,
  findMethodDigitCoincidences,
  getDrawDigits,
  getParletDigitSignature,
  normalizeNumber,
  parseCountFilter,
  rankNumbers,
} from './loteria.js';

describe('normalizeNumber', () => {
  test('formats one digit values as two digit lottery numbers', () => {
    assert.equal(normalizeNumber(7), '07');
    assert.equal(normalizeNumber('3'), '03');
  });
});

describe('digit combinations', () => {
  test('extracts present and missing digits from the three drawn numbers', () => {
    assert.deepEqual(getDrawDigits(['07', '12', '31']), {
      present: ['0', '7', '1', '2', '3'],
      missing: ['4', '5', '6', '8', '9'],
    });
  });

  test('builds the normal combinations shown in the workbook example', () => {
    assert.deepEqual(buildNormalCombinations(['07', '12', '31']), [
      '07', '01', '02', '03', '04', '05', '06', '08', '09',
      '71', '72', '73', '74', '75', '76', '78', '79',
      '12', '13', '14', '15', '16', '18', '19',
      '23', '24', '25', '26', '28', '29',
      '34', '35', '36', '38', '39',
      '44', '55', '66', '88', '99',
      '94', '95', '96', '98',
      '84', '85', '86',
      '64', '65',
      '54',
    ]);
  });

  test('builds inverse combinations by reversing each normal number', () => {
    assert.deepEqual(buildInverseCombinations(['07', '12', '31']).slice(0, 9), [
      '70', '10', '20', '30', '40', '50', '60', '80', '90',
    ]);
  });

  test('builds unique parlets from generated numbers', () => {
    assert.deepEqual(buildParlets(['39', '85', '93']), [
      ['39', '85'],
      ['39', '93'],
      ['85', '93'],
    ]);
  });
});

describe('historical analysis', () => {
  const drawings = [
    { fijo: '07', first: '85', second: '39' },
    { fijo: '39', first: '85', second: '45' },
    { fijo: '93', first: '58', second: '03' },
    { fijo: '58', first: '38', second: '93' },
    { fijo: '22', first: '87', second: '25' },
  ];

  test('counts a parlet when both numbers appear in the same drawing', () => {
    assert.equal(countParlet(drawings, ['39', '85']), 2);
    assert.equal(countParlet(drawings, ['93', '58']), 2);
    assert.equal(countParlet(drawings, ['39', '58']), 0);
  });

  test('ranks numbers over the full drawing database', () => {
    assert.deepEqual(rankNumbers(drawings).hot.slice(0, 3), [
      { number: '39', count: 2 },
      { number: '58', count: 2 },
      { number: '85', count: 2 },
    ]);
    assert.equal(rankNumbers(drawings).never[0].count, 0);
  });
});

describe('match count filters', () => {
  const matches = [
    { normal: ['94', '96'], inverse: ['49', '69'], normalCount: 7, inverseCount: 9 },
    { normal: ['97', '99'], inverse: ['79', '99'], normalCount: 7, inverseCount: 8 },
    { normal: ['89', '98'], inverse: ['98', '89'], normalCount: 4, inverseCount: 9 },
  ];

  test('filters matches by exact normal and inverse counts', () => {
    assert.deepEqual(filterMatchesByCounts(matches, { normalCount: '7', inverseCount: '9' }), [
      matches[0],
    ]);
  });

  test('leaves a side unfiltered when its count is empty or invalid', () => {
    assert.deepEqual(filterMatchesByCounts(matches, { normalCount: '', inverseCount: '9' }), [
      matches[0],
      matches[2],
    ]);
    assert.deepEqual(filterMatchesByCounts(matches, { normalCount: '-1', inverseCount: '' }), matches);
  });

  test('parses only whole non-negative count filters', () => {
    assert.equal(parseCountFilter('0'), 0);
    assert.equal(parseCountFilter('12'), 12);
    assert.equal(parseCountFilter(''), null);
    assert.equal(parseCountFilter('-1'), null);
    assert.equal(parseCountFilter('3.5'), null);
    assert.equal(parseCountFilter('abc'), null);
  });
});

describe('configurable method digit coincidences', () => {
  const analysis = {
    normalParlets: [
      { left: '97', right: '81', count: 7 },
      { left: '92', right: '31', count: 7 },
      { left: '11', right: '79', count: 7 },
      { left: '79', right: '18', count: 9 },
      { left: '17', right: '19', count: 9 },
      { left: '90', right: '46', count: 5 },
    ],
    inverseParlets: [
      { left: '79', right: '18', count: 9 },
      { left: '29', right: '13', count: 9 },
      { left: '09', right: '64', count: 9 },
      { left: '11', right: '79', count: 4 },
    ],
  };

  test('builds digit signatures regardless of order while preserving duplicates', () => {
    assert.equal(getParletDigitSignature({ left: '97', right: '81' }), '1789');
    assert.equal(getParletDigitSignature({ left: '79', right: '18' }), '1789');
    assert.equal(getParletDigitSignature({ left: '11', right: '79' }), '1179');
    assert.equal(getParletDigitSignature({ left: '17', right: '19' }), '1179');
  });

  test('finds coincidences between different selected methods and counts', () => {
    assert.deepEqual(findMethodDigitCoincidences(analysis, {
      firstMethod: 'normal',
      firstCount: '7',
      secondMethod: 'inverse',
      secondCount: '9',
    }), [
      {
        first: { method: 'normal', left: '97', right: '81', count: 7 },
        second: { method: 'inverse', left: '79', right: '18', count: 9 },
        signature: '1789',
      },
      {
        first: { method: 'normal', left: '92', right: '31', count: 7 },
        second: { method: 'inverse', left: '29', right: '13', count: 9 },
        signature: '1239',
      },
    ]);
  });

  test('finds coincidences when both fields use the same method', () => {
    assert.deepEqual(findMethodDigitCoincidences(analysis, {
      firstMethod: 'normal',
      firstCount: '7',
      secondMethod: 'normal',
      secondCount: '9',
    }), [
      {
        first: { method: 'normal', left: '97', right: '81', count: 7 },
        second: { method: 'normal', left: '79', right: '18', count: 9 },
        signature: '1789',
      },
      {
        first: { method: 'normal', left: '11', right: '79', count: 7 },
        second: { method: 'normal', left: '17', right: '19', count: 9 },
        signature: '1179',
      },
    ]);
  });

  test('returns no coincidences when either count is empty or invalid', () => {
    assert.deepEqual(findMethodDigitCoincidences(analysis, {
      firstMethod: 'normal',
      firstCount: '',
      secondMethod: 'inverse',
      secondCount: '9',
    }), []);
    assert.deepEqual(findMethodDigitCoincidences(analysis, {
      firstMethod: 'normal',
      firstCount: '7',
      secondMethod: 'inverse',
      secondCount: 'x',
    }), []);
  });
});

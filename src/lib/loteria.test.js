import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  buildInverseCombinations,
  buildNormalCombinations,
  buildParlets,
  countParlet,
  getDrawDigits,
  normalizeNumber,
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

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectDataType,
  computeColumnQuality,
  computeColumnDistribution,
  computeNumericStats,
  computeTextStats,
  calculatePearsonCorrelation,
  computeCorrelationMatrix,
  computeMissingDataAnalysis,
} from './profiler';

test('detectDataType accurately identifies integers, decimals, dates, booleans, and text', () => {
  assert.equal(detectDataType([1, 2, 3, 4, 100]), 'integer');
  assert.equal(detectDataType(['10', '20', '35']), 'integer');
  assert.equal(detectDataType([1.5, 2.75, 3.14]), 'decimal');
  assert.equal(detectDataType(['2023-01-15', '2023-02-20', '2023-03-25']), 'date');
  assert.equal(detectDataType(['true', 'false', 'true', 'false']), 'boolean');
  assert.equal(detectDataType(['Apple', 'Banana', 'Orange']), 'text');
});

test('computeColumnQuality calculates valid, error, and empty percentages correctly', () => {
  // 10 values: 7 valid integers, 2 empty, 1 invalid error string
  const values = [10, 20, null, 40, '', 60, 'invalid_text', 80, 90, 100];
  const quality = computeColumnQuality(values, 'integer');

  assert.equal(quality.totalCount, 10);
  assert.equal(quality.validCount, 7);
  assert.equal(quality.validPercent, 70);
  assert.equal(quality.emptyCount, 2);
  assert.equal(quality.emptyPercent, 20);
  assert.equal(quality.errorCount, 1);
  assert.equal(quality.errorPercent, 10);
});

test('computeColumnDistribution computes distinct and unique counts', () => {
  // A, B, B, C, D, D, D -> Distinct: 4 ('A', 'B', 'C', 'D'), Unique: 2 ('A' and 'C' appear once)
  const values = ['A', 'B', 'B', 'C', 'D', 'D', 'D'];
  const dist = computeColumnDistribution(values);

  assert.equal(dist.distinctCount, 4);
  assert.equal(dist.uniqueCount, 2);
  assert.equal(dist.topFrequencies[0].value, 'D');
  assert.equal(dist.topFrequencies[0].count, 3);
});

test('computeNumericStats computes mean, median, min, max, stdDev, and zeroes', () => {
  const values = [0, 10, 20, 30, 40];
  const stats = computeNumericStats(values);

  assert.ok(stats);
  assert.equal(stats.min, 0);
  assert.equal(stats.max, 40);
  assert.equal(stats.mean, 20);
  assert.equal(stats.median, 20);
  assert.equal(stats.zeroCount, 1);
  assert.equal(stats.sum, 100);
});

test('calculatePearsonCorrelation computes perfect linear correlation and inverse correlation', () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10]; // Perfect positive
  assert.equal(calculatePearsonCorrelation(x, y), 1.0);

  const z = [10, 8, 6, 4, 2]; // Perfect negative
  assert.equal(calculatePearsonCorrelation(x, z), -1.0);
});

test('computeMissingDataAnalysis identifies column missingness and complete rows', () => {
  const data = [
    { a: 1, b: 'x' },
    { a: null, b: 'y' },
    { a: 3, b: '' },
    { a: 4, b: 'w' },
  ];
  const analysis = computeMissingDataAnalysis(data, ['a', 'b']);

  assert.equal(analysis.totalRows, 4);
  // Row 0: complete (1, 'x')
  // Row 1: missing a
  // Row 2: missing b
  // Row 3: complete (4, 'w')
  assert.equal(analysis.completeRowsCount, 2);
  assert.equal(analysis.completeRowsPercentage, 50);
  assert.equal(analysis.missingCounts[0], 1); // col a
  assert.equal(analysis.missingCounts[1], 1); // col b
});

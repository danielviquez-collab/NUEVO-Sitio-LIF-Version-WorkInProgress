import test from 'node:test';
import assert from 'node:assert/strict';
import {formatScore} from './format-score.ts';

test('Scores use explicit nonbreaking spaces, including four-digit scores', () => {
  for (const [score, expected] of [[0,'0'],[50,'50'],[3900,'3\u00a0900'],[11700,'11\u00a0700'],[1000000,'1\u00a0000\u00a0000']])
    assert.equal(formatScore(score), expected);
});

import { parseVariables, handleTop } from './variables';

// ── parseVariables ───────────────────────────────────────────────────────────

describe('parseVariables', () => {
  test('empty string returns empty array', () => {
    expect(parseVariables('')).toEqual([]);
  });

  test('no variables returns empty array', () => {
    expect(parseVariables('hello world')).toEqual([]);
  });

  test('single variable', () => {
    expect(parseVariables('{{input}}')).toEqual(['input']);
  });

  test('multiple distinct variables in order', () => {
    expect(parseVariables('{{a}} and {{b}} then {{c}}')).toEqual(['a', 'b', 'c']);
  });

  test('duplicate variables are deduped, first-seen order preserved', () => {
    expect(parseVariables('{{x}} {{y}} {{x}}')).toEqual(['x', 'y']);
  });

  test('whitespace inside braces is trimmed', () => {
    expect(parseVariables('{{ name }}')).toEqual(['name']);
  });

  test('invalid identifier (starts with digit) is ignored', () => {
    expect(parseVariables('{{1bad}}')).toEqual([]);
  });

  test('underscore and $ prefixes are valid identifiers', () => {
    expect(parseVariables('{{_private}} {{$special}}')).toEqual(['_private', '$special']);
  });

  test('alphanumeric identifiers with underscores', () => {
    expect(parseVariables('{{my_var_2}}')).toEqual(['my_var_2']);
  });

  test('mixed valid and invalid tokens', () => {
    expect(parseVariables('{{ok}} {{123bad}} {{alsoOk}}')).toEqual(['ok', 'alsoOk']);
  });

  test('calling twice resets regex state (no lastIndex leak)', () => {
    parseVariables('{{a}} {{b}}');
    expect(parseVariables('{{c}}')).toEqual(['c']);
  });
});

// ── handleTop ────────────────────────────────────────────────────────────────

describe('handleTop', () => {
  test('single handle is centered at 50%', () => {
    expect(handleTop(0, 1)).toBe('50%');
  });

  test('two handles at 33.33% and 66.67%', () => {
    expect(handleTop(0, 2)).toBe(`${(1 / 3) * 100}%`);
    expect(handleTop(1, 2)).toBe(`${(2 / 3) * 100}%`);
  });

  test('three handles evenly spaced', () => {
    expect(handleTop(0, 3)).toBe('25%');
    expect(handleTop(1, 3)).toBe('50%');
    expect(handleTop(2, 3)).toBe('75%');
  });
});

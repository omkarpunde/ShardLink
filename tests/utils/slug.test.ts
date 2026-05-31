import { generateSlug, isValidSlug } from '../../src/utils/slug';

describe('generateSlug', () => {
  it('returns a string of default length (7)', () => {
    const slug = generateSlug();
    expect(slug).toHaveLength(7);
  });

  it('returns a string of specified length', () => {
    const slug = generateSlug(10);
    expect(slug).toHaveLength(10);
  });

  it('generates unique slugs', () => {
    const slugs = new Set(Array.from({ length: 100 }, () => generateSlug()));
    expect(slugs.size).toBe(100);
  });

  it('only contains URL-safe characters', () => {
    const slug = generateSlug();
    expect(slug).toMatch(/^[a-zA-Z0-9_-]+$/);
  });
});

describe('isValidSlug', () => {
  it('returns true for alphanumeric slugs', () => {
    expect(isValidSlug('abc123')).toBe(true);
  });

  it('returns true for mixed case slugs', () => {
    expect(isValidSlug('AbC123Z')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isValidSlug('')).toBe(false);
  });

  it('returns false for slugs with special characters', () => {
    expect(isValidSlug('abc$%^')).toBe(false);
  });

  it('returns false for slugs longer than 10 chars', () => {
    expect(isValidSlug('abcdefghijk')).toBe(false);
  });
});

import { nanoid } from 'nanoid';
import { config } from '../config';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateSlug(length: number = config.slug.length): string {
  return nanoid(length);
}

export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length < 1 || slug.length > 10) return false;
  return [...slug].every((ch) => ALPHABET.includes(ch));
}

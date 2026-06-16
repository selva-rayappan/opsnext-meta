import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes with conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Decode a JWT payload without verifying the signature.
 * Used client-side only to read user claims from the access token.
 */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T {
  const base64Url = token.split('.')[1];
  if (!base64Url) throw new Error('Invalid JWT');
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );
  return JSON.parse(jsonPayload) as T;
}

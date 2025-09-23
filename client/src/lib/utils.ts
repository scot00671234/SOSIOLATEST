import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createPostSlug(title: string): string {
  // Unicode-aware slug generation that preserves international characters (matching server-side)
  return title
    .normalize('NFKC') // Normalize Unicode characters
    .toLowerCase()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Keep Unicode letters, numbers, spaces, and hyphens only (using Unicode property escapes)
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    // Replace spaces and multiple hyphens with single hyphen
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, 80);
}

export function generateUniqueSlug(title: string, existingSlugs: string[]): string {
  const baseSlug = createPostSlug(title);
  let uniqueSlug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
}

/**
 * User utility functions.
 */

import { isToday, parseISO } from 'date-fns';
import type { User } from '../types';

/**
 * Check if a user was created today.
 * 
 * @param user - The user object with created_at field
 * @returns true if user was created today, false otherwise
 */
export function isNewUser(user: User | null): boolean {
  if (!user || !user.created_at) {
    return false;
  }

  try {
    const createdDate = parseISO(user.created_at);
    return isToday(createdDate);
  } catch {
    // If parsing fails, return false
    return false;
  }
}

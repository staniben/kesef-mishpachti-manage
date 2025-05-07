
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a new UUID (will be replaced with database IDs in the future)
 */
export const generateId = (): string => {
  return uuidv4();
};

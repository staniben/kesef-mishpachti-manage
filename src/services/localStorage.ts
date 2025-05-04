
// Utility for persistent storage using localStorage
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Error retrieving data from localStorage for key: ${key}`, error);
      return defaultValue;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving data to localStorage for key: ${key}`, error);
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.setItem(key, JSON.stringify(null));
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data from localStorage for key: ${key}`, error);
    }
  }
};

import { format } from 'date-fns';

/**
 * Safely format a date with error handling
 * @param {string|Date} dateValue - The date to format
 * @param {string} formatString - The format string for date-fns
 * @param {string} fallback - Fallback text if date is invalid
 * @returns {string} Formatted date or fallback text
 */
export const safeFormatDate = (dateValue, formatString = 'MMM dd, yyyy - HH:mm', fallback = 'N/A') => {
  try {
    if (!dateValue) return fallback;
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue);
      return fallback;
    }
    
    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error, 'Date value:', dateValue);
    return fallback;
  }
};

/**
 * Check if a date value is valid
 * @param {string|Date} dateValue - The date to check
 * @returns {boolean} True if date is valid
 */
export const isValidDate = (dateValue) => {
  if (!dateValue) return false;
  
  try {
    const date = new Date(dateValue);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
}; 
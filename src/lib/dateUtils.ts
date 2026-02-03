/**
 * Get today's date as YYYY-MM-DD string
 */
export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Check if a date string is on or before today
 */
export const isDateUpToToday = (dateString: string | undefined): boolean => {
  if (!dateString) return true; // If no date, include by default
  const today = getTodayString();
  return dateString <= today;
};

/**
 * Get current month as YYYY-MM string
 */
export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Check if a month is in the future relative to today
 */
export const isMonthInFuture = (month: string): boolean => {
  return month > getCurrentMonth();
};

/**
 * Check if a month is the current month
 */
export const isCurrentMonth = (month: string): boolean => {
  return month === getCurrentMonth();
};

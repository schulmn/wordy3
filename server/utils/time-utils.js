/**
 * Time utility functions for Wordy3 server
 * Provides consistent time zone handling across the application
 */

/**
 * Helper function to normalize a date to midnight in US Central Time
 * This handles the case where a date string like "2025-03-07" is passed
 * and ensures it represents midnight on that date in Central Time
 * 
 * @param {Date|string} date - Date to normalize (defaults to now)
 * @returns {Date} Date normalized to midnight in US Central Time
 */
export function normalizeToCentralTime(date = new Date()) {
  console.log('Normalizing date:', date);
  
  let inputDate;
  
  // If date is a string in YYYY-MM-DD format (from date input)
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Extract the year, month, and day
    const [year, month, day] = date.split('-');
    console.log(`Parsed date string: year=${year}, month=${month}, day=${day}`);
    
    // Create a date object with these components in the local time zone
    // We use month-1 because JavaScript months are 0-indexed
    inputDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else {
    // Otherwise, use the provided date
    inputDate = typeof date === 'string' ? new Date(date) : new Date(date);
  }
  
  console.log('Input date:', inputDate.toString());
  
  // Get the date in Central Time
  const centralTime = new Date(inputDate.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  console.log('Central time:', centralTime.toString());
  
  // Extract year, month, day components from the Central Time date
  const centralYear = centralTime.getFullYear();
  const centralMonth = centralTime.getMonth(); // 0-indexed
  const centralDay = centralTime.getDate();
  
  console.log(`Central components: year=${centralYear}, month=${centralMonth}, day=${centralDay}`);
  
  // Create a new date with these components, setting time to midnight UTC
  // This ensures consistent behavior regardless of the local time zone
  const normalizedDate = new Date(Date.UTC(centralYear, centralMonth, centralDay));
  console.log('Normalized date:', normalizedDate.toISOString());
  
  return normalizedDate;
}

export const LATE_THRESHOLDS = {
  checkIn: {
    lateAfterHour: 22, // 22:00 (10 PM)
    earlyBeforeHour: 6, // 06:00 (6 AM)
  },
  checkOut: {
    lateAfterHour: 21, // 21:00 (9 PM)
    earlyBeforeHour: 4, // 04:00 (4 AM)
  }
};

/**
 * Checks if a check-in is considered late based on current time.
 * Late if time > 22:00 OR < 06:00
 * @param {Date} date - The date to check
 * @returns {boolean} - true if late, false otherwise
 */
export const isLateCheckIn = (date = new Date()) => {
  const currentHour = date.getHours();
  return (
    currentHour >= LATE_THRESHOLDS.checkIn.lateAfterHour ||
    currentHour < LATE_THRESHOLDS.checkIn.earlyBeforeHour
  );
};

/**
 * Checks if a check-out is considered late based on current time.
 * Late if time > 21:00 OR < 04:00
 * @param {Date} date - The date to check
 * @returns {boolean} - true if late check-out, false otherwise
 */
export const isLateCheckOut = (date = new Date()) => {
  const currentHour = date.getHours();
  return (
    currentHour >= LATE_THRESHOLDS.checkOut.lateAfterHour ||
    currentHour < LATE_THRESHOLDS.checkOut.earlyBeforeHour
  );
};

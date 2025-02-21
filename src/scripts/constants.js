/**
 * Letter point values as specified in the game rules
 */
export const LETTER_POINTS = {
    'A': 1, 'E': 1, 'I': 1, 'L': 1, 'N': 1, 'O': 1, 'R': 1, 'S': 1, 'T': 1, 'U': 1,
    'D': 2, 'G': 2,
    'B': 3, 'C': 3, 'M': 3, 'P': 3,
    'F': 4, 'H': 4, 'V': 4, 'W': 4, 'Y': 4,
    'K': 5,
    'J': 8, 'X': 8,
    'Q': 10, 'Z': 10
};

/**
 * Game configuration constants
 */
export const GAME_CONFIG = {
    MIN_WORD_LENGTH: 3,
    MIN_LETTERS: 4,
    MAX_LETTERS: 7,
    LETTER_DROP_INTERVAL: 3000, // 3 seconds
    FULL_TRAY_DROP_INTERVAL: 6000, // 6 seconds
    DEFAULT_SEQUENCE_LENGTH: 55,
    MIN_SEQUENCE_LENGTH: 30,
    MAX_SEQUENCE_LENGTH: 100,
    LETTER_AGE_WARNING: 3000, // 3 seconds before warning when tray is full
    LETTER_AGE_DANGER: 6000 // 6 seconds before danger when tray is full (matches FULL_TRAY_DROP_INTERVAL)
};

/**
 * Visual state constants
 */
export const VISUAL_STATES = {
    NORMAL: 'normal',
    WARNING: 'warning',
    DANGER: 'danger'
};

/**
 * Word length multiplier values
 */
export const WORD_LENGTH_MULTIPLIERS = {
    5: 1.5, // 5-letter words get 1.5x points (rounded up)
    6: 2.0, // 6-letter words get 2x points
    7: 3.0  // 7-letter words get 3x points
};

/**
 * Letter point value colors
 */
export const LETTER_POINT_COLORS = {
    1: '#4a90e2', // Soft Blue
    2: '#50c878', // Light Green
    3: '#f4d03f', // Pale Yellow
    4: '#e67e22', // Orange
    5: '#9b59b6', // Light Purple
    8: '#e74c3c', // Coral/Salmon
    10: '#c0392b'  // Deep Red
};

/**
 * Letter frequency distribution for English language
 * Adjusted to create a playable distribution of letters
 */
export const LETTER_FREQUENCIES = {
    'A': 8.2, 'B': 1.5, 'C': 2.8, 'D': 4.3, 'E': 13, 'F': 2.2, 'G': 2.0, 'H': 6.1,
    'I': 7.0, 'J': 0.15, 'K': 0.77, 'L': 4.0, 'M': 2.4, 'N': 6.7, 'O': 7.5, 'P': 1.9,
    'Q': 0.095, 'R': 6.0, 'S': 6.3, 'T': 9.1, 'U': 2.8, 'V': 0.98, 'W': 2.4, 'X': 0.15,
    'Y': 2.0, 'Z': 0.074
};

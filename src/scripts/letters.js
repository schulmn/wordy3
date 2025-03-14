import { LETTER_POINTS, LETTER_FREQUENCIES, GAME_CONFIG, VISUAL_STATES, LETTER_POINT_COLORS } from './constants.js';

/**
 * Generates a sequence of letters based on frequency distribution
 * @param {number} length - The number of letters to generate
 * @returns {string[]} Array of generated letters
 */
export function generateLetterSequence(length) {
    const letters = [];
    const letterPool = createLetterPool();
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * letterPool.length);
        letters.push(letterPool[randomIndex]);
    }
    
    return letters;
}

/**
 * Creates a pool of letters based on their frequencies
 * @returns {string[]} Array of letters with frequency-based repetition
 */
function createLetterPool() {
    const pool = [];
    const scaleFactor = 100; // Scale frequencies to get whole numbers
    
    Object.entries(LETTER_FREQUENCIES).forEach(([letter, frequency]) => {
        const count = Math.round(frequency * scaleFactor);
        pool.push(...Array(count).fill(letter));
    });
    
    return pool;
}

/**
 * Creates a letter element with its point value and timing information
 * @param {string} letter - The letter to display
 * @returns {Object} The letter object containing element and timing info
 */
export function createLetterElement(letter) {
    const element = document.createElement('div');
    element.className = 'letter';
    const points = LETTER_POINTS[letter];
    element.dataset.points = points;
    element.dataset.selected = 'false';
    element.style.backgroundColor = LETTER_POINT_COLORS[points];
    element.textContent = letter;
    
    return {
        element,
        letter,
        timestamp: Date.now(),
        visualState: VISUAL_STATES.NORMAL,
        selected: false
    };
}

/**
 * Calculates the point value for a word
 * @param {string} word - The word to calculate points for
 * @returns {number} Total points for the word
 */
export function calculateWordPoints(word) {
    return word.split('')
        .map(letter => LETTER_POINTS[letter.toUpperCase()])
        .reduce((sum, points) => sum + points, 0);
}

/**
 * Validates if a word can be formed from available letters
 * @param {string} word - The word to validate
 * @param {string[]} availableLetters - Array of available letters
 * @returns {boolean} Whether the word can be formed
 */
export function canFormWord(word, availableLetters) {
    const letterCounts = {};
    
    // Count available letters
    availableLetters.forEach(letter => {
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    });
    
    // Check if we have enough of each letter
    for (const letter of word.toUpperCase()) {
        if (!letterCounts[letter]) {
            return false;
        }
        letterCounts[letter]--;
    }
    
    return true;
}

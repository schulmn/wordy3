import { GAME_CONFIG, VISUAL_STATES, WORD_LENGTH_MULTIPLIERS } from './constants.js';
import { generateLetterSequence, createLetterElement, calculateWordPoints, canFormWord } from './letters.js';
import { dictionary } from './dictionary.js';

class WordyGame {
    constructor() {
        this.letterSequence = [];
        this.currentLetters = []; // Now stores letter objects instead of just strings
        this.score = 0;
        this.isGameRunning = false;
        this.nextLetterTimer = null;
        this.updateInterval = null;
        this.fullTrayTimestamp = null;
        
        // DOM elements
        this.letterTray = document.getElementById('letter-tray');
        this.wordInput = document.getElementById('word-input');
        this.submitButton = document.getElementById('submit-word');
        this.startButton = document.getElementById('start-game');
        this.resetButton = document.getElementById('reset-game');
        this.scoreDisplay = document.getElementById('score');
        this.timerDisplay = document.getElementById('next-letter-timer');
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.resetButton.addEventListener('click', () => this.resetGame());
        this.submitButton.addEventListener('click', () => this.submitWord());
        
        this.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitWord();
            }
        });

        // Auto-capitalize input and prevent non-letter characters
        this.wordInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
        });
    }
    
    async startGame() {
        // Show loading overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingError = loadingOverlay.querySelector('.loading-error');
        loadingOverlay.classList.remove('hidden');
        loadingError.classList.add('hidden');

        // Initialize dictionary
        try {
            const success = await dictionary.initialize();
            if (!success) {
                throw new Error('Dictionary failed to initialize');
            }

            this.isGameRunning = true;
            this.letterSequence = generateLetterSequence(GAME_CONFIG.DEFAULT_SEQUENCE_LENGTH);
            this.startButton.disabled = true;
            this.wordInput.focus();
            
            // Start letter state updates
            this.startLetterStateUpdates();
            
            // Add initial minimum letters
            while (this.currentLetters.length < GAME_CONFIG.MIN_LETTERS && 
                   this.letterSequence.length > 0) {
                this.addNextLetter();
            }
        } catch (error) {
            loadingError.textContent = error.message;
            loadingError.classList.remove('hidden');
            return;
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    }
    
    startLetterStateUpdates() {
        this.updateInterval = setInterval(() => {
            if (!this.isGameRunning) return;

            // Check if we should end the game (no more letters in sequence and tray is empty)
            if (this.letterSequence.length === 0 && this.currentLetters.length === 0) {
                this.endGame();
                return;
            }

            // Handle letter aging when tray is full OR when we're out of sequence letters
            if (this.currentLetters.length === GAME_CONFIG.MAX_LETTERS || 
                (this.letterSequence.length === 0 && this.currentLetters.length > 0)) {
                // Initialize fullTrayTimestamp if not set
                if (!this.fullTrayTimestamp) {
                    this.fullTrayTimestamp = Date.now();
                    return;
                }

                // Find the oldest letter
                let oldestLetter = this.currentLetters[0];
                for (let i = 1; i < this.currentLetters.length; i++) {
                    if (this.currentLetters[i].timestamp < oldestLetter.timestamp) {
                        oldestLetter = this.currentLetters[i];
                    }
                }

                const currentTime = Date.now();
                const trayAge = currentTime - this.fullTrayTimestamp;
                
                // Calculate remaining time
                const remainingTime = Math.ceil((GAME_CONFIG.LETTER_AGE_DANGER - trayAge) / 1000);
                
                // Update oldest letter's state based on tray age
                if (trayAge >= GAME_CONFIG.LETTER_AGE_DANGER) {
                    // Remove the letter if tray has been full for 6 seconds
                    const index = this.currentLetters.indexOf(oldestLetter);
                    oldestLetter.element.remove();
                    this.currentLetters.splice(index, 1);
                    this.fullTrayTimestamp = null;
                    
                    // If we have letters in sequence and not at max capacity, add a new one
                    if (this.letterSequence.length > 0 && 
                        this.currentLetters.length < GAME_CONFIG.MAX_LETTERS) {
                        this.addNextLetter();
                    }
                    // Check if game should end after removing letter
                    else if (this.letterSequence.length === 0 && this.currentLetters.length === 0) {
                        this.endGame();
                    }
                    // Reset timestamp to start aging the next oldest letter
                    this.fullTrayTimestamp = null;
                } else if (trayAge >= GAME_CONFIG.LETTER_AGE_WARNING) {
                    // Warning state after 3 seconds
                    oldestLetter.element.className = `letter ${VISUAL_STATES.WARNING}`;
                    oldestLetter.element.dataset.age = remainingTime + 's';
                } else {
                    // Normal state with countdown
                    oldestLetter.element.className = 'letter';
                    oldestLetter.element.dataset.age = remainingTime + 's';
                }
            } else {
                // Reset fullTrayTimestamp when we're not in an aging state
                this.fullTrayTimestamp = null;
            }
        }, 100); // Update every 100ms for smoother countdown
    }
    
    resetGame() {
        this.isGameRunning = false;
        this.letterSequence = [];
        this.currentLetters = [];
        this.score = 0;
        this.scoreDisplay.textContent = '0';
        this.letterTray.innerHTML = '';
        this.wordInput.value = '';
        this.startButton.disabled = false;
        this.timerDisplay.textContent = '0';
        if (this.nextLetterTimer) {
            clearTimeout(this.nextLetterTimer);
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
    
    addNextLetter() {
        if (!this.isGameRunning) {
            return;
        }
        
        // If we have no more letters in sequence and no letters in tray, end game
        if (this.letterSequence.length === 0 && this.currentLetters.length === 0) {
            this.endGame();
            return;
        }
        
        // If we have no more letters to add, let the game continue with remaining letters
        if (this.letterSequence.length === 0) {
            return;
        }
        
        const nextLetter = this.letterSequence.shift();
        const letterObj = createLetterElement(nextLetter);
        this.currentLetters.push(letterObj);
        this.letterTray.appendChild(letterObj.element);
        
        // Schedule next letter if we're not at max capacity
        if (this.currentLetters.length < GAME_CONFIG.MAX_LETTERS && this.letterSequence.length > 0) {
            this.scheduleNextLetter(GAME_CONFIG.LETTER_DROP_INTERVAL);
        }
    }
    
    scheduleNextLetter(interval) {
        if (this.nextLetterTimer) {
            clearTimeout(this.nextLetterTimer);
        }
        
        let timeLeft = Math.ceil(interval / 1000);
        this.timerDisplay.textContent = timeLeft;
        
        const updateTimer = setInterval(() => {
            timeLeft--;
            this.timerDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(updateTimer);
            }
        }, 1000);
        
        this.nextLetterTimer = setTimeout(() => {
            clearInterval(updateTimer);
            this.addNextLetter();
        }, interval);
    }
    
    submitWord() {
        if (!this.isGameRunning) return;
        
        const word = this.wordInput.value.toUpperCase();
        const input = this.wordInput;
        
        if (word.length < GAME_CONFIG.MIN_WORD_LENGTH) {
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
            return;
        }
        
        const availableLetters = this.currentLetters.map(letterObj => letterObj.letter);
        if (!canFormWord(word, availableLetters)) {
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
            return;
        }
        
        // Remove used letters
        const wordLetters = word.split('');
        wordLetters.forEach(letter => {
            const index = this.currentLetters.findIndex(letterObj => letterObj.letter === letter);
            if (index !== -1) {
                this.currentLetters[index].element.remove();
                this.currentLetters.splice(index, 1);
            }
        });

        // Validate word and update score
        const basePoints = calculateWordPoints(word);
        if (dictionary.isValidWord(word)) {
            const multiplier = WORD_LENGTH_MULTIPLIERS[word.length] || 1;
            const finalPoints = multiplier === 1.5 ? 
                Math.ceil(basePoints * multiplier) : 
                basePoints * multiplier;
            this.score += finalPoints;
            
            // Show multiplier feedback
            input.classList.add('valid-flash');
            setTimeout(() => input.classList.remove('valid-flash'), 500);
            
            // Update score display with multiplier info if applicable
            if (multiplier > 1) {
                this.scoreDisplay.textContent = `${this.score} (${basePoints} × ${multiplier})`;
                setTimeout(() => this.scoreDisplay.textContent = this.score, 2000);
            } else {
                this.scoreDisplay.textContent = this.score;
            }
        } else {
            this.score -= basePoints; // Subtract base points for invalid words
            input.classList.add('invalid-flash');
            setTimeout(() => input.classList.remove('invalid-flash'), 500);
            this.scoreDisplay.textContent = this.score;
        }
        
        // Clear input
        this.wordInput.value = '';
        
        // First ensure minimum letters (4)
        while (this.currentLetters.length < GAME_CONFIG.MIN_LETTERS && 
               this.letterSequence.length > 0) {
            this.addNextLetter();
        }

        // Then ensure we have a working set (5) if possible
        if (this.currentLetters.length === GAME_CONFIG.MIN_LETTERS && 
            this.letterSequence.length > 0) {
            this.addNextLetter(); // Gets us to 5
        }
    }
    
    endGame() {
        this.isGameRunning = false;
        this.startButton.disabled = false;
        
        if (this.nextLetterTimer) {
            clearTimeout(this.nextLetterTimer);
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        alert(`Game Over! Final Score: ${this.score}`);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WordyGame();
});

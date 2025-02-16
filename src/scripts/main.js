import { GAME_CONFIG, VISUAL_STATES } from './constants.js';
import { generateLetterSequence, createLetterElement, calculateWordPoints, canFormWord } from './letters.js';

class WordyGame {
    constructor() {
        this.letterSequence = [];
        this.currentLetters = []; // Now stores letter objects instead of just strings
        this.score = 0;
        this.isGameRunning = false;
        this.nextLetterTimer = null;
        this.updateInterval = null;
        
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
    }
    
    startGame() {
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
    }
    
    startLetterStateUpdates() {
        this.updateInterval = setInterval(() => {
            if (this.isGameRunning && this.currentLetters.length === GAME_CONFIG.MAX_LETTERS) {
                const currentTime = Date.now();
                
                // Find the oldest letter
                let oldestLetter = this.currentLetters[0];
                let oldestAge = currentTime - oldestLetter.timestamp;
                
                for (let i = 1; i < this.currentLetters.length; i++) {
                    const age = currentTime - this.currentLetters[i].timestamp;
                    if (age > oldestAge) {
                        oldestAge = age;
                        oldestLetter = this.currentLetters[i];
                    }
                }
                
                // Update oldest letter's state
                if (oldestAge >= GAME_CONFIG.LETTER_AGE_DANGER) {
                    // Remove the letter if it's reached danger age
                    const index = this.currentLetters.indexOf(oldestLetter);
                    oldestLetter.element.remove();
                    this.currentLetters.splice(index, 1);
                    
                    // Schedule next letter drop
                    if (this.letterSequence.length > 0) {
                        this.scheduleNextLetter(GAME_CONFIG.LETTER_DROP_INTERVAL);
                    }
                } else if (oldestAge >= GAME_CONFIG.LETTER_AGE_WARNING) {
                    // Only update the oldest letter's state
                    oldestLetter.element.className = `letter ${VISUAL_STATES.WARNING}`;
                    oldestLetter.element.dataset.age = Math.floor(oldestAge / 1000) + 's';
                } else {
                    // Reset the oldest letter to normal if not yet warning age
                    oldestLetter.element.className = 'letter';
                    oldestLetter.element.dataset.age = Math.floor(oldestAge / 1000) + 's';
                }
            }
        }, 1000); // Update every second
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
    }
    
    addNextLetter() {
        if (!this.isGameRunning || this.letterSequence.length === 0) {
            return;
        }
        
        const nextLetter = this.letterSequence.shift();
        const letterObj = createLetterElement(nextLetter);
        this.currentLetters.push(letterObj);
        this.letterTray.appendChild(letterObj.element);
        
        if (this.letterSequence.length > 0) {
            // If we just added the 7th letter, don't schedule next letter
            // The next letter will be scheduled after the oldest letter is removed
            if (this.currentLetters.length < GAME_CONFIG.MAX_LETTERS) {
                this.scheduleNextLetter(GAME_CONFIG.LETTER_DROP_INTERVAL);
            }
        } else {
            this.endGame();
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
        
        if (word.length < GAME_CONFIG.MIN_WORD_LENGTH) {
            alert('Word must be at least 3 letters long!');
            return;
        }
        
        const availableLetters = this.currentLetters.map(letterObj => letterObj.letter);
        if (!canFormWord(word, availableLetters)) {
            alert('Cannot form this word with available letters!');
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
        
        // Update score
        const points = calculateWordPoints(word);
        this.score += points;
        this.scoreDisplay.textContent = this.score;
        
        // Clear input
        this.wordInput.value = '';
        
        // Ensure minimum letters
        while (this.currentLetters.length < GAME_CONFIG.MIN_LETTERS && 
               this.letterSequence.length > 0) {
            this.addNextLetter();
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

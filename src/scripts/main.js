import { GAME_CONFIG } from './constants.js';
import { generateLetterSequence, createLetterElement, calculateWordPoints, canFormWord } from './letters.js';

class WordyGame {
    constructor() {
        this.letterSequence = [];
        this.currentLetters = [];
        this.score = 0;
        this.isGameRunning = false;
        
        // DOM elements
        this.letterTray = document.getElementById('letter-tray');
        this.wordInput = document.getElementById('word-input');
        this.submitButton = document.getElementById('submit-word');
        this.startButton = document.getElementById('start-game');
        this.resetButton = document.getElementById('reset-game');
        this.scoreDisplay = document.getElementById('score');
        
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
        this.wordInput.focus(); // Focus input field for immediate typing
        this.addNextLetter();
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
    }
    
    addNextLetter() {
        if (!this.isGameRunning || this.letterSequence.length === 0) {
            return;
        }
        
        if (this.currentLetters.length >= GAME_CONFIG.MAX_LETTERS) {
            setTimeout(() => this.addNextLetter(), GAME_CONFIG.FULL_TRAY_DROP_INTERVAL);
            return;
        }
        
        const nextLetter = this.letterSequence.shift();
        this.currentLetters.push(nextLetter);
        
        const letterElement = createLetterElement(nextLetter);
        this.letterTray.appendChild(letterElement);
        
        if (this.letterSequence.length > 0) {
            setTimeout(() => this.addNextLetter(), GAME_CONFIG.LETTER_DROP_INTERVAL);
        } else {
            this.endGame();
        }
    }
    
    submitWord() {
        if (!this.isGameRunning) return;
        
        const word = this.wordInput.value.toUpperCase();
        
        if (word.length < GAME_CONFIG.MIN_WORD_LENGTH) {
            alert('Word must be at least 3 letters long!');
            return;
        }
        
        if (!canFormWord(word, this.currentLetters)) {
            alert('Cannot form this word with available letters!');
            return;
        }
        
        // Remove used letters
        const wordLetters = word.split('');
        wordLetters.forEach(letter => {
            const index = this.currentLetters.indexOf(letter);
            if (index !== -1) {
                this.currentLetters.splice(index, 1);
            }
        });
        
        // Update score
        const points = calculateWordPoints(word);
        this.score += points;
        this.scoreDisplay.textContent = this.score;
        
        // Clear input and update letter tray
        this.wordInput.value = '';
        this.letterTray.innerHTML = '';
        this.currentLetters.forEach(letter => {
            this.letterTray.appendChild(createLetterElement(letter));
        });
        
        // Ensure minimum letters
        while (this.currentLetters.length < GAME_CONFIG.MIN_LETTERS && this.letterSequence.length > 0) {
            this.addNextLetter();
        }
    }
    
    endGame() {
        this.isGameRunning = false;
        this.startButton.disabled = false;
        alert(`Game Over! Final Score: ${this.score}`);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WordyGame();
});

import { GAME_CONFIG, VISUAL_STATES, WORD_LENGTH_MULTIPLIERS, LETTER_POINTS, LETTER_POINT_COLORS, GAME_STATES, MULTIPLIER_CONFIG } from './constants.js';
import { generateLetterSequence, createLetterElement, calculateWordPoints, canFormWord } from './letters.js';
import { dictionary } from './dictionary.js';
import { saveGameResults, getTodayLetterSequence, getYesterdayTopGames, getTodayTopGames, getGameResults } from './api.js';

class GameHistory {
    constructor() {
        this.events = [];
        this.validPoints = 0;
        this.invalidPoints = 0;
        this.dropPoints = 0;
    }

    addEvent(type, details) {
        const event = {
            type,
            details,
            timestamp: new Date()
        };
        this.events.push(event);
        this.updatePoints(event);
        this.updateRecentEvents();
    }

    updatePoints(event) {
        if (event.type === 'valid') {
            this.validPoints += event.details.finalPoints;
        } else if (event.type === 'invalid') {
            this.invalidPoints += Math.abs(event.details.points);
        } else if (event.type === 'drop') {
            this.dropPoints += Math.abs(event.details.points);
        }
    }

    updateRecentEvents() {
        const recentEventsDiv = document.getElementById('recent-events');
        const lastFiveEvents = this.events.slice(-5).reverse();
        
        recentEventsDiv.innerHTML = lastFiveEvents.map(event => {
            let icon, details, pointsClass;
            
            switch (event.type) {
                case 'valid':
                    icon = '✓';
                    details = `${event.details.word}: ${event.details.basePoints} × ${event.details.lengthMultiplier} × ${event.details.streakMultiplier} = ${event.details.finalPoints}`;
                    pointsClass = 'positive';
                    break;
                case 'invalid':
                    icon = '✗';
                    details = `${event.details.word}: Invalid (-${Math.abs(event.details.points)})`;
                    pointsClass = 'negative';
                    break;
                case 'drop':
                    icon = '↓';
                    details = `${event.details.letter}(-${Math.abs(event.details.points)})`;
                    pointsClass = 'negative';
                    break;
            }
            
            return `
                <div class="history-event">
                    <span class="event-icon ${event.type}">${icon}</span>
                    <span class="event-details">${details}</span>
                    <span class="event-points ${pointsClass}"></span>
                </div>
            `;
        }).join('');
    }

    updateGameOverHistory() {
        const completeHistoryDiv = document.getElementById('complete-history');
        
        completeHistoryDiv.innerHTML = this.events.map((event, index) => {
            let icon, details;
            
            switch (event.type) {
                case 'valid':
                    icon = '✓';
                    details = `${event.details.word}: ${event.details.basePoints} × ${event.details.lengthMultiplier} × ${event.details.streakMultiplier} = ${event.details.finalPoints}`;
                    break;
                case 'invalid':
                    icon = '✗';
                    details = `${event.details.word}: Invalid (-${Math.abs(event.details.points)})`;
                    break;
                case 'drop':
                    icon = '↓';
                    details = `${event.details.letter}(-${Math.abs(event.details.points)})`;
                    break;
            }
            
            return `
                <div class="history-event">
                    <span class="event-icon ${event.type}">${icon}</span>
                    <span class="event-details">${index + 1}. ${details}</span>
                </div>
            `;
        }).join('');

        // Update points breakdown
        document.getElementById('valid-points').textContent = this.validPoints;
        document.getElementById('invalid-points').textContent = this.invalidPoints;
        document.getElementById('drop-points').textContent = this.dropPoints;
    }
}

class WordyGame {
    constructor() {
        this.letterSequence = [];
        this.currentLetters = [];
        this.score = 0;
        this.gameState = GAME_STATES.IDLE;
        this.nextLetterTimer = null;
        this.updateInterval = null;
        this.fullTrayTimestamp = null;
        this.playerInitials = '';
        this.bestWord = { word: '', score: 0 };
        this.history = new GameHistory();
        this.currentMultiplier = MULTIPLIER_CONFIG.BASE;
        this.processingWord = false; // Flag to track if a word is being processed
        this.letterSequenceId = null; // Store the ID of the letter sequence being played
        this.selectedLetters = []; // Array to track selected letter objects
        
        // DOM elements
        this.letterTray = document.getElementById('letter-tray');
        this.wordInput = document.getElementById('word-input');
        this.submitButton = document.getElementById('submit-word');
        this.startButton = document.getElementById('start-game');
        this.resetButton = document.getElementById('reset-game');
        this.scoreDisplay = document.getElementById('score');
        this.timerDisplay = document.getElementById('next-letter-timer');
        this.nextLetterPreview = document.getElementById('next-letter-preview');
        this.previewLetter = this.nextLetterPreview.querySelector('.next-letter');
        this.remainingCount = this.nextLetterPreview.querySelector('.remaining-count');
        this.multiplierDisplay = document.getElementById('current-multiplier');
        
        // Modal elements
        this.initialsModal = document.getElementById('initials-modal');
        this.initialsInput = document.getElementById('initials-input');
        this.submitInitialsButton = document.getElementById('submit-initials');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.finalInitialsDisplay = document.getElementById('final-initials');
        this.finalScoreDisplay = document.getElementById('final-score');
        this.bestWordDisplay = document.getElementById('best-word');
        this.bestWordScoreDisplay = document.getElementById('best-word-score');
        this.closeGameOverButton = document.getElementById('close-game-over');
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        this.startButton.addEventListener('click', () => {
            this.gameState = GAME_STATES.INITIALS_INPUT;
            this.initialsModal.classList.remove('hidden');
            this.initialsInput.focus();
        });

        this.submitButton.addEventListener('click', () => this.submitWord());
        
        this.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitWord();
            }
        });

        // Auto-capitalize input and prevent non-letter characters
        this.wordInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
            // Synchronize letter selection with input
            this.syncLetterSelectionWithInput(e.target.value);
        });

        // Handle special keys like backspace
        this.wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                // Let the default behavior happen first, then sync
                setTimeout(() => {
                    this.syncLetterSelectionWithInput(this.wordInput.value);
                }, 0);
            }
        });

        // Add click handler for letter selection
        this.letterTray.addEventListener('click', (e) => {
            if (e.target.classList.contains('letter')) {
                this.toggleLetterSelection(e.target);
            }
        });

        // Initials input handling
        this.initialsInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        });

        this.submitInitialsButton.addEventListener('click', () => {
            const initials = this.initialsInput.value.toUpperCase();
            if (initials.length === 3) {
                this.playerInitials = initials;
                this.initialsModal.classList.add('hidden');
                this.startGameFlow();
            }
        });

        this.initialsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.initialsInput.value.length === 3) {
                this.playerInitials = this.initialsInput.value.toUpperCase();
                this.initialsModal.classList.add('hidden');
                this.startGameFlow();
            }
        });

        this.closeGameOverButton.addEventListener('click', () => {
            this.gameOverModal.classList.add('hidden');
        });
    }

    toggleLetterSelection(letterElement) {
        if (this.gameState !== GAME_STATES.PLAYING) return;
        
        const letterIndex = this.currentLetters.findIndex(l => l.element === letterElement);
        if (letterIndex === -1) return;
        
        const letterObj = this.currentLetters[letterIndex];
        
        // Toggle selection state
        letterObj.selected = !letterObj.selected;
        letterElement.dataset.selected = letterObj.selected.toString();
        
        if (letterObj.selected) {
            // Add to selected letters
            this.selectedLetters.push(letterObj);
            letterElement.classList.add('selected');
        } else {
            // Remove from selected letters
            const selectedIndex = this.selectedLetters.indexOf(letterObj);
            if (selectedIndex !== -1) {
                this.selectedLetters.splice(selectedIndex, 1);
            }
            letterElement.classList.remove('selected');
        }
        
        // Update input field to reflect selected letters
        this.updateWordInputFromSelection();
    }

    updateWordInputFromSelection() {
        // Create word from selected letters
        const word = this.selectedLetters.map(l => l.letter).join('');
        this.wordInput.value = word;
    }

    syncLetterSelectionWithInput(inputValue) {
        // Clear all selections first
        this.clearAllLetterSelections();
        
        // If input is empty, we're done
        if (!inputValue) return;
        
        // Create a copy of available letters to work with
        const availableLetters = [...this.currentLetters];
        const inputLetters = inputValue.toUpperCase().split('');
        
        // Try to select letters in the order they appear in the input
        for (const inputLetter of inputLetters) {
            // Find the first available letter matching the input letter
            const letterIndex = availableLetters.findIndex(l => 
                l.letter === inputLetter && !l.selected);
            
            if (letterIndex !== -1) {
                // Select this letter
                const letterObj = availableLetters[letterIndex];
                letterObj.selected = true;
                letterObj.element.dataset.selected = 'true';
                letterObj.element.classList.add('selected');
                this.selectedLetters.push(letterObj);
                
                // Remove from available pool to prevent reuse
                availableLetters.splice(letterIndex, 1);
            }
        }
    }

    clearAllLetterSelections() {
        // Clear all letter selections
        this.currentLetters.forEach(letterObj => {
            letterObj.selected = false;
            letterObj.element.dataset.selected = 'false';
            letterObj.element.classList.remove('selected');
        });
        this.selectedLetters = [];
    }

    updateNextLetterPreview() {
        this.previewLetter.textContent = this.letterSequence.length > 0 ? this.letterSequence[0] : '';
        this.remainingCount.textContent = this.letterSequence.length > 0 ? 
            `(${this.letterSequence.length} left)` : '';
    }
    
    async startGameFlow() {
        this.gameState = GAME_STATES.LOADING;
        
        // Show loading overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingError = loadingOverlay.querySelector('.loading-error');
        loadingOverlay.classList.remove('hidden');
        loadingError.classList.add('hidden');

        try {
            // Initialize dictionary
            const success = await dictionary.initialize();
            if (!success) {
                throw new Error(dictionary.error || 'Dictionary failed to initialize');
            }

            // Get today's letter sequence (based on US Central Time)
            try {
                const sequenceData = await getTodayLetterSequence();
                this.letterSequence = sequenceData.letters;
                this.letterSequenceId = sequenceData.sequenceId;
            } catch (error) {
                throw new Error('No letter sequence available for today. Please try again tomorrow.');
            }

            this.gameState = GAME_STATES.PLAYING;
            this.startButton.style.display = 'none'; // Hide the start button completely
            this.wordInput.focus();
            
            // Update next letter preview
            this.updateNextLetterPreview();
            
            // Start letter state updates
            this.startLetterStateUpdates();
            
            // Add initial minimum letters
            while (this.currentLetters.length < GAME_CONFIG.MIN_LETTERS && 
                   this.letterSequence.length > 0) {
                this.addNextLetter();
            }
        } catch (error) {
            this.gameState = GAME_STATES.ERROR;
            loadingError.textContent = error.message || 'Failed to start game';
            loadingError.classList.remove('hidden');
            return;
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    }
    
    startLetterStateUpdates() {
        this.updateInterval = setInterval(() => {
            if (this.gameState !== GAME_STATES.PLAYING) return;

            // Check if we should end the game (no more letters in sequence and tray is empty)
            // Only end the game if we're not currently processing a word
            if (this.letterSequence.length === 0 && this.currentLetters.length === 0 && !this.processingWord) {
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
                    // Subtract points for the dropped letter
                    const letterPoints = LETTER_POINTS[oldestLetter.letter];
                    this.score -= letterPoints;
                    this.scoreDisplay.textContent = this.score;
                    
                    // Check if the letter is selected and remove it from selection
                    const selectedIndex = this.selectedLetters.indexOf(oldestLetter);
                    if (selectedIndex !== -1) {
                        this.selectedLetters.splice(selectedIndex, 1);
                        // Update the input field to reflect the new selection
                        this.updateWordInputFromSelection();
                    }
                    
                    oldestLetter.element.remove();
                    this.currentLetters.splice(index, 1);
                    this.fullTrayTimestamp = null;

                    // Add drop event to history
                    this.history.addEvent('drop', {
                        letter: oldestLetter.letter,
                        points: letterPoints
                    });

                    // Reset consecutive multiplier
                    this.currentMultiplier = MULTIPLIER_CONFIG.BASE;
        this.multiplierDisplay.textContent = this.currentMultiplier.toFixed(2);
                    
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
                    oldestLetter.element.classList.remove('danger');
                    oldestLetter.element.classList.add('warning');
                    oldestLetter.visualState = VISUAL_STATES.WARNING;
                    oldestLetter.element.dataset.age = remainingTime + 's';
                } else {
                    // Normal state with countdown
                    oldestLetter.element.classList.remove('warning', 'danger');
                    oldestLetter.visualState = VISUAL_STATES.NORMAL;
                    oldestLetter.element.dataset.age = remainingTime + 's';
                }
            } else {
                // Reset fullTrayTimestamp when we're not in an aging state
                this.fullTrayTimestamp = null;
            }
        }, 100); // Update every 100ms for smoother countdown
    }
    
    resetGame() {
        this.gameState = GAME_STATES.IDLE;
        this.letterSequence = [];
        this.currentLetters = [];
        this.selectedLetters = []; // Clear selected letters
        this.score = 0;
        this.bestWord = { word: '', score: 0 };
        this.currentMultiplier = MULTIPLIER_CONFIG.BASE;
        this.history = new GameHistory();
        this.scoreDisplay.textContent = '0';
            this.multiplierDisplay.textContent = this.currentMultiplier.toFixed(2);
        this.letterTray.innerHTML = '';
        this.wordInput.value = '';
        // Don't re-enable the start button
        this.timerDisplay.textContent = '0';
        this.previewLetter.textContent = '';
        this.remainingCount.textContent = '';
        
        if (this.nextLetterTimer) {
            clearTimeout(this.nextLetterTimer);
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Clear history displays
        document.getElementById('recent-events').innerHTML = '';
        document.getElementById('complete-history').innerHTML = '';
    }
    
    addNextLetter() {
        if (this.gameState !== GAME_STATES.PLAYING) {
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
        
        // Update the next letter preview and remaining count
        this.updateNextLetterPreview();
        
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
    
    async submitWord() {
        if (this.gameState !== GAME_STATES.PLAYING) return;
        
        this.processingWord = true; // Set flag to indicate word processing has started
        
        const word = this.wordInput.value.toUpperCase();
        const input = this.wordInput;
        
        if (word.length < GAME_CONFIG.MIN_WORD_LENGTH) {
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
            this.processingWord = false;
            return;
        }
        
        const availableLetters = this.currentLetters.map(letterObj => letterObj.letter);
        if (!canFormWord(word, availableLetters)) {
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
            this.processingWord = false;
            return;
        }
        
        // Get the selected letters or find them if typed
        if (this.selectedLetters.length === 0) {
            this.syncLetterSelectionWithInput(word);
        }
        
        // Remove used letters (using selected letters)
        const usedLetters = [...this.selectedLetters];
        usedLetters.forEach(letterObj => {
            const index = this.currentLetters.indexOf(letterObj);
            if (index !== -1) {
                letterObj.element.remove();
                this.currentLetters.splice(index, 1);
            }
        });
        
        // Clear selected letters
        this.selectedLetters = [];

        // Validate word and update score
        const basePoints = calculateWordPoints(word);
        
        // Show loading indicator
        input.classList.add('validating');
        
        try {
            const isValid = await dictionary.isValidWord(word);
            
            if (isValid) {
                const lengthMultiplier = WORD_LENGTH_MULTIPLIERS[word.length] || 1;
                const streakMultiplier = Math.min(this.currentMultiplier, MULTIPLIER_CONFIG.MAX);
                const combinedMultiplier = lengthMultiplier * streakMultiplier;
                const finalPoints = Math.ceil(basePoints * combinedMultiplier);
                
                this.score += finalPoints;

                // Add valid word event to history
                this.history.addEvent('valid', {
                    word,
                    basePoints,
                    lengthMultiplier,
                    streakMultiplier,
                    finalPoints
                });

                // Update consecutive multiplier
                this.currentMultiplier = Math.min(
                    this.currentMultiplier + MULTIPLIER_CONFIG.INCREMENT,
                    MULTIPLIER_CONFIG.MAX
                );
                this.multiplierDisplay.textContent = this.currentMultiplier.toFixed(2);

                // Update best word if current word has higher score
                if (finalPoints > this.bestWord.score) {
                    this.bestWord = { word: word, score: finalPoints };
                }
                
                // Show multiplier feedback
                input.classList.add('valid-flash');
                setTimeout(() => input.classList.remove('valid-flash'), 500);
                
                // Update score display
                this.scoreDisplay.textContent = this.score;
            } else {
                this.score -= basePoints;
                
                // Add invalid word event to history
                this.history.addEvent('invalid', {
                    word,
                    points: basePoints
                });

                // Reset consecutive multiplier
                this.currentMultiplier = MULTIPLIER_CONFIG.BASE;
                this.multiplierDisplay.textContent = this.currentMultiplier.toFixed(2);

                input.classList.add('invalid-flash');
                setTimeout(() => input.classList.remove('invalid-flash'), 500);
                this.scoreDisplay.textContent = this.score;
            }
        } catch (error) {
            console.error("Error in word validation:", error);
            // Show error message to user
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.textContent = 'Dictionary connection error. Please try again.';
                errorMessage.classList.remove('hidden');
                setTimeout(() => errorMessage.classList.add('hidden'), 3000);
            }
            
            // Return the letters to the tray since we couldn't validate
            this.returnLettersToTray(word.split(''));
        } finally {
            // Remove loading indicator
            input.classList.remove('validating');
            
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
            
            // Set a small timeout to ensure history is fully updated before allowing the game to end
            setTimeout(() => {
                this.processingWord = false; // Reset the processing flag
            }, 100);
        }
    }
    
    // Helper method to return letters to the tray if validation fails
    returnLettersToTray(letters) {
        letters.forEach(letter => {
            const letterObj = createLetterElement(letter);
            this.currentLetters.push(letterObj);
            this.letterTray.appendChild(letterObj.element);
        });
    }
    
    async endGame() {
        this.gameState = GAME_STATES.GAME_OVER;
        // Keep the start button hidden (don't re-enable it)
        
        if (this.nextLetterTimer) {
            clearTimeout(this.nextLetterTimer);
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Create game results object
        const gameResults = {
            playerInitials: this.playerInitials,
            score: this.score,
            bestWord: this.bestWord,
            history: {
                events: this.history.events,
                validPoints: this.history.validPoints,
                invalidPoints: this.history.invalidPoints,
                dropPoints: this.history.dropPoints
            },
            letterSequenceId: this.letterSequenceId
        };
        
        // Save to MongoDB and get the gameId
        try {
            const response = await saveGameResults(gameResults);
            
            if (response.success) {
                // Open results page in a new tab with gameId as URL parameter
                window.open(`game-results.html?gameId=${response.gameId}`, '_blank');
            } else {
                console.error('Failed to save game to server:', response);
                // If server save fails, still open results page but it will show an error
                window.open('game-results.html', '_blank');
            }
        } catch (error) {
            console.error('Failed to save game to server:', error);
            // If server save fails, still open results page but it will show an error
            window.open('game-results.html', '_blank');
        }
        
        // Keep the modal code for backward compatibility, but don't show it
        // Update game over modal (hidden)
        this.finalInitialsDisplay.textContent = this.playerInitials;
        this.finalScoreDisplay.textContent = this.score;
        this.bestWordDisplay.textContent = this.bestWord.word || 'None';
        this.bestWordScoreDisplay.textContent = this.bestWord.score;
        
        // Update complete history (hidden)
        this.history.updateGameOverHistory();
    }
}

/**
 * Load and display yesterday's top games in a pinball-style format
 */
async function loadYesterdayTopGames() {
    const topGamesList = document.getElementById('yesterday-top-games-list');
    
    try {
        // Fetch yesterday's top games from the server
        const topGames = await getYesterdayTopGames();
        
        if (topGames.length === 0) {
            topGamesList.innerHTML = '<p>No games were played yesterday.</p>';
            return;
        }
        
        // Display the list of top games (limited to 10)
        const topTenGames = topGames.slice(0, 10);
        topGamesList.innerHTML = topTenGames.map((game, index) => {
            return `
                <div class="score-item" data-game-id="${game.gameId}">
                    <span class="score-item-rank">${index + 1}.</span>
                    <span class="score-item-initials">${game.playerInitials}</span>
                    <span class="score-item-score">${game.score}</span>
                </div>
            `;
        }).join('');
        
        // Add click event listeners to game items
        document.querySelectorAll('.yesterday-scores .score-item').forEach(item => {
            item.addEventListener('click', async () => {
                const gameId = item.dataset.gameId;
                
                try {
                    // Fetch the game details
                    const gameDetails = await getGameResults(gameId);
                    
                    // Populate the modal with game details
                    document.getElementById('modal-player-initials').textContent = gameDetails.playerInitials;
                    document.getElementById('modal-final-score').textContent = gameDetails.score;
                    document.getElementById('modal-best-word').textContent = gameDetails.bestWord.word || 'None';
                    document.getElementById('modal-best-word-score').textContent = gameDetails.bestWord.score;
                    
                    // Populate game history
                    const gameHistoryDiv = document.getElementById('modal-game-history');
                    gameHistoryDiv.innerHTML = gameDetails.history.events.map((event, index) => {
                        let icon, details;
                        
                        switch (event.type) {
                            case 'valid':
                                icon = '✓';
                                details = `${event.details.word}: ${event.details.basePoints} × ${event.details.lengthMultiplier} × ${event.details.streakMultiplier} = ${event.details.finalPoints}`;
                                break;
                            case 'invalid':
                                icon = '✗';
                                details = `${event.details.word}: Invalid (-${Math.abs(event.details.points)})`;
                                break;
                            case 'drop':
                                icon = '↓';
                                details = `${event.details.letter}(-${Math.abs(event.details.points)})`;
                                break;
                        }
                        
                        return `
                            <div class="history-event">
                                <span class="event-icon ${event.type}">${icon}</span>
                                <span class="event-details">${index + 1}. ${details}</span>
                            </div>
                        `;
                    }).join('');
                    
                    // Update points breakdown
                    document.getElementById('modal-valid-points').textContent = gameDetails.history.validPoints;
                    document.getElementById('modal-invalid-points').textContent = gameDetails.history.invalidPoints;
                    document.getElementById('modal-drop-points').textContent = gameDetails.history.dropPoints;
                    
                    // Show the modal
                    document.getElementById('game-details-modal').classList.remove('hidden');
                    
                } catch (error) {
                    console.error('Error loading game details:', error);
                    alert('Failed to load game details. Please try again later.');
                }
            });
        });
    } catch (error) {
        console.error('Error loading top games for yesterday:', error);
        topGamesList.innerHTML = '<p>Failed to load top games for yesterday.</p>';
    }
}

/**
 * Load and display today's top games in a pinball-style format
 */
async function loadTodayTopGames() {
    const topGamesList = document.getElementById('today-top-games-list');
    
    try {
        // Fetch today's top games from the server
        const topGames = await getTodayTopGames();
        
        if (topGames.length === 0) {
            topGamesList.innerHTML = '<p>No games played today yet.</p>';
            return;
        }
        
        // Display the list of top games (limited to 10)
        const topTenGames = topGames.slice(0, 10);
        topGamesList.innerHTML = topTenGames.map((game, index) => {
            return `
                <div class="score-item">
                    <span class="score-item-rank">${index + 1}.</span>
                    <span class="score-item-initials">${game.playerInitials}</span>
                    <span class="score-item-score">${game.score}</span>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading top games for today:', error);
        topGamesList.innerHTML = '<p>Failed to load top games for today.</p>';
    }
}

// Initialize game and load top scores when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WordyGame();
    
    // Load top scores
    loadYesterdayTopGames();
    loadTodayTopGames();
    
    // Add event listener for the close button of the game details modal
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('game-details-modal').classList.add('hidden');
    });
});

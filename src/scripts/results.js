/**
 * Wordy3 Game Results Page Script
 * Loads and displays game results from MongoDB
 */
import { getGameResults, getTodayTopGames } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check if we have a gameId from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');
    
    // Load the current game (either from URL or the most recent one)
    const currentGame = await loadGameResults(gameId);
    
    // Display the current game in the "Your Game" section
    displayCurrentGame(currentGame);
    
    // Fetch and display today's top games
    await loadTodayTopGames(gameId, currentGame);
    
    // Set up button event listeners
    document.getElementById('share-results').addEventListener('click', () => {
        // Get the currently displayed game ID
        const currentGameId = document.querySelector('.game-item.active')?.dataset.gameId || gameId;
        
        // Get today's date in MM/DD/YYYY format
        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        
        // Get the best word and censor all but the first two letters
        const bestWord = document.getElementById('best-word').textContent;
        const bestWordScore = document.getElementById('best-word-score').textContent;
        const playerScore = document.getElementById('final-score').textContent;
        
        // Show only first two letters, replace the rest with lock emojis
        let censoredWord = '';
        if (bestWord && bestWord !== 'None') {
            const firstTwoLetters = bestWord.substring(0, 2);
            const remainingLetters = bestWord.length > 2 ? bestWord.substring(2) : '';
            const lockEmojis = '🔒'.repeat(remainingLetters.length);
            censoredWord = firstTwoLetters + lockEmojis;
        } else {
            censoredWord = 'None';
        }
        
        // Create shareable text with gameId for direct access in multi-line format with emojis
        const shareText = 
`🎮 Wordy3 - ${formattedDate} 🎮
📊 Score: ${playerScore} points
🔤 Top word: ${censoredWord} (${bestWordScore} points)
🏆 Play now: ${window.location.origin}`;
        
        // Check if Web Share API is available
        if (navigator.share) {
            // Try to share with Twitter first
            const twitterShareOptions = {
                title: 'My Wordy3 Game Results',
                text: shareText + ' #Wordy3Game #WordGame',
                url: `${window.location.origin}`
            };
            
            // Try Facebook-specific sharing if available
            const facebookShareOptions = {
                title: 'My Wordy3 Game Results',
                text: shareText,
                url: `${window.location.origin}`
            };
            
            // Cascading share approach
            if (navigator.canShare && navigator.canShare(twitterShareOptions)) {
                navigator.share(twitterShareOptions)
                    .catch(error => {
                        console.log('Error sharing to Twitter:', error);
                        // Try Facebook next
                        if (navigator.canShare(facebookShareOptions)) {
                            navigator.share(facebookShareOptions)
                                .catch(error => {
                                    console.log('Error sharing to Facebook:', error);
                                    // Fall back to generic sharing
                                    navigator.share({
                                        title: 'My Wordy3 Game Results',
                                        text: shareText,
                                        url: `${window.location.origin}`
                                    }).catch(error => {
                                        console.log('Error sharing:', error);
                                        // Final fallback to clipboard
                                        copyToClipboard(shareText);
                                    });
                                });
                        } else {
                            // Fall back to generic sharing
                            navigator.share({
                                title: 'My Wordy3 Game Results',
                                text: shareText,
                                url: `${window.location.origin}`
                            }).catch(error => {
                                console.log('Error sharing:', error);
                                // Final fallback to clipboard
                                copyToClipboard(shareText);
                            });
                        }
                    });
            } else {
                // Fall back to generic sharing
                navigator.share({
                    title: 'My Wordy3 Game Results',
                    text: shareText,
                    url: `${window.location.origin}`
                }).catch(error => {
                    console.log('Error sharing:', error);
                    // Final fallback to clipboard
                    copyToClipboard(shareText);
                });
            }
        } else {
            // Fallback to clipboard
            copyToClipboard(shareText);
        }
    });
});


/**
 * Load and display game results
 * @param {string} gameId - The ID of the game to load
 * @returns {Object} - The loaded game results
 */
async function loadGameResults(gameId) {
    let gameResults;
    
    if (gameId) {
        try {
            // Fetch from server
            gameResults = await getGameResults(gameId);
        } catch (error) {
            console.error('Error fetching game from server:', error);
            showErrorMessage('Failed to load game results. Please try again later.');
            return;
        }
    } else {
        // If no gameId is provided, we'll fetch today's top games and use the first one
        try {
            const topGames = await getTodayTopGames();
            
            if (topGames.length > 0) {
                const mostRecentGameId = topGames[0].gameId;
                gameResults = await getGameResults(mostRecentGameId);
                
                // Update URL without reloading the page
                const url = new URL(window.location);
                url.searchParams.set('gameId', mostRecentGameId);
                window.history.pushState({}, '', url);
            } else {
                showNoResultsMessage();
                return;
            }
        } catch (error) {
            console.error('Error fetching top games:', error);
            showErrorMessage('Failed to load game results. Please try again later.');
            return;
        }
    }
    
    if (!gameResults) {
        showNoResultsMessage();
        return;
    }
    
    // Populate game stats
    document.getElementById('final-initials').textContent = gameResults.playerInitials;
    document.getElementById('final-score').textContent = gameResults.score;
    document.getElementById('best-word').textContent = gameResults.bestWord.word || 'None';
    document.getElementById('best-word-score').textContent = gameResults.bestWord.score;
    
    // Populate game history
    const completeHistoryDiv = document.getElementById('complete-history');
    
    completeHistoryDiv.innerHTML = gameResults.history.events.map((event, index) => {
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
    document.getElementById('valid-points').textContent = gameResults.history.validPoints;
    document.getElementById('invalid-points').textContent = gameResults.history.invalidPoints;
    document.getElementById('drop-points').textContent = gameResults.history.dropPoints;
    
    // Return the game results for use by other functions
    return gameResults;
}

/**
 * Helper function to copy text to clipboard
 */
function copyToClipboard(text) {
    // Try to use the modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                // Show feedback
                alert('Results copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                // Fall back to the older method
                fallbackCopyToClipboard(text);
            });
    } else {
        // Fall back to the older method for browsers that don't support clipboard API
        fallbackCopyToClipboard(text);
    }
}

/**
 * Fallback method for copying to clipboard
 */
function fallbackCopyToClipboard(text) {
    // Create temporary element
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    
    // Select and copy text
    el.select();
    document.execCommand('copy');
    
    // Remove temporary element
    document.body.removeChild(el);
    
    // Show feedback
    alert('Results copied to clipboard!');
}

/**
 * Show error message when game results can't be loaded
 */
function showErrorMessage(message) {
    document.querySelector('.results-container').innerHTML = `
        <div class="results-header">
            <h1>Error Loading Results</h1>
            <p>${message}</p>
            <div class="action-buttons">
                <button id="try-again">Try Again</button>
            </div>
        </div>
    `;
    
    document.getElementById('try-again').addEventListener('click', () => {
        window.location.reload();
    });
}

/**
 * Show message when no game results are found
 */
function showNoResultsMessage() {
    document.querySelector('.results-container').innerHTML = `
        <div class="results-header">
            <h1>No Game Results Found</h1>
            <p>It seems there are no recent game results to display.</p>
            <div class="action-buttons">
            </div>
        </div>
    `;
}

/**
 * Display the current game in the "Your Game" section
 * @param {Object} game - The current game to display
 */
function displayCurrentGame(game) {
    const currentGameDiv = document.getElementById('current-game');
    
    if (!game) {
        currentGameDiv.innerHTML = '<p>No game data available.</p>';
        return;
    }
    
    const date = new Date(game.playedAt);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    currentGameDiv.innerHTML = `
        <div class="game-item-details">
            <span>${game.playerInitials}</span>
            <span>Best: ${game.bestWord.word || 'None'} (${game.bestWord.score})</span>
        </div>
        <div class="game-item-info">
            <span class="game-item-score">${game.score} pts</span>
            <span class="game-item-date">${formattedDate}</span>
        </div>
    `;
    
    // Make the current game selectable
    currentGameDiv.dataset.gameId = game.gameId;
    currentGameDiv.classList.add('active');
    
    currentGameDiv.addEventListener('click', async () => {
        // Remove active class from all items
        document.querySelectorAll('.game-item').forEach(i => i.classList.remove('active'));
        
        // Add active class to clicked item
        currentGameDiv.classList.add('active');
        
        // Load the selected game
        await loadGameResults(game.gameId);
        
        // Update URL without reloading the page
        const url = new URL(window.location);
        url.searchParams.set('gameId', game.gameId);
        window.history.pushState({}, '', url);
    });
}

/**
 * Load and display today's top games
 * @param {string} currentGameId - The ID of the current game to highlight
 * @param {Object} currentGame - The current game object
 */
async function loadTodayTopGames(currentGameId, currentGame) {
    const topGamesList = document.getElementById('top-games-list');
    
    try {
        // Fetch today's top games from the server
        const topGames = await getTodayTopGames();
        
        if (topGames.length === 0) {
            topGamesList.innerHTML = '<p>No games played today yet.</p>';
            return;
        }
        
        // Check if the current game is in the top games list
        const currentGameInTopGames = topGames.some(game => game.gameId === currentGameId);
        
        // Display the list of top games
        topGamesList.innerHTML = topGames.map(game => {
            const date = new Date(game.playedAt);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Highlight the current game if it's in the top games list
            const isActive = game.gameId === currentGameId;
            
            return `
                <div class="game-item ${isActive ? 'active' : ''}" data-game-id="${game.gameId}">
                    <div class="game-item-details">
                        <span>${game.playerInitials}</span>
                        <span>Best: ${game.bestWord.word || 'None'} (${game.bestWord.score})</span>
                    </div>
                    <div class="game-item-info">
                        <span class="game-item-score">${game.score} pts</span>
                        <span class="game-item-date">${formattedDate}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click event listeners to game items
        document.querySelectorAll('.top-games-list .game-item').forEach(item => {
            item.addEventListener('click', async () => {
                // Remove active class from all items
                document.querySelectorAll('.game-item').forEach(i => i.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Load the selected game
                const gameId = item.dataset.gameId;
                await loadGameResults(gameId);
                
                // Update URL without reloading the page
                const url = new URL(window.location);
                url.searchParams.set('gameId', gameId);
                window.history.pushState({}, '', url);
            });
        });
    } catch (error) {
        console.error('Error loading top games for today:', error);
        topGamesList.innerHTML = '<p>Failed to load top games for today. Please try again later.</p>';
    }
}

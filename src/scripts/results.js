/**
 * Wordy3 Game Results Page Script
 * Loads and displays game results from MongoDB
 */
import { getGameResults, getRecentGames } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check if we have a gameId from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');
    
    // Fetch and display recent games
    await loadRecentGames(gameId);
    
    // Load the current game (either from URL or the most recent one)
    await loadGameResults(gameId);
    
    // Set up button event listeners
    document.getElementById('share-results').addEventListener('click', () => {
        // Get the currently displayed game ID
        const currentGameId = document.querySelector('.game-item.active')?.dataset.gameId || gameId;
        
        // Create shareable text with gameId for direct access
        const shareText = `I scored ${document.getElementById('final-score').textContent} points in Wordy3! My best word was "${document.getElementById('best-word').textContent}" for ${document.getElementById('best-word-score').textContent} points. Check it out: ${window.location.origin}/game-results.html?gameId=${currentGameId}`;
        
        // Check if Web Share API is available
        if (navigator.share) {
            navigator.share({
                title: 'My Wordy3 Game Results',
                text: shareText
            }).catch(error => {
                console.log('Error sharing:', error);
                // Fallback to clipboard
                copyToClipboard(shareText);
            });
        } else {
            // Fallback to clipboard
            copyToClipboard(shareText);
        }
    });
});

/**
 * Load and display recent games
 * @param {string} currentGameId - The ID of the current game to highlight
 */
async function loadRecentGames(currentGameId) {
    const recentGamesList = document.getElementById('recent-games-list');
    
    try {
        // Fetch recent games from the server
        const recentGames = await getRecentGames();
        
        if (recentGames.length === 0) {
            recentGamesList.innerHTML = '<p>No recent games found.</p>';
            return;
        }
        
        // If we don't have a current gameId, use the most recent one
        if (!currentGameId && recentGames.length > 0) {
            currentGameId = recentGames[0].gameId;
        }
        
        // Display the list of recent games
        recentGamesList.innerHTML = recentGames.map(game => {
            const date = new Date(game.playedAt);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
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
        document.querySelectorAll('.game-item').forEach(item => {
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
        console.error('Error loading recent games:', error);
        recentGamesList.innerHTML = '<p>Failed to load recent games. Please try again later.</p>';
    }
}

/**
 * Load and display game results
 * @param {string} gameId - The ID of the game to load
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
        // If no gameId is provided, we'll rely on the most recent game
        // which should be the first one in the recent games list
        const recentGamesList = document.getElementById('recent-games-list');
        const firstGame = recentGamesList.querySelector('.game-item');
        
        if (firstGame) {
            const mostRecentGameId = firstGame.dataset.gameId;
            try {
                gameResults = await getGameResults(mostRecentGameId);
                // Update URL without reloading the page
                const url = new URL(window.location);
                url.searchParams.set('gameId', mostRecentGameId);
                window.history.pushState({}, '', url);
            } catch (error) {
                console.error('Error fetching most recent game:', error);
                showErrorMessage('Failed to load recent game results. Please try again later.');
                return;
            }
        } else {
            showNoResultsMessage();
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

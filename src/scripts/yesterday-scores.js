/**
 * Wordy3 Yesterday's Top Scores Page Script
 * Loads and displays top scores from yesterday
 */
import { getGameResults, getYesterdayTopGames } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch and display yesterday's top games
    await loadYesterdayTopGames();
    
    // Add event listener for the close button
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('game-details-modal').classList.add('hidden');
    });
});

/**
 * Load and display yesterday's top games
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
        
        // Display the list of top games
        topGamesList.innerHTML = topGames.map(game => {
            const date = new Date(game.playedAt);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return `
                <div class="game-item" data-game-id="${game.gameId}">
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
        topGamesList.innerHTML = '<p>Failed to load top games for yesterday. Please try again later.</p>';
    }
}

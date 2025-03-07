/**
 * Wordy3 Game Results Page Script
 * Loads and displays game results from localStorage
 */

document.addEventListener('DOMContentLoaded', () => {
    // Load game results from localStorage
    const gameResults = JSON.parse(localStorage.getItem('wordy3_game_results'));
    
    if (!gameResults) {
        // Handle case where no results are found
        document.querySelector('.results-container').innerHTML = `
            <div class="results-header">
                <h1>No Game Results Found</h1>
                <p>It seems there are no recent game results to display.</p>
                <div class="action-buttons">
                    <button id="play-again">Play New Game</button>
                </div>
            </div>
        `;
        
        document.getElementById('play-again').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
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
    
    // Set up button event listeners
    document.getElementById('play-again').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    document.getElementById('share-results').addEventListener('click', () => {
        // Create shareable text
        const shareText = `I scored ${gameResults.score} points in Wordy3! My best word was "${gameResults.bestWord.word}" for ${gameResults.bestWord.score} points.`;
        
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
 * Helper function to copy text to clipboard
 */
function copyToClipboard(text) {
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

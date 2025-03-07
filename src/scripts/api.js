/**
 * API module for Wordy3 game
 * Handles communication with the server
 */

// Use environment variable if available, otherwise fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Save game results to the server
 * @param {Object} gameResults - The game results to save
 * @returns {Promise<Object>} - Response with gameId if successful
 */
export async function saveGameResults(gameResults) {
  try {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gameResults)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save game results');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving game results:', error);
    throw error;
  }
}

/**
 * Get game results by ID
 * @param {string} gameId - The ID of the game to retrieve
 * @returns {Promise<Object>} - The game results
 */
export async function getGameResults(gameId) {
  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to retrieve game results');
    }
    
    const data = await response.json();
    return data.game;
  } catch (error) {
    console.error('Error retrieving game results:', error);
    throw error;
  }
}

/**
 * Get recent games (limited to 10)
 * @returns {Promise<Array>} - Array of recent game summaries
 */
export async function getRecentGames() {
  try {
    const response = await fetch(`${API_BASE_URL}/games`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to retrieve recent games');
    }
    
    const data = await response.json();
    return data.games;
  } catch (error) {
    console.error('Error retrieving recent games:', error);
    throw error;
  }
}

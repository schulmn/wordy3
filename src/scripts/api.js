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

/**
 * Get top games for today (limited to 10)
 * @returns {Promise<Array>} - Array of today's top game summaries
 */
export async function getTodayTopGames() {
  try {
    const response = await fetch(`${API_BASE_URL}/games/today/top`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to retrieve top games for today');
    }
    
    const data = await response.json();
    return data.games;
  } catch (error) {
    console.error('Error retrieving top games for today:', error);
    throw error;
  }
}

/**
 * Get top games for yesterday (limited to 20)
 * @returns {Promise<Array>} - Array of yesterday's top game summaries
 */
export async function getYesterdayTopGames() {
  try {
    const response = await fetch(`${API_BASE_URL}/games/yesterday/top`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to retrieve top games for yesterday');
    }
    
    const data = await response.json();
    return data.games;
  } catch (error) {
    console.error('Error retrieving top games for yesterday:', error);
    throw error;
  }
}

/**
 * Get today's letter sequence (based on US Central Time)
 * @returns {Promise<Array<string>>} - Today's letter sequence
 * @throws {Error} - If no sequence is available for today
 */
export async function getTodayLetterSequence() {
  try {
    const response = await fetch(`${API_BASE_URL}/letters/today`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'No letter sequence available for today');
    }
    
    const data = await response.json();
    return data.letters;
  } catch (error) {
    console.error('Error retrieving letter sequence:', error);
    throw error;
  }
}

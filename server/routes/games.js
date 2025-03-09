import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Game from '../db/models/game.model.js';
import { normalizeToCentralTime } from '../utils/time-utils.js';

const router = express.Router();

/**
 * POST /api/games
 * Save a new game result
 */
router.post('/', async (req, res) => {
  try {
    const gameData = req.body;
    
    // Generate a unique ID for the game
    gameData.gameId = uuidv4();
    
    // Normalize the playedAt timestamp to Central Time
    // This ensures consistency with how we query for "today's games"
    if (!gameData.playedAt) {
      gameData.playedAt = new Date(); // Use current time if not provided
    }
    
    // We don't normalize to midnight here because we want to preserve the actual time
    // But we do want to ensure the date is interpreted in Central Time
    const playedAtDate = new Date(gameData.playedAt);
    const centralTime = new Date(playedAtDate.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    gameData.playedAt = centralTime;
    
    const game = new Game(gameData);
    await game.save();
    
    res.status(201).json({
      success: true,
      gameId: game.gameId,
      message: 'Game saved successfully'
    });
  } catch (error) {
    console.error('Error saving game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save game',
      error: error.message
    });
  }
});

/**
 * GET /api/games/today/top
 * Get top 10 games for today, sorted by score
 */
router.get('/today/top', async (req, res) => {
  try {
    // Get today's date normalized to midnight in Central Time
    const today = normalizeToCentralTime();
    
    // Get top 10 games for today, sorted by score
    const topGames = await Game.find({
      playedAt: { $gte: today }
    })
      .select('gameId playerInitials score bestWord playedAt')
      .sort({ score: -1 })
      .limit(10);
    
    res.status(200).json({
      success: true,
      games: topGames
    });
  } catch (error) {
    console.error('Error retrieving top games for today:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve top games for today',
      error: error.message
    });
  }
});

/**
 * GET /api/games/:gameId
 * Get a specific game by ID
 */
router.get('/:gameId', async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.gameId });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    res.status(200).json({
      success: true,
      game
    });
  } catch (error) {
    console.error('Error retrieving game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve game',
      error: error.message
    });
  }
});

/**
 * GET /api/games
 * Get recent games (limited to 10)
 */
router.get('/', async (req, res) => {
  try {
    // Get the 10 most recent games, with limited fields for the list view
    const recentGames = await Game.find({})
      .select('gameId playerInitials score bestWord playedAt')
      .sort({ playedAt: -1 })
      .limit(10);
    
    res.status(200).json({
      success: true,
      games: recentGames
    });
  } catch (error) {
    console.error('Error retrieving recent games:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent games',
      error: error.message
    });
  }
});

export default router;

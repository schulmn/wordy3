import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Game from '../db/models/game.model.js';

const router = express.Router();

/**
 * Helper function to delete games older than 3 days
 */
async function cleanupOldGames() {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const result = await Game.deleteMany({ playedAt: { $lt: threeDaysAgo } });
    console.log(`Cleaned up ${result.deletedCount} games older than 3 days`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up old games:', error);
    throw error;
  }
}

/**
 * POST /api/games
 * Save a new game result
 */
router.post('/', async (req, res) => {
  try {
    const gameData = req.body;
    
    // Generate a unique ID for the game
    gameData.gameId = uuidv4();
    
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
 * Get games with pagination
 */
router.get('/', async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get total count of games
    const totalGames = await Game.countDocuments();
    const totalPages = Math.ceil(totalGames / limit);
    
    // Get paginated games
    const games = await Game.find({})
      .select('gameId playerInitials score bestWord playedAt')
      .sort({ playedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      games,
      pagination: {
        totalGames,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error retrieving games:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve games',
      error: error.message
    });
  }
});

/**
 * POST /api/games/cleanup
 * Manually trigger cleanup of old games
 */
router.post('/cleanup', async (req, res) => {
  try {
    const deletedCount = await cleanupOldGames();
    
    res.status(200).json({
      success: true,
      message: `Successfully cleaned up ${deletedCount} old games`,
      deletedCount
    });
  } catch (error) {
    console.error('Error during manual cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean up old games',
      error: error.message
    });
  }
});

export default router;

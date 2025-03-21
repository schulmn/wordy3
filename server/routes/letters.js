import express from 'express';
import LetterSequence from '../db/models/letter-sequence.model.js';
import { normalizeToCentralTime } from '../utils/time-utils.js';
import { ensureFutureSequences } from '../utils/letter-generator.js';

const router = express.Router();

/**
 * GET /api/letters/today
 * Get today's letter sequence (based on US Central Time)
 * Also ensures letter sequences exist for future dates
 * This is the only endpoint needed as all letter sequences are generated automatically
 */
router.get('/today', async (req, res) => {
  try {
    // Get today's date normalized to midnight in Central Time
    const today = normalizeToCentralTime();
    
    // Find sequence for today
    const sequence = await LetterSequence.findOne({
      date: today
    });
    
    // If no sequence exists for today, return 404
    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'No letter sequence available for today'
      });
    }
    
    // In the background, ensure sequences exist for future dates
    // This won't block the response
    ensureFutureSequences(7).catch(err => {
      console.error('Error ensuring future sequences:', err.message);
    });
    
    res.status(200).json({
      success: true,
      letters: sequence.letters,
      centralTime: today.toISOString(),
      sequenceId: sequence._id
    });
  } catch (error) {
    console.error('Error retrieving letter sequence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve letter sequence',
      error: error.message
    });
  }
});

export default router;

import express from 'express';
import LetterSequence from '../db/models/letter-sequence.model.js';
import { normalizeToCentralTime } from '../utils/time-utils.js';
import { ensureFutureSequences } from '../utils/letter-generator.js';

const router = express.Router();

/**
 * GET /api/letters/today
 * Get today's letter sequence (based on US Central Time)
 * Also ensures letter sequences exist for future dates
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

/**
 * GET /api/letters/:id
 * Get a specific letter sequence by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const sequence = await LetterSequence.findById(req.params.id);
    
    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Letter sequence not found'
      });
    }
    
    res.status(200).json({
      success: true,
      sequence
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

/**
 * POST /api/letters
 * Create a new letter sequence
 */
router.post('/', async (req, res) => {
  try {
    const { date, letters } = req.body;
    
    // Validate date format
    if (!date || isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    // Normalize to midnight in Central Time
    const normalizedDate = normalizeToCentralTime(date);
    
    // Check if sequence already exists for this date
    const existingSequence = await LetterSequence.findOne({
      date: normalizedDate
    });
    
    if (existingSequence) {
      return res.status(409).json({
        success: false,
        message: 'A letter sequence already exists for this date'
      });
    }
    
    // Create new sequence
    const letterSequence = new LetterSequence({
      date: normalizedDate,
      letters
    });
    
    await letterSequence.save();
    
    res.status(201).json({
      success: true,
      message: 'Letter sequence created successfully',
      sequence: letterSequence
    });
  } catch (error) {
    console.error('Error creating letter sequence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create letter sequence',
      error: error.message
    });
  }
});

/**
 * PUT /api/letters/:id
 * Update an existing letter sequence
 */
router.put('/:id', async (req, res) => {
  try {
    const { date, letters } = req.body;
    
    // Find the sequence
    const sequence = await LetterSequence.findById(req.params.id);
    
    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Letter sequence not found'
      });
    }
    
    // If date is provided, validate and update
    if (date) {
      if (isNaN(new Date(date).getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }
      
      // Normalize to midnight in Central Time
      const normalizedDate = normalizeToCentralTime(date);
      
      // Check if another sequence exists for this date (excluding current one)
      const existingSequence = await LetterSequence.findOne({
        _id: { $ne: req.params.id },
        date: normalizedDate
      });
      
      if (existingSequence) {
        return res.status(409).json({
          success: false,
          message: 'Another letter sequence already exists for this date'
        });
      }
      
      sequence.date = normalizedDate;
    }
    
    // If letters are provided, validate and update
    if (letters) {
      if (letters.length < 30 || letters.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Letter sequence must contain between 30 and 100 letters'
        });
      }
      
      sequence.letters = letters;
    }
    
    // Save the updated sequence
    await sequence.save();
    
    res.status(200).json({
      success: true,
      message: 'Letter sequence updated successfully',
      sequence
    });
  } catch (error) {
    console.error('Error updating letter sequence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update letter sequence',
      error: error.message
    });
  }
});

/**
 * DELETE /api/letters/:id
 * Delete a letter sequence
 */
router.delete('/:id', async (req, res) => {
  try {
    const sequence = await LetterSequence.findByIdAndDelete(req.params.id);
    
    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Letter sequence not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Letter sequence deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting letter sequence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete letter sequence',
      error: error.message
    });
  }
});

/**
 * GET /api/letters
 * Get all letter sequences
 */
router.get('/', async (req, res) => {
  try {
    const sequences = await LetterSequence.find()
      .sort({ date: -1 })
      .limit(30);
    
    res.status(200).json({
      success: true,
      sequences
    });
  } catch (error) {
    console.error('Error retrieving letter sequences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve letter sequences',
      error: error.message
    });
  }
});

export default router;

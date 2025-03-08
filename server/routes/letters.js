import express from 'express';
import LetterSequence from '../db/models/letter-sequence.model.js';

const router = express.Router();

/**
 * Helper function to normalize a date to midnight in US Central Time
 * This handles the case where a date string like "2025-03-07" is passed
 * and ensures it represents midnight on that date in Central Time
 * 
 * @param {Date|string} date - Date to normalize (defaults to now)
 * @returns {Date} Date normalized to midnight in US Central Time
 */
function normalizeToCentralTime(date = new Date()) {
  console.log('Normalizing date:', date);
  
  let inputDate;
  
  // If date is a string in YYYY-MM-DD format (from date input)
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Extract the year, month, and day
    const [year, month, day] = date.split('-');
    console.log(`Parsed date string: year=${year}, month=${month}, day=${day}`);
    
    // Create a date object with these components in the local time zone
    // We use month-1 because JavaScript months are 0-indexed
    inputDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else {
    // Otherwise, use the provided date
    inputDate = typeof date === 'string' ? new Date(date) : new Date(date);
  }
  
  console.log('Input date:', inputDate.toString());
  
  // Get the date in Central Time
  const centralTime = new Date(inputDate.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  console.log('Central time:', centralTime.toString());
  
  // Extract year, month, day components from the Central Time date
  const centralYear = centralTime.getFullYear();
  const centralMonth = centralTime.getMonth(); // 0-indexed
  const centralDay = centralTime.getDate();
  
  console.log(`Central components: year=${centralYear}, month=${centralMonth}, day=${centralDay}`);
  
  // Create a new date with these components, setting time to midnight UTC
  // This ensures consistent behavior regardless of the local time zone
  const normalizedDate = new Date(Date.UTC(centralYear, centralMonth, centralDay));
  console.log('Normalized date:', normalizedDate.toISOString());
  
  return normalizedDate;
}

/**
 * GET /api/letters/today
 * Get today's letter sequence (based on US Central Time)
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

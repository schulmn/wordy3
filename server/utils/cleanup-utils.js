/**
 * Database cleanup utilities for Wordy3 server
 * Handles automatic removal of old data to keep database size manageable
 */

import LetterSequence from '../db/models/letter-sequence.model.js';
import Game from '../db/models/game.model.js';
import { normalizeToCentralTime } from './time-utils.js';

// Track the last time cleanup was run (to ensure it only runs once per day)
let lastCleanupDate = null;

/**
 * Removes letter sequences and games older than the specified number of days
 * Will only run once per day to avoid unnecessary database operations
 * 
 * @param {number} daysToKeep - Number of days of data to keep (default: 3)
 * @returns {Promise<{success: boolean, message: string, letterSequencesRemoved?: number, gamesRemoved?: number}>}
 */
export async function cleanupOldData(daysToKeep = 3) {
  try {
    // Get today's date normalized to midnight in Central Time
    const today = normalizeToCentralTime();
    
    // Check if we already ran cleanup today
    if (lastCleanupDate) {
      const lastCleanupDay = lastCleanupDate.getDate();
      const todayDay = today.getDate();
      
      if (lastCleanupDay === todayDay) {
        console.log('Database cleanup already ran today, skipping');
        return {
          success: true,
          message: 'Cleanup already ran today, skipping'
        };
      }
    }
    
    console.log(`Starting database cleanup, removing data older than ${daysToKeep} days`);
    
    // Calculate cutoff date (X days ago)
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    console.log(`Cutoff date: ${cutoffDate.toISOString()}`);
    
    // Find letter sequences older than cutoff date
    const oldLetterSequences = await LetterSequence.find({
      date: { $lt: cutoffDate }
    });
    
    // Get IDs of old letter sequences for removing related games
    const oldSequenceIds = oldLetterSequences.map(seq => seq._id);
    
    // Remove old letter sequences
    const letterSequenceResult = await LetterSequence.deleteMany({
      date: { $lt: cutoffDate }
    });
    
    // Remove games associated with old letter sequences
    const gameResult = await Game.deleteMany({
      letterSequenceId: { $in: oldSequenceIds }
    });
    
    // Update last cleanup date
    lastCleanupDate = today;
    
    console.log(`Database cleanup complete. Removed ${letterSequenceResult.deletedCount} letter sequences and ${gameResult.deletedCount} games.`);
    
    return {
      success: true,
      message: 'Database cleanup completed successfully',
      letterSequencesRemoved: letterSequenceResult.deletedCount,
      gamesRemoved: gameResult.deletedCount
    };
  } catch (error) {
    console.error('Error during database cleanup:', error);
    return {
      success: false,
      message: `Database cleanup failed: ${error.message}`
    };
  }
}

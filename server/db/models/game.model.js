import mongoose from 'mongoose';

/**
 * Game Event Schema
 * Represents individual events that occurred during a game
 */
const gameEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['valid', 'invalid', 'drop'],
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

/**
 * Game Schema
 * Represents a complete game record with all events and statistics
 */
const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  playerInitials: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  bestWord: {
    word: String,
    score: Number
  },
  history: {
    events: [gameEventSchema],
    validPoints: Number,
    invalidPoints: Number,
    dropPoints: Number
  },
  playedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
gameSchema.index({ playedAt: -1 });
gameSchema.index({ score: -1 });
gameSchema.index({ playerInitials: 1, playedAt: -1 });

export default mongoose.model('Game', gameSchema);

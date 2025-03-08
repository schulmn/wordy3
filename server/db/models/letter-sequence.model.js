import mongoose from 'mongoose';

/**
 * Letter Sequence Schema
 * Represents a predefined sequence of letters for a specific date
 * All dates are stored in UTC but represent midnight in US Central Time
 */
const letterSequenceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true
  },
  letters: {
    type: [String],
    required: true,
    validate: {
      validator: function(letters) {
        return letters.length >= 30 && letters.length <= 100;
      },
      message: 'Letter sequence must contain between 30 and 100 letters'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
letterSequenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('LetterSequence', letterSequenceSchema);

import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureFutureSequences } from './utils/letter-generator.js';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import gamesRoutes from './routes/games.js';
import lettersRoutes from './routes/letters.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true, // Allow requests from any origin
  credentials: true
}));
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DB_NAME || 'wordy3'
})
.then(() => {
  console.log('Connected to MongoDB');
  
  // Check for future letter sequences when server starts
  ensureFutureSequences(7).catch(err => {
    console.error('Error ensuring future sequences on startup:', err.message);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Routes - placing API routes before static file middleware
app.use('/api/games', gamesRoutes);
app.use('/api/letters', lettersRoutes);

// Admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Static files - moved after API routes
app.use(express.static(path.join(__dirname, '../public')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

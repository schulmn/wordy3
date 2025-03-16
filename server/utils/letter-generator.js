/**
 * Letter Generator Utility
 * 
 * Provides functions for generating letter sequences from USCCB RSS feed content.
 * Used to ensure letter sequences are available for future dates.
 */

import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import LetterSequence from '../db/models/letter-sequence.model.js';
import { normalizeToCentralTime } from './time-utils.js';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify exec for easier use with async/await
const execPromise = promisify(exec);

// Configure axios
const axiosInstance = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
});

/**
 * Fetches text from the USCCB RSS feed
 * @returns {Promise<string>} The text content from the RSS feed
 */
async function fetchRssText() {
  try {
    console.log('Fetching text from USCCB RSS feed...');
    const response = await axiosInstance.get('https://www.usccb.org/news.rss');
    return response.data;
  } catch (error) {
    console.error('Error fetching RSS feed:', error.message);
    throw new Error(`Failed to fetch RSS feed: ${error.message}`);
  }
}

/**
 * Extracts a substring from the RSS text
 * @param {string} xmlContent - The full XML content from the RSS feed
 * @returns {string} A 48-character substring starting from position 1000
 */
function extractSubstring(xmlContent) {
  // Remove XML tags to get plain text
  const plainText = xmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  
  // Start from position 1000 and take 48 characters
  const startPos = 1000;
  const length = 48;
  
  if (plainText.length < startPos + length) {
    console.warn(`Text is shorter than expected (${plainText.length} chars). Using available text.`);
    // If text is too short, use what we have but ensure we get enough characters
    return plainText.substring(Math.max(0, plainText.length - 100));
  }
  
  const substring = plainText.substring(startPos, startPos + length);
  console.log(`Extracted substring: "${substring}"`);
  return substring;
}

/**
 * Ensures the text has enough letters to meet the minimum requirement
 * @param {string} text - The text to check
 * @param {number} minLength - The minimum required length (default: 30)
 * @returns {string} Text with enough letters
 */
function ensureEnoughLetters(text, minLength = 30) {
  // Remove non-letter characters
  const lettersOnly = text.replace(/[^a-zA-Z]/g, '');
  
  if (lettersOnly.length >= minLength) {
    return lettersOnly;
  }
  
  // If we don't have enough letters, repeat the text until we do
  let result = lettersOnly;
  while (result.length < minLength) {
    result += lettersOnly;
  }
  
  console.log(`Expanded text to ensure minimum length: "${result}"`);
  return result.substring(0, minLength);
}

/**
 * Processes the text through the Python script
 * @param {string} text - The text to process
 * @returns {Promise<string>} The processed text
 */
async function processWithPythonScript(text) {
  try {
    console.log('Processing text with Python script...');
    const scriptPath = path.join(__dirname, '..', 'mix_letters.py');
    const { stdout, stderr } = await execPromise(`python "${scriptPath}" "${text}"`);
    
    if (stderr) {
      console.error('Python script error:', stderr);
    }
    
    const result = stdout.trim();
    console.log(`Processed result: "${result}"`);
    return result;
  } catch (error) {
    console.error('Error processing with Python script:', error.message);
    throw new Error(`Failed to process text with Python script: ${error.message}`);
  }
}

/**
 * Converts the processed string into an array of letters
 * @param {string} processedText - The processed text from the Python script
 * @returns {string[]} Array of letters
 */
function convertToLetterArray(processedText) {
  // Convert to uppercase and split into individual letters
  return processedText.toUpperCase().split('');
}

/**
 * Checks if a letter sequence exists for the specified date
 * @param {Date} date - The date to check
 * @returns {Promise<boolean>} Whether a sequence exists
 */
export async function sequenceExistsForDate(date) {
  try {
    const sequence = await LetterSequence.findOne({ date });
    return !!sequence;
  } catch (error) {
    console.error('Error checking for existing sequence:', error.message);
    throw new Error(`Failed to check for existing sequence: ${error.message}`);
  }
}

/**
 * Creates a new letter sequence for the specified date
 * @param {Date} date - The date for the sequence
 * @param {string[]} letters - The array of letters
 * @returns {Promise<Object>} The created sequence
 */
export async function createLetterSequence(date, letters) {
  try {
    console.log(`Creating letter sequence for ${date.toISOString()} with ${letters.length} letters`);
    
    const letterSequence = new LetterSequence({
      date,
      letters
    });
    
    await letterSequence.save();
    console.log('Letter sequence created successfully');
    return letterSequence;
  } catch (error) {
    console.error('Error creating letter sequence:', error.message);
    throw new Error(`Failed to create letter sequence: ${error.message}`);
  }
}

/**
 * Generates letters from the USCCB RSS feed
 * @returns {Promise<string[]>} Array of letters
 */
export async function generateLettersFromRss() {
  // Fetch text from RSS feed
  const rssContent = await fetchRssText();
  
  // Extract substring
  const substring = extractSubstring(rssContent);
  
  // Ensure we have enough letters
  const processableText = ensureEnoughLetters(substring);
  
  // Process with Python script
  const processedText = await processWithPythonScript(processableText);
  
  // Convert to letter array
  return convertToLetterArray(processedText);
}

/**
 * Generates a letter sequence for a specific date
 * @param {Date} date - The date to generate a sequence for
 * @returns {Promise<Object>} The created sequence
 */
export async function generateSequenceForDate(date) {
  try {
    console.log(`Generating sequence for ${date.toISOString()}`);
    
    // Check if sequence already exists
    const exists = await sequenceExistsForDate(date);
    
    if (exists) {
      console.log('Letter sequence already exists for this date. No action needed.');
      return null;
    }
    
    // Generate letters
    const letters = await generateLettersFromRss();
    
    // Create and return the sequence
    return await createLetterSequence(date, letters);
  } catch (error) {
    console.error(`Error generating sequence for ${date.toISOString()}:`, error.message);
    throw error;
  }
}

/**
 * Ensures letter sequences exist for the next N days
 * @param {number} daysAhead - Number of days ahead to check
 * @returns {Promise<void>}
 */
export async function ensureFutureSequences(daysAhead = 7) {
  console.log(`Checking for letter sequences ${daysAhead} days ahead...`);
  
  for (let i = 1; i <= daysAhead; i++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i);
    
    // Normalize to midnight in Central Time
    const normalizedDate = normalizeToCentralTime(futureDate);
    
    try {
      // Check if sequence exists
      const exists = await sequenceExistsForDate(normalizedDate);
      
      if (!exists) {
        console.log(`No sequence found for ${normalizedDate.toISOString()}. Generating...`);
        // Generate sequence in the background
        generateSequenceForDate(normalizedDate).catch(err => 
          console.error(`Failed to generate sequence for ${normalizedDate.toISOString()}: ${err.message}`)
        );
      } else {
        console.log(`Sequence already exists for ${normalizedDate.toISOString()}`);
      }
    } catch (error) {
      console.error(`Error checking/generating sequence for ${normalizedDate.toISOString()}:`, error.message);
    }
  }
}

// Simple test script for the dictionary API
import { dictionary } from './dictionary.js';

async function testDictionary() {
    console.log('Testing dictionary API...');
    
    // Initialize the dictionary
    console.log('Initializing dictionary...');
    const initResult = await dictionary.initialize();
    console.log('Dictionary initialization result:', initResult);
    
    if (!initResult) {
        console.error('Dictionary initialization failed:', dictionary.error);
        return;
    }
    
    // Test some valid words
    const validWords = ['test', 'hello', 'world', 'dictionary', 'javascript'];
    console.log('\nTesting valid words:');
    for (const word of validWords) {
        try {
            const isValid = await dictionary.isValidWord(word);
            console.log(`"${word}" is valid: ${isValid}`);
        } catch (error) {
            console.error(`Error validating "${word}":`, error);
        }
    }
    
    // Test some invalid words
    const invalidWords = ['asdfgh', 'qwerty', 'zxcvbn', '123456'];
    console.log('\nTesting invalid words:');
    for (const word of invalidWords) {
        try {
            const isValid = await dictionary.isValidWord(word);
            console.log(`"${word}" is valid: ${isValid}`);
        } catch (error) {
            console.error(`Error validating "${word}":`, error);
        }
    }
}

// Run the test
testDictionary().catch(console.error);

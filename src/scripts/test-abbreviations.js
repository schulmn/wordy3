// Simple test script for the dictionary API - abbreviation check
import { dictionary } from './dictionary.js';

async function testAbbreviations() {
    console.log('Testing dictionary API for abbreviations...');
    
    // Initialize the dictionary
    console.log('Initializing dictionary...');
    const initResult = await dictionary.initialize();
    console.log('Dictionary initialization result:', initResult);
    
    if (!initResult) {
        console.error('Dictionary initialization failed:', dictionary.error);
        return;
    }
    
    // Test clear abbreviations (should be rejected)
    const abbreviations = [
        // Original set
        'pcp', 'fbi', 'cia', 'nasa', 'asap',
        // New set
        'dna', 'irs', 'atm', 'dvd', 'html', 'usb', 'pdf', 'ufo', 'sms', 'rsvp'
    ];
    console.log('\nTesting clear abbreviations (should be rejected):');
    for (const word of abbreviations) {
        try {
            const isValid = await dictionary.isValidWord(word);
            console.log(`"${word}" is valid: ${isValid}`);
        } catch (error) {
            console.error(`Error validating "${word}":`, error);
        }
    }
    
    // Test words that could be abbreviations but are also valid words (should be accepted)
    const dualPurposeWords = [
        // Original set
        'am', 'pm', 'ace', 'aid', 'arc', 'asp', 'ban', 'cap', 'cad', 'gem',
        // New set
        'aim', 'art', 'bat', 'bit', 'cat', 'cop', 'dot', 'ego', 'fit', 'gap'
    ];
    console.log('\nTesting words that could be abbreviations but are also valid words (should be accepted):');
    for (const word of dualPurposeWords) {
        try {
            const isValid = await dictionary.isValidWord(word);
            console.log(`"${word}" is valid: ${isValid}`);
        } catch (error) {
            console.error(`Error validating "${word}":`, error);
        }
    }
    
    // Test regular words (should be accepted)
    const regularWords = ['test', 'hello', 'world', 'dictionary', 'computer', 'keyboard', 'mouse', 'screen'];
    console.log('\nTesting regular words:');
    for (const word of regularWords) {
        try {
            const isValid = await dictionary.isValidWord(word);
            console.log(`"${word}" is valid: ${isValid}`);
        } catch (error) {
            console.error(`Error validating "${word}":`, error);
        }
    }
}

// Run the test
testAbbreviations().catch(console.error);

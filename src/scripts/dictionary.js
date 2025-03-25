export const dictionary = {
    isLoading: false,
    error: null,
    apiKey: '5998890a-6dd1-4382-8a05-62a8b398e198', // Merriam-Webster API key

    async initialize() {
        this.isLoading = true;
        this.error = null;
        try {
            // Test the primary API connection first
            const primaryApiResult = await this.testPrimaryApiConnection();
            if (primaryApiResult) {
                return true; // Primary API is working
            }
            
            // If primary fails, test the backup API
            const backupApiResult = await this.testBackupApiConnection();
            if (backupApiResult) {
                console.warn('Primary dictionary API unavailable, using backup API');
                return true; // Backup API is working
            }
            
            // Both APIs failed
            throw new Error('Could not connect to any Dictionary API');
        } catch (error) {
            this.error = error.message;
            return false;
        } finally {
            this.isLoading = false;
        }
    },

    async testPrimaryApiConnection() {
        try {
            // Test with a common word using Merriam-Webster API
            // Using the exact format from the example
            const response = await fetch(`https://dictionaryapi.com/api/v3/references/collegiate/json/test?key=${this.apiKey}`);
            return response.ok;
        } catch (error) {
            console.error("Error testing primary dictionary API:", error);
            return false;
        }
    },

    async testBackupApiConnection() {
        try {
            // Test with a common word using the free Dictionary API
            const response = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/test');
            return response.ok;
        } catch (error) {
            console.error("Error testing backup dictionary API:", error);
            return false;
        }
    },

    async isValidWord(word) {
        if (!word) return false;
        
        try {
            // First try the primary Merriam-Webster API
            // Using the exact format from the example
            const primaryResponse = await fetch(`https://dictionaryapi.com/api/v3/references/collegiate/json/${word.toLowerCase()}?key=${this.apiKey}`);
            
            if (primaryResponse.ok) {
                const data = await primaryResponse.json();
                
                // Check if we got a valid definition (not just suggestions)
                // Merriam-Webster returns an array of objects for valid words
                // If the word exists, the array will contain objects with a 'meta' property
                
                // First check if it's a valid word (has meta property)
                const isValidResponse = Array.isArray(data) && data.length > 0 && 
                                       typeof data[0] === 'object' && data[0].meta !== undefined;
                
                if (isValidResponse) {
                    // Special case for known abbreviations that should be rejected
                    const knownAbbreviations = [
                        // Original set
                        'pcp', 'fbi', 'cia', 'nasa', 'asap',
                        // New set
                        'dna', 'irs', 'atm', 'dvd', 'html', 'usb', 'pdf', 'ufo', 'sms', 'rsvp'
                    ];
                    if (knownAbbreviations.includes(word.toLowerCase())) {
                        return false;
                    }
                    
                    // Find all entries for this word
                    const wordEntries = data.filter(entry => {
                        const entryId = entry.meta?.id?.toLowerCase();
                        const entryHw = entry.hwi?.hw?.toLowerCase();
                        const wordLower = word.toLowerCase();
                        
                        return (entryId === wordLower || entryHw === wordLower);
                    });
                    
                    // Check if there are any non-abbreviation entries for this word
                    const hasNonAbbreviationEntry = wordEntries.some(entry => entry.fl !== 'abbreviation');
                    
                    // If there's at least one non-abbreviation entry, consider it a valid word
                    if (hasNonAbbreviationEntry) {
                        return true;
                    }
                    
                    // If there are only abbreviation entries or no entries at all, check if it's an abbreviation
                    const abbreviationEntries = data.filter(entry => entry.fl === 'abbreviation');
                    
                    // For abbreviations like "pcp", "fbi", etc., they are typically returned in uppercase
                    // So we need to check both the original word and its uppercase version
                    const upperWord = word.toUpperCase();
                    const isAbbreviation = abbreviationEntries.some(entry => {
                        const entryId = entry.meta?.id;
                        const entryHw = entry.hwi?.hw;
                        
                        // Check if the entry matches either the original word or its uppercase version
                        return (entryId === word || entryId === upperWord || 
                                entryHw === word || entryHw === upperWord);
                    });
                    
                    // If it's only an abbreviation, reject it
                    return !isAbbreviation;
                }
                
                return false;
            }
            
            // If primary API fails, try the backup API
            console.warn(`Primary API validation failed for word: ${word}, trying backup API`);
            const backupResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
            
            // If backup response is OK (200), the word exists
            return backupResponse.ok;
        } catch (error) {
            console.error("Error validating word:", error);
            throw error; // Propagate the error to be handled by the game
        }
    }
};

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
                return Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && 
                       data[0].meta !== undefined;
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

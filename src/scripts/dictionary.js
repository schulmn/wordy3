export const dictionary = {
    isLoading: false,
    error: null,

    async initialize() {
        this.isLoading = true;
        this.error = null;
        try {
            // Test the API connection with a simple word
            const testResult = await this.testApiConnection();
            if (!testResult) {
                throw new Error('Could not connect to Dictionary API');
            }
            return true;
        } catch (error) {
            this.error = error.message;
            return false;
        } finally {
            this.isLoading = false;
        }
    },

    async testApiConnection() {
        try {
            // Test with a common word - just check if API is reachable
            const response = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/test');
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    async isValidWord(word) {
        if (!word) return false;
        
        try {
            // Use Free Dictionary API - returns 200 for valid words, 404 for invalid words
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
            
            // If response is OK (200), the word exists
            return response.ok;
        } catch (error) {
            console.error("Error validating word:", error);
            throw error; // Propagate the error to be handled by the game
        }
    }
};

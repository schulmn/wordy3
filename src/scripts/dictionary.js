import { validWords } from './wordlist.js';

export const dictionary = {
    wordList: null,
    isLoading: false,
    error: null,

    async initialize() {
        this.isLoading = true;
        this.error = null;
        try {
            this.wordList = validWords;
            return true;
        } catch (error) {
            this.error = error.message;
            return false;
        } finally {
            this.isLoading = false;
        }
    },

    isValidWord(word) {
        if (!this.wordList) return false;
        return this.wordList.has(word.toUpperCase());
    }
};

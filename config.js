// Fetch configuration from server
const config = {
    async init() {
        try {
            const response = await fetch('/config');
            const data = await response.json();
            Object.assign(this, data);
        } catch (error) {
            console.error('Failed to load configuration:', error);
            this.RAPIDAPI_KEY = '';
        }
    }
};

export default config;

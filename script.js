// DOM Elements
const twitterHandle = document.getElementById('twitter-handle');
const submitBtn = document.getElementById('submit-btn');
const imageContainer = document.getElementById('image-container');
const tweetsContainer = document.getElementById('tweets-container');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const twitterApiKeyInput = document.getElementById('twitter-api-key');
const openaiApiKeyInput = document.getElementById('openai-api-key');
const saveSettingsBtn = document.getElementById('save-settings');
const closeModalBtn = document.getElementById('close-modal');

// Constants
const TWITTER_API_KEY_STORAGE_KEY = 'twitter_api_key';
const OPENAI_API_KEY_STORAGE_KEY = 'openai_api_key';

// Load API keys from localStorage
let twitterApiKey = localStorage.getItem(TWITTER_API_KEY_STORAGE_KEY) || '';
let openaiApiKey = localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) || '';

if (twitterApiKey) twitterApiKeyInput.value = twitterApiKey;
if (openaiApiKey) openaiApiKeyInput.value = openaiApiKey;

// Settings Modal Handlers
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('show');
});

closeModalBtn.addEventListener('click', () => {
    settingsModal.classList.remove('show');
});

saveSettingsBtn.addEventListener('click', () => {
    twitterApiKey = twitterApiKeyInput.value.trim();
    openaiApiKey = openaiApiKeyInput.value.trim();
    localStorage.setItem(TWITTER_API_KEY_STORAGE_KEY, twitterApiKey);
    localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, openaiApiKey);
    settingsModal.classList.remove('show');
});

// Close modal when clicking outside
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('show');
    }
});

// Fetch Tweets Function
const fetchTweets = async (username) => {
    const url = 'https://twitter154.p.rapidapi.com/user/tweets';
    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'X-RapidAPI-Key': twitterApiKey,
            'X-RapidAPI-Host': 'twitter154.p.rapidapi.com'
        },
        body: JSON.stringify({
            username: username,
            include_replies: false,
            include_pinned: false
        })
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error('Failed to fetch tweets');
        }
        const result = await response.json();
        return result;
    } catch (error) {
        throw error;
    }
};

// Generate Image from OpenAI
const generateImage = async (prompt) => {
    const url = 'https://api.openai.com/v1/images/generations';
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024"
        })
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to generate image');
        }
        const result = await response.json();
        return result.data[0].url;
    } catch (error) {
        throw error;
    }
};

// Create Prompt from Tweets
const createPrompt = (tweets) => {
    // Extract the main topics and activities from tweets
    const tweetTexts = tweets.map(tweet => tweet.text).join(' ');
    
    // Remove URLs, mentions, and hashtags
    const cleanText = tweetTexts
        .replace(/https?:\/\/\S+/g, '')
        .replace(/@\w+/g, '')
        .replace(/#\w+/g, '')
        .trim();

    // Create a descriptive prompt
    return `Create a single cohesive image that represents these activities and thoughts: ${cleanText}. 
    Make it artistic and meaningful, focusing on the main themes and emotions. 
    Style: Modern digital art with vibrant colors and clean lines. 
    Ensure the image is appropriate and safe for all audiences.`;
};

// Display Loading State
const showLoading = () => {
    imageContainer.innerHTML = `
        <div class="generating">
            <div class="spinner"></div>
            <div class="generating-text">Generating your image...</div>
        </div>
    `;
};

// Display Error
const showError = (message) => {
    imageContainer.innerHTML = `<div class="error">${message}</div>`;
};

// Display Image
const displayImage = (imageUrl) => {
    imageContainer.innerHTML = `<img src="${imageUrl}" alt="Generated visualization">`;
};

// Display Tweets
const displayTweets = (tweets) => {
    tweetsContainer.innerHTML = '';
    
    if (!tweets || tweets.length === 0) {
        tweetsContainer.innerHTML = '<div class="error">No tweets found</div>';
        return;
    }

    tweets.forEach(tweet => {
        const tweetElement = document.createElement('div');
        tweetElement.className = 'tweet';
        tweetElement.innerHTML = `
            <div class="tweet-text">${tweet.text}</div>
            <div class="tweet-meta">
                <span>${new Date(tweet.creation_date).toLocaleDateString()}</span>
                <span>🔄 ${tweet.retweet_count} ❤️ ${tweet.favorite_count}</span>
            </div>
        `;
        tweetsContainer.appendChild(tweetElement);
    });
};

// Handle Form Submission
submitBtn.addEventListener('click', async () => {
    const username = twitterHandle.value.trim();
    
    if (!username) {
        showError('Please enter a Twitter handle');
        return;
    }

    if (!twitterApiKey || !openaiApiKey) {
        showError('Please set your API keys in settings');
        settingsModal.classList.add('show');
        return;
    }

    showLoading();
    tweetsContainer.innerHTML = '<div class="loading">Loading tweets...</div>';

    try {
        // Fetch tweets
        const tweetData = await fetchTweets(username);
        const tweets = tweetData.results || [];
        displayTweets(tweets);

        if (tweets.length === 0) {
            showError('No tweets found to generate image from');
            return;
        }

        // Generate and display image
        const prompt = createPrompt(tweets);
        const imageUrl = await generateImage(prompt);
        displayImage(imageUrl);
    } catch (error) {
        showError(`Error: ${error.message}`);
    }
});

// Handle Enter key press
twitterHandle.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitBtn.click();
    }
});

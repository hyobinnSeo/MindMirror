// DOM Elements
const twitterHandle = document.getElementById('twitter-handle');
const submitBtn = document.getElementById('submit-btn');
const tweetsContainer = document.getElementById('tweets-container');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const apiKeyInput = document.getElementById('api-key');
const saveSettingsBtn = document.getElementById('save-settings');
const closeModalBtn = document.getElementById('close-modal');

// Constants
const API_KEY_STORAGE_KEY = 'twitter_api_key';

// Load API key from localStorage
let apiKey = localStorage.getItem(API_KEY_STORAGE_KEY) || '';
if (apiKey) {
    apiKeyInput.value = apiKey;
}

// Settings Modal Handlers
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('show');
});

closeModalBtn.addEventListener('click', () => {
    settingsModal.classList.remove('show');
});

saveSettingsBtn.addEventListener('click', () => {
    apiKey = apiKeyInput.value.trim();
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
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
            'X-RapidAPI-Key': apiKey,
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

// Format Date
const formatDate = (dateString) => {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
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
                <span>${formatDate(tweet.creation_date)}</span>
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
        tweetsContainer.innerHTML = '<div class="error">Please enter a Twitter handle</div>';
        return;
    }

    if (!apiKey) {
        tweetsContainer.innerHTML = '<div class="error">Please set your RapidAPI key in settings</div>';
        settingsModal.classList.add('show');
        return;
    }

    tweetsContainer.innerHTML = '<div class="loading">Loading tweets...</div>';

    try {
        const tweets = await fetchTweets(username);
        displayTweets(tweets.results || []);
    } catch (error) {
        tweetsContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
});

// Handle Enter key press
twitterHandle.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitBtn.click();
    }
});

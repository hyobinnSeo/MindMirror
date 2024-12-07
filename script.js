import config from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize configuration
    await config.init();
    
    const input = document.getElementById('twitter-handle');
    const submitBtn = document.getElementById('submit-btn');
    const tweetsContainer = document.getElementById('tweets-container');

    input.addEventListener('input', (e) => {
        // Remove @ symbol if user types it
        if (e.target.value.startsWith('@')) {
            e.target.value = e.target.value.substring(1);
        }
        
        // Remove spaces
        e.target.value = e.target.value.replace(/\s/g, '');
    });

    function formatTweet(tweet) {
        const date = new Date(tweet.creation_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="tweet">
                <div class="tweet-content">${tweet.text}</div>
                <div class="tweet-stats">
                    <span>❤️ ${tweet.favorite_count}</span>
                    <span>🔄 ${tweet.retweet_count}</span>
                </div>
                <div class="tweet-time">${date}</div>
            </div>
        `;
    }

    function displayTweets(tweets) {
        if (!tweets || tweets.length === 0) {
            tweetsContainer.innerHTML = '<div class="tweet">No tweets found</div>';
            return;
        }

        const tweetElements = tweets.map(tweet => formatTweet(tweet));
        tweetsContainer.innerHTML = tweetElements.join('');
        tweetsContainer.classList.add('active');
    }

    async function fetchTweets(username) {
        const url = 'https://twitter154.p.rapidapi.com/user/tweets';
        const options = {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': config.RAPIDAPI_KEY,
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
            return result.results || [];
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    submitBtn.addEventListener('click', async () => {
        const handle = input.value.trim();
        
        if (!handle) {
            alert('Please enter a Twitter handle');
            return;
        }

        // Basic validation for Twitter handle format
        if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
            alert('Please enter a valid Twitter handle (letters, numbers, and underscores only, max 15 characters)');
            return;
        }

        // Clear previous tweets and show loading state
        tweetsContainer.innerHTML = '<div class="tweet">Loading tweets...</div>';
        tweetsContainer.classList.add('active');
        submitBtn.disabled = true;

        try {
            const tweets = await fetchTweets(handle);
            displayTweets(tweets);
        } catch (error) {
            tweetsContainer.innerHTML = `
                <div class="tweet error">
                    <div class="tweet-content">
                        Failed to fetch tweets. Please try again later.
                    </div>
                </div>
            `;
        } finally {
            submitBtn.disabled = false;
        }
    });
});

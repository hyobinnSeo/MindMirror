// DOM Elements
const twitterHandle = document.getElementById('twitter-handle');
const submitBtn = document.getElementById('submit-btn');
const imageContainer = document.getElementById('image-container');
const tweetsContainer = document.getElementById('tweets-container');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const twitterApiKeyInput = document.getElementById('twitter-api-key');
const openaiApiKeyInput = document.getElementById('openai-api-key');
const dallePromptInput = document.getElementById('dalle-prompt');
const imageStyleSelect = document.getElementById('image-style');
const saveSettingsBtn = document.getElementById('save-settings');
const closeModalBtn = document.getElementById('close-modal');
const ageRangeSelect = document.getElementById('age-range');
const genderSelect = document.getElementById('gender');

// Constants
const TWITTER_API_KEY_STORAGE_KEY = 'twitter_api_key';
const OPENAI_API_KEY_STORAGE_KEY = 'openai_api_key';
const DALLE_PROMPT_STORAGE_KEY = 'dalle_prompt';
const IMAGE_STYLE_STORAGE_KEY = 'image_style';

// Image Style Prompts
const STYLE_PROMPTS = {
    renaissance: {
        name: "Renaissance Oil Painting",
        guide: "Create the scene in the style of a Renaissance oil painting, with rich colors, dramatic lighting, and classical composition techniques. Focus on capturing the character's essence through traditional portraiture methods while maintaining historical accuracy in depicting their daily activities."
    },
    photography: {
        name: "19th Century Photography",
        guide: "Render the scene as if captured through a vintage camera lens, with characteristic sepia tones and period-appropriate photographic techniques. Emphasize authentic composition and lighting typical of early photography while showcasing the character's daily life."
    },
    illustration: {
        name: "Classic Book Illustration",
        guide: "Design the scene in the style of traditional book illustrations, with detailed linework and careful attention to storytelling elements. Use techniques reminiscent of classic literary illustrations to bring the character's daily activities to life."
    },
    poster: {
        name: "Vintage Movie Poster",
        guide: "Compose the scene with the dramatic flair of vintage cinema posters, incorporating bold compositions and characteristic color palettes of the golden age of movie marketing, while maintaining focus on the character's authentic daily moments."
    },
    anime: {
        name: "Anime Style",
        guide: "Create the scene in a Japanese anime art style, with clean lines, expressive features, and characteristic visual elements of the medium. Focus on slice-of-life moments that capture the character's daily activities in an authentic way."
    }
};

// Default DALL-E prompt template
const DEFAULT_PROMPT = `Generate an image depicting a single character's daily life. The character's details are:

Gender: {gender}
Age: {age}
Character's Diary History: {diary}

Your image should follow the guidelines below:
Style: {style_name}
Guide: {style_guide}
Important: The generated image must realistically portray the character's activities as described in their diary.`;

// Load settings from localStorage
let twitterApiKey = localStorage.getItem(TWITTER_API_KEY_STORAGE_KEY) || '';
let openaiApiKey = localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) || '';
let dallePrompt = localStorage.getItem(DALLE_PROMPT_STORAGE_KEY) || '';
let selectedStyle = localStorage.getItem(IMAGE_STYLE_STORAGE_KEY) || 'renaissance';

// Initialize form values
if (twitterApiKey) twitterApiKeyInput.value = twitterApiKey;
if (openaiApiKey) openaiApiKeyInput.value = openaiApiKey;
if (dallePrompt) dallePromptInput.value = dallePrompt;
if (selectedStyle) imageStyleSelect.value = selectedStyle;

// Update localStorage when style changes
imageStyleSelect.addEventListener('change', () => {
    selectedStyle = imageStyleSelect.value;
    localStorage.setItem(IMAGE_STYLE_STORAGE_KEY, selectedStyle);
});

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
    dallePrompt = dallePromptInput.value.trim();
    
    localStorage.setItem(TWITTER_API_KEY_STORAGE_KEY, twitterApiKey);
    localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, openaiApiKey);
    if (dallePrompt) {
        localStorage.setItem(DALLE_PROMPT_STORAGE_KEY, dallePrompt);
    } else {
        localStorage.removeItem(DALLE_PROMPT_STORAGE_KEY);
    }
    
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

    // Get user's age range and gender
    const ageRange = ageRangeSelect.value;
    const gender = genderSelect.value;
    const style = STYLE_PROMPTS[selectedStyle];

    // Replace placeholders in prompt
    const prompt = DEFAULT_PROMPT
        .replace('{diary}', cleanText)
        .replace('{age}', ageRange)
        .replace('{gender}', gender)
        .replace('{style_name}', style.name)
        .replace('{style_guide}', style.guide);
    
    // Use custom prompt if provided, otherwise use default
    return dallePrompt || prompt;
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
    const ageRange = ageRangeSelect.value;
    const gender = genderSelect.value;
    
    if (!username) {
        showError('Please enter a Twitter handle');
        return;
    }

    if (!ageRange || !gender) {
        showError('Please select both age range and gender');
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

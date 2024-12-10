// DOM Elements
const twitterHandle = document.getElementById('twitter-handle');
const fetchTweetsBtn = document.getElementById('fetch-tweets-btn');
const generateImageBtn = document.getElementById('generate-image-btn');
const imageContainer = document.getElementById('image-container');
const tweetsContainer = document.getElementById('tweets-container');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const twitterApiKeyInput = document.getElementById('twitter-api-key');
const openaiApiKeyInput = document.getElementById('openai-api-key');
const imageStyleSelect = document.getElementById('image-style');
const settingsStyleSelect = document.getElementById('settings-style-select');
const stylePromptInput = document.getElementById('style-prompt');
const saveSettingsBtn = document.getElementById('save-settings');
const closeModalBtn = document.getElementById('close-modal');
const resetPromptBtn = document.getElementById('reset-prompt');
const ageRangeSelect = document.getElementById('age-range');
const genderSelect = document.getElementById('gender');
const additionalPromptInput = document.getElementById('additional-prompt');

// Constants
const TWITTER_API_KEY_STORAGE_KEY = 'twitter_api_key';
const OPENAI_API_KEY_STORAGE_KEY = 'openai_api_key';
const IMAGE_STYLE_STORAGE_KEY = 'image_style';
const STYLE_PROMPTS_STORAGE_KEY = 'style_prompts';
const MAX_PROMPT_LENGTH = 4000;

// Default Image Style Prompts
const DEFAULT_STYLE_PROMPTS = {
    cinematic: {
        name: "Cinematic Realism",
        guide: "Craft the scene in a realism style, blending lifelike detail with a modern cinematic touch. Use muted tones, soft textures, and a moody, atmospheric environment to evoke emotion. Highlight the interplay of light and shadow to enhance the narrative depth and immerse the viewer in the moment."
    },
    renaissance: {
        name: "Renaissance Oil Painting",
        guide: "Create the scene in the style of a Renaissance oil painting, with rich colors, dramatic lighting, and classical composition techniques. Focus on capturing the character's essence through traditional portraiture methods while maintaining historical accuracy in depicting their daily activities."
    },
    photography: {
        name: "19th Century Photography",
        guide: "Render the scene as if captured through a vintage camera lens, with characteristic black and white tones and period-appropriate photographic techniques. Emphasize authentic composition and lighting typical of early photography while showcasing the character's daily life."
    },
    poster: {
        name: "TV Series Poster",
        guide: "Compose the scene with the sophisticated and contemporary style of streaming platform marketing, featuring high-contrast imagery, and modern digital effects. Focus on creating an atmospheric mood that reflects current entertainment visual trends."
    },
    anime: {
        name: "Anime Style",
        guide: "Create the scene in a Japanese anime art style, with expressive features, and characteristic visual elements of the medium. Focus on slice-of-life moments that capture the character's daily activities in an authentic way."
    }
};

// Load style prompts from localStorage or use defaults
let STYLE_PROMPTS = JSON.parse(localStorage.getItem(STYLE_PROMPTS_STORAGE_KEY)) || DEFAULT_STYLE_PROMPTS;

// Default DALL-E prompt template
const DEFAULT_PROMPT = `Generate an image depicting a single character's daily life. The character's details are:

Gender: {gender}
Age: {age}
Character's Diary History: {diary}

Your image should follow the guidelines below:
Style: {style_name}
Guide: {style_guide}
Important: The generated image must realistically portray the character's activities as described in their diary.

Additional Requirements: {additional_prompt}`;

// Load settings from localStorage
let twitterApiKey = localStorage.getItem(TWITTER_API_KEY_STORAGE_KEY) || '';
let openaiApiKey = localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) || '';
let selectedStyle = localStorage.getItem(IMAGE_STYLE_STORAGE_KEY) || 'cinematic';

// Initialize form values
if (twitterApiKey) twitterApiKeyInput.value = twitterApiKey;
if (openaiApiKey) openaiApiKeyInput.value = openaiApiKey;
if (selectedStyle) {
    imageStyleSelect.value = selectedStyle;
    settingsStyleSelect.value = selectedStyle;
}

// Update style prompt input when style selection changes in settings
settingsStyleSelect.addEventListener('change', () => {
    const style = settingsStyleSelect.value;
    stylePromptInput.value = STYLE_PROMPTS[style].guide;
});

// Initialize style prompt input with current style's guide
stylePromptInput.value = STYLE_PROMPTS[settingsStyleSelect.value].guide;

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

// Reset prompt to default value
resetPromptBtn.addEventListener('click', () => {
    const currentStyle = settingsStyleSelect.value;
    stylePromptInput.value = DEFAULT_STYLE_PROMPTS[currentStyle].guide;
});

saveSettingsBtn.addEventListener('click', () => {
    twitterApiKey = twitterApiKeyInput.value.trim();
    openaiApiKey = openaiApiKeyInput.value.trim();
    
    // Save API keys
    localStorage.setItem(TWITTER_API_KEY_STORAGE_KEY, twitterApiKey);
    localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, openaiApiKey);
    
    // Save style prompt
    const currentStyle = settingsStyleSelect.value;
    STYLE_PROMPTS[currentStyle].guide = stylePromptInput.value.trim();
    localStorage.setItem(STYLE_PROMPTS_STORAGE_KEY, JSON.stringify(STYLE_PROMPTS));
    
    settingsModal.classList.remove('show');
    
    // Show success message in tweets container
    showMessage(tweetsContainer, 'Settings saved successfully! You can now fetch tweets and generate images.', 'success');
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
        // Filter out retweets by checking if tweet text starts with "RT"
        const nonRetweets = (result.results || []).filter(tweet => !tweet.text.trim().startsWith('RT'));
        return { ...result, results: nonRetweets };
    } catch (error) {
        throw error;
    }
};

// Calculate available space for diary content
const calculateAvailableSpace = (prompt, style) => {
    // Create a prompt with all placeholders filled except diary
    const testPrompt = prompt
        .replace('{gender}', 'male')  // Use maximum length gender
        .replace('{age}', '40s')      // Use typical age format
        .replace('{diary}', '')       // Leave diary empty for calculation
        .replace('{style_name}', style.name)
        .replace('{style_guide}', style.guide)
        .replace('{additional_prompt}', additionalPromptInput.value.trim() || 'None');
    
    return MAX_PROMPT_LENGTH - testPrompt.length;
}

// Truncate diary content to fit within limit
const truncateDiary = (diary, maxLength) => {
    if (diary.length <= maxLength) return diary;
    
    // Split into sentences
    const sentences = diary.match(/[^.!?]+[.!?]+/g) || [];
    let result = '';
    
    // Add sentences until we reach the limit
    for (let sentence of sentences) {
        if ((result + sentence).length <= maxLength) {
            result += sentence;
        } else {
            break;
        }
    }
    
    return result.trim();
}

// Generate Image Prompt from GPT-4
const generateImagePrompt = async (initialPrompt) => {
    const url = 'https://api.openai.com/v1/chat/completions';
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [{
                role: "system",
                content: "You are an expert at creating detailed, vivid image generation prompts. Your task is to take the provided context and create a specific, detailed prompt that will result in a high-quality, cohesive image that captures the essence of the person and their activities."
            }, {
                role: "user",
                content: initialPrompt
            }]
        })
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to generate image prompt');
        }
        const result = await response.json();
        return result.choices[0].message.content;
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
    
    // Calculate available space for diary content
    const availableSpace = calculateAvailableSpace(DEFAULT_PROMPT, style);
    
    // Truncate diary content if needed
    const truncatedDiary = truncateDiary(cleanText, availableSpace);

    // Replace placeholders in prompt
    return DEFAULT_PROMPT
        .replace('{diary}', truncatedDiary)
        .replace('{age}', ageRange)
        .replace('{gender}', gender)
        .replace('{style_name}', style.name)
        .replace('{style_guide}', style.guide)
        .replace('{additional_prompt}', additionalPromptInput.value.trim() || 'None');
};

// Display Loading State
const showLoading = (container, message) => {
    container.innerHTML = `
        <div class="generating">
            <div class="spinner"></div>
            <div class="generating-text">${message}</div>
        </div>
    `;
};

// Display Message (Error or Success)
const showMessage = (container, message, type = 'error') => {
    container.innerHTML = `<div class="${type}">${message}</div>`;
};

// Display Image
const displayImage = (imageUrl) => {
    imageContainer.innerHTML = `<img src="${imageUrl}" alt="Generated visualization">`;
};

// Display Tweets
const displayTweets = (tweets) => {
    tweetsContainer.innerHTML = '';
    
    if (!tweets || tweets.length === 0) {
        showMessage(tweetsContainer, 'No tweets found');
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

// Handle Tweet Fetching
fetchTweetsBtn.addEventListener('click', async () => {
    const username = twitterHandle.value.trim();
    
    if (!username) {
        showMessage(tweetsContainer, 'Please enter a Twitter handle');
        return;
    }

    if (!twitterApiKey) {
        showMessage(tweetsContainer, 'Twitter API key not set. Click the ⚙️ Settings button below to add your API key.');
        return;
    }

    showLoading(tweetsContainer, 'Loading tweets...');

    try {
        const tweetData = await fetchTweets(username);
        const tweets = tweetData.results || [];
        displayTweets(tweets);
    } catch (error) {
        showMessage(tweetsContainer, `Error: ${error.message}`);
    }
});

// Handle Image Generation
generateImageBtn.addEventListener('click', async () => {
    const tweets = Array.from(tweetsContainer.querySelectorAll('.tweet'))
        .map(tweet => ({
            text: tweet.querySelector('.tweet-text').textContent
        }));

    if (tweets.length === 0) {
        showMessage(imageContainer, 'Please fetch tweets first');
        return;
    }

    const ageRange = ageRangeSelect.value;
    const gender = genderSelect.value;

    if (!ageRange || !gender) {
        showMessage(imageContainer, 'Please select both age range and gender');
        return;
    }

    if (!openaiApiKey) {
        showMessage(imageContainer, 'OpenAI API key not set. Click the ⚙️ Settings button below to add your API key.');
        return;
    }

    showLoading(imageContainer, 'Generating your image...');

    try {
        // First, create the initial prompt
        const initialPrompt = createPrompt(tweets);
        
        // Generate the refined image prompt using GPT-4
        showLoading(imageContainer, 'Creating detailed image prompt...');
        const refinedPrompt = await generateImagePrompt(initialPrompt);
        
        // Generate the final image using the refined prompt
        showLoading(imageContainer, 'Generating final image...');
        const imageUrl = await generateImage(refinedPrompt);
        displayImage(imageUrl);
    } catch (error) {
        showMessage(imageContainer, `Error: ${error.message}`);
    }
});

// Handle Enter key press for tweet fetching
twitterHandle.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchTweetsBtn.click();
    }
});

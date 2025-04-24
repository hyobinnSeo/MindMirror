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
const promptPopup = document.getElementById('prompt-popup');
const promptText = document.querySelector('.prompt-text');
const closePromptBtn = document.querySelector('.close-prompt');
const loadMoreBtn = document.getElementById('load-more-btn');

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
        guide: "Create the scene in the style of a Renaissance oil painting, with rich colors, dramatic lighting, and classical composition techniques. Focus on capturing the character's essence through traditional portraiture methods."
    },
    photography: {
        name: "19th Century Photography",
        guide: "Render the scene as if captured through a vintage camera lens, with characteristic black and white tones. Emphasize authentic composition and lighting typical of early photography while showcasing the character's daily life."
    },
    poster: {
        name: "TV Series Poster",
        guide: "Compose the scene with the sophisticated and contemporary style of streaming platform marketing, featuring high-contrast imagery, and modern digital effects. Focus on creating an atmospheric mood that reflects current entertainment visual trends."
    },
    anime: {
        name: "Anime Style",
        guide: "Create the scene in a anime art style, with expressive features, and characteristic visual elements of the medium. Focus on slice-of-life moments that capture the character's daily activities in an authentic way."
    },
    animation_3D: {
        name: "3D Animation",
        guide: "Create the scene in the style of modern Disney/DreamWorks 3D animation. Use highly polished 3D rendering with exaggerated yet believable proportions.The character should have highly expressive features with slightly enlarged eyes and enhanced emotional range typical of Disney/DreamWorks characters."
    }
};

// Global variables for pagination
let allTweets = [];
let nextCursor = null;
let isLoading = false; // To prevent multiple fetches at the same time
let currentUsername = ''; // To keep track of the current user being fetched

// Load style prompts from localStorage or use defaults
let STYLE_PROMPTS = JSON.parse(localStorage.getItem(STYLE_PROMPTS_STORAGE_KEY)) || DEFAULT_STYLE_PROMPTS;

// Default DALL-E prompt template
const DEFAULT_PROMPT = `
Generate an image depicting a single character's daily life.

Character details:
Gender: {gender}
Age: {age}

Style Guidelines:
Style: {style_name}
Guide: {style_guide}
The important moment from the character's day: {important_moment}

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

// Prompt Popup Handlers
closePromptBtn.addEventListener('click', () => {
    promptPopup.classList.remove('show');
});

promptPopup.addEventListener('click', (e) => {
    if (e.target === promptPopup) {
        promptPopup.classList.remove('show');
    }
});

// Fetch Tweets Function - Modified for Pagination
const fetchTweets = async (username, cursor = null) => {
    // isLoading = true; // Set by caller
    // REMOVE: showLoading(tweetsContainer, 'Fetching tweets...'); // Don't show loading inside container

    let url = `https://twitter-v24.p.rapidapi.com/user/tweets?username=${encodeURIComponent(username)}&limit=40`; // Keep limit reasonable for pagination
    if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': twitterApiKey,
            'X-RapidAPI-Host': 'twitter-v24.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            let errorMsg = 'Failed to fetch tweets';
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || `Error ${response.status}`;
            } catch (e) {
                // Ignore if response is not JSON
                 errorMsg = `Error ${response.status}: ${response.statusText}`;
            }
             throw new Error(errorMsg);
        }
        const result = await response.json();

        // Find the 'TimelineAddEntries' instruction
        const addEntriesInstruction = result?.data?.user_result?.result?.timeline_response?.timeline?.instructions
            ?.find(instruction => instruction.__typename === 'TimelineAddEntries');

        const entries = addEntriesInstruction?.entries || [];

        // Find the bottom cursor for pagination
        const bottomCursorEntry = entries.find(entry => entry.entryId.startsWith('cursor-bottom-'));
        const bottomCursorValue = bottomCursorEntry?.content?.value || null;


        const tweets = entries
            // Filter for actual tweet items (TimelineTweet)
            .filter(entry => entry.content?.__typename === 'TimelineTimelineItem' && entry.content?.content?.__typename === 'TimelineTweet')
            .map(entry => {
                const tweetResult = entry.content?.content?.tweetResult?.result;
                const legacy = tweetResult?.legacy;
                if (!legacy) return null;

                return {
                    text: legacy.full_text,
                    creation_date: legacy.created_at,
                    retweet_count: legacy.retweet_count,
                    favorite_count: legacy.favorite_count
                };
            })
            // Also extract tweets from TimelineTimelineModule if they exist
            .concat(
                 entries
                    .filter(entry => entry.content?.__typename === 'TimelineTimelineModule' && entry.content?.items?.length > 0)
                    .flatMap(moduleEntry => moduleEntry.content.items
                        .map(item => item.item?.content) // Get the content of each item
                        .filter(content => content?.__typename === 'TimelineTweet') // Filter for tweets within the module
                        .map(tweetContent => {
                             const tweetResult = tweetContent.tweetResult?.result;
                             const legacy = tweetResult?.legacy;
                             if (!legacy) return null;
                             return {
                                text: legacy.full_text,
                                creation_date: legacy.created_at,
                                retweet_count: legacy.retweet_count,
                                favorite_count: legacy.favorite_count
                            };
                        })
                    )
             )
            .filter(tweet => tweet && !tweet.text.trim().startsWith('RT')); // Filter out nulls and retweets

        // isLoading = false; // Reset by caller in finally block
        // REMOVE: Clear messages logic from here
        /*
         if (tweets.length > 0 || !bottomCursorValue) {
            clearMessages(tweetsContainer);
         }
        */

        return { results: tweets, cursor: bottomCursorValue };
    } catch (error) {
        // Error is handled within fetchTweets (console log), show message here
        showMessage(tweetsContainer, `Failed to load tweets: ${error.message}`, 'error');
        console.error("Error fetching tweets:", error);
        throw error; // Re-throw the error
    }
};

// Get Important Moment from GPT-4
const getImportantMoment = async (tweets) => {
    const tweetTexts = tweets.map(tweet => tweet.text).join('\n');
    
    // Remove URLs, mentions, and hashtags
    const cleanText = tweetTexts
        .replace(/https?:\/\/\S+/g, '')
        .replace(/@\w+/g, '')
        .replace(/#\w+/g, '')
        .trim();

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
                content: `
                Review a user's thoughts from a single day and create a specific visual scene of the most meaningful moment. Structure your response as follows:

Physical location: (indoor/outdoor, specific setting)
Time of day and lighting conditions:
Weather: (if applicable)
Character's physical actions: (Describe what the person is physically doing)
Key objects or props in the scene: (List 3-4 relevant items in the scene)
Any relevant background elements

Describe this scene in a single paragraph focusing ONLY on visible, concrete details. Avoid mentioning thoughts, feelings, or abstract concepts.

### Implementation Tips:
1. Include specific instruction to avoid abstract concepts, internal monologues, or philosophical reflections
2. Request exact physical details that can be visualized
3. Break down the scene into concrete components (location, lighting, actions, objects)
4. Focus on observable emotional states rather than internal feelings
5. Use time of day and weather to help set the mood without being abstract
6. Require specific objects and props that can anchor the scene
7. Limit the description to what could be captured in a single photograph or painting

Below are the thoughts the user had today:
                `
            }, {
                role: "user",
                content: cleanText
            }]
        })
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to analyze tweets');
        }
        const result = await response.json();
        return result.choices[0].message.content;
    } catch (error) {
        throw error;
    }
};

// Create Image Prompt
const createPrompt = (importantMoment) => {
    // Get user's age range and gender
    const ageRange = ageRangeSelect.value;
    const gender = genderSelect.value;
    const style = STYLE_PROMPTS[selectedStyle];

    return DEFAULT_PROMPT
        .replace('{important_moment}', importantMoment)
        .replace('{age}', ageRange)
        .replace('{gender}', gender)
        .replace('{style_name}', style.name)
        .replace('{style_guide}', style.guide)
        .replace('{additional_prompt}', additionalPromptInput.value.trim() || 'None');
};

// Generate Image from OpenAI
const generateImage = async (prompt) => {
    // Validate DALL-E prompt length
    if (prompt.length > MAX_PROMPT_LENGTH) {
        throw new Error(`Prompt exceeds DALL-E's ${MAX_PROMPT_LENGTH} character limit`);
    }

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
    // Clear previous messages of the same type or loading messages
    clearMessages(container, type);
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type); // Add type class
    messageElement.textContent = message;
    container.appendChild(messageElement); // Append new message
};

// Helper to clear messages
const clearMessages = (container, type = null) => {
    const selector = type ? `.message.${type}` : '.message, .loading'; // Select specific type or all messages/loading
     const messages = container.querySelectorAll(selector);
     messages.forEach(msg => msg.remove());
};

// Display Image with Prompt
const displayImage = (imageUrl, prompt) => {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = "Generated visualization";
    img.addEventListener('click', () => {
        promptText.textContent = prompt;
        promptPopup.classList.add('show');
    });
    
    imageContainer.innerHTML = '';
    imageContainer.appendChild(img);
};

// Display Tweets Function - Modified to append tweets
const displayTweets = (tweets) => {
    // Don't clear the container here, just append new tweets
    if (!tweets || tweets.length === 0) {
         // Optionally show a message if no new tweets were found in this batch
         // showMessage(tweetsContainer, 'No more tweets found.', 'info');
         return;
     }

    tweets.forEach(tweet => {
        const tweetElement = document.createElement('div');
        tweetElement.classList.add('tweet');

        const textElement = document.createElement('p');
        textElement.textContent = tweet.text;
        tweetElement.appendChild(textElement);

        const metaElement = document.createElement('div');
        metaElement.classList.add('tweet-meta');

        const dateElement = document.createElement('span');
        dateElement.textContent = `📅 ${new Date(tweet.creation_date).toLocaleString()}`;
        metaElement.appendChild(dateElement);

        const retweetElement = document.createElement('span');
        retweetElement.textContent = `🔁 ${tweet.retweet_count}`;
        metaElement.appendChild(retweetElement);

        const favoriteElement = document.createElement('span');
        favoriteElement.textContent = `❤️ ${tweet.favorite_count}`;
        metaElement.appendChild(favoriteElement);

        tweetElement.appendChild(metaElement);
        tweetsContainer.appendChild(tweetElement);
    });
};

// Fetch Tweets Button Handler - Modified to ONLY set up for loading
fetchTweetsBtn.addEventListener('click', async () => {
    const username = twitterHandle.value.trim();
    if (!username) {
        showMessage(tweetsContainer, 'Please enter a Twitter username.');
        return;
    }
     if (!twitterApiKey) {
         showMessage(tweetsContainer, 'Please enter your RapidAPI key in Settings.');
         return;
     }

    // Reset state for new user fetch
    allTweets = [];
    nextCursor = null; // Reset cursor for the first load via button
    isLoading = false;
    currentUsername = username; // Store the username for button fetches
    tweetsContainer.innerHTML = ''; // Clear previous tweets
    imageContainer.innerHTML = ''; // Clear previous image
    clearMessages(tweetsContainer); // Clear any previous messages

    // Prepare and show the Load More button for the initial load
    loadMoreBtn.textContent = 'Load Tweets';
    loadMoreBtn.disabled = false;
    loadMoreBtn.style.display = 'block';

    // DO NOT fetch tweets automatically here.
    // User must click the "Load Tweets" button.
});

// Generate Image Button Handler
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

    showLoading(imageContainer, 'Analyzing tweets...');

    try {
        // First, get the most important moment from the tweets
        const importantMoment = await getImportantMoment(tweets);
        
        // Create the prompt with the important moment
        showLoading(imageContainer, 'Creating image...');
        const prompt = createPrompt(importantMoment);
        
        // Generate the image using DALL-E 3
        const imageUrl = await generateImage(prompt);
        displayImage(imageUrl, prompt);
    } catch (error) {
        showMessage(imageContainer, `Error: ${error.message}`);
    }
});

// Load More Tweets Button Handler - Handles both initial and subsequent loads
loadMoreBtn.addEventListener('click', async () => {
    if (isLoading || !currentUsername) {
        // Added !currentUsername check here as well
        return; // Do nothing if already loading or no username set
    }

    isLoading = true;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading...';
    clearMessages(tweetsContainer, 'info'); // Clear previous info messages
    clearMessages(tweetsContainer, 'error'); // Clear previous error messages

    try {
        // Fetch tweets. Loading indicator is the button state.
        const newData = await fetchTweets(currentUsername, nextCursor);

        if (newData.results.length > 0) {
            // If it was the first load and successful, clear any potential initial message
            if (allTweets.length === 0) {
                 // This might not be needed anymore if fetchTweetsBtn doesn't show messages
                 // clearMessages(tweetsContainer, 'info');
            }
            allTweets = allTweets.concat(newData.results); // Add new tweets to the global list
            displayTweets(newData.results); // Display only the newly fetched tweets
        } else if (allTweets.length === 0) {
             // Handle case where the FIRST load attempt returned no tweets
             showMessage(tweetsContainer, 'No tweets found for this user.', 'info');
        } else {
            // Handle case where subsequent load attempt returned no new tweets
            showMessage(tweetsContainer, 'No more tweets found.', 'info');
        }

        nextCursor = newData.cursor; // Update cursor

        if (!nextCursor) {
            loadMoreBtn.style.display = 'none'; // Hide button if no more cursors
            // Only show 'All loaded' if we actually loaded some tweets
             if (allTweets.length > 0 && newData.results.length === 0) {
                 // Avoid showing 'All loaded' if the *very first* load returned nothing
                 // Show 'All loaded' only if we previously had tweets and this load found none
                 showMessage(tweetsContainer, 'All tweets loaded.', 'info');
            } else if (allTweets.length > 0 && !newData.cursor) {
                 // Also show if the last batch had tweets but no more cursor
                 showMessage(tweetsContainer, 'All tweets loaded.', 'info');
            }
        } else {
            // Re-enable button for next click
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = 'Load More Tweets'; // Change text after first load
            loadMoreBtn.style.display = 'block'; // Ensure it's visible
        }
    } catch (error) {
        // Error is handled within fetchTweets (console log), show message here
        showMessage(tweetsContainer, `Failed to load tweets: ${error.message}`, 'error');
        console.error("Error fetching more tweets on click:", error);
        // Reset button state on error so user can potentially retry
        loadMoreBtn.disabled = false;
        // Reset text based on whether it was the initial load or not
        loadMoreBtn.textContent = allTweets.length === 0 ? 'Load Tweets' : 'Load More Tweets';
         // Keep the button visible to allow retry attempts
         loadMoreBtn.style.display = 'block';
    } finally {
         isLoading = false; // Ensure loading state is reset
    }
});

// Initial check if keys are missing and modal should be shown
if (!twitterApiKey || !openaiApiKey) {
     settingsModal.classList.add('show');
     showMessage(tweetsContainer, 'Welcome! Please enter your API keys in the Settings (⚙️).', 'info');
}

// Handle Enter key press for tweet fetching
twitterHandle.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchTweetsBtn.click();
    }
});

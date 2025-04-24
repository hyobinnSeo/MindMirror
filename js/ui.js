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
const googleApiKeyInput = document.getElementById('google-api-key');
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

// --- Cache Confirm Modal Elements ---
const cacheConfirmModal = document.getElementById('cache-confirm-modal');
const cacheConfirmMessage = document.getElementById('cache-confirm-message');
const useCacheBtn = document.getElementById('use-cache-btn');
const fetchNewBtn = document.getElementById('fetch-new-btn');
// const closeCacheModalBtn = document.getElementById('close-cache-modal'); // If you add a close button

// Display Loading State
const showLoading = (container, message) => {
    container.innerHTML = `
        <div class="generating loading">
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
    let selector;
    if (type === 'loading') {
        selector = '.loading'; // Target only the loading class
    } else if (type) {
        selector = `.message.${type}`; // Target message with specific type
    } else {
        selector = '.message, .loading'; // Target all messages and loading (when type is null)
    }
     const messages = container.querySelectorAll(selector);
     messages.forEach(msg => msg.remove());
};

// Display Image with Prompt
const displayImage = (imageUrl, prompt) => {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = "생성된 시각화"; // 한국어 alt 텍스트로 변경
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

// --- Modal and Popup Handlers (Moved from main script) ---

// --- Cache Confirm Modal Handler ---
let cacheConfirmResolve = null;
let cacheConfirmReject = null;

// Function to show the cache confirmation modal
function showCacheConfirmPopup(username) {
    return new Promise((resolve, reject) => {
        cacheConfirmResolve = resolve;
        cacheConfirmReject = reject;

        cacheConfirmMessage.textContent = `오늘 @${username} 님의 트윗을 가져온 기록이 있습니다. 어떻게 하시겠습니까?`;

        // Ensure listeners are clean before adding new ones
        useCacheBtn.removeEventListener('click', handleUseCacheClick);
        fetchNewBtn.removeEventListener('click', handleFetchNewClick);
        // If using a close button or clicking outside:
        // closeCacheModalBtn?.removeEventListener('click', handleFetchNewClick);
        cacheConfirmModal.removeEventListener('click', handleOutsideClick); // Remove listener for outside click

        // Add listeners
        useCacheBtn.addEventListener('click', handleUseCacheClick);
        fetchNewBtn.addEventListener('click', handleFetchNewClick);
        // If using a close button or clicking outside:
        // closeCacheModalBtn?.addEventListener('click', handleFetchNewClick); // Treat close as fetch new
        cacheConfirmModal.addEventListener('click', handleOutsideClick); // Add listener for outside click

        cacheConfirmModal.classList.add('show');
    });
}

// Helper to hide the modal and clean up listeners
function hideCacheConfirmPopup() {
    cacheConfirmModal.classList.remove('show');
    useCacheBtn.removeEventListener('click', handleUseCacheClick);
    fetchNewBtn.removeEventListener('click', handleFetchNewClick);
    // closeCacheModalBtn?.removeEventListener('click', handleFetchNewClick);
    cacheConfirmModal.removeEventListener('click', handleOutsideClick); // Remove listener for outside click
    cacheConfirmResolve = null; // Clear stored promise functions
    cacheConfirmReject = null;
}

// Handlers for the modal buttons
function handleUseCacheClick() {
    if (cacheConfirmResolve) {
        cacheConfirmResolve(); // Resolve the promise (indicates use cache)
    }
    hideCacheConfirmPopup();
}

function handleFetchNewClick() {
    if (cacheConfirmReject) {
        cacheConfirmReject('fetchNew'); // Reject the promise with 'fetchNew' status
    }
    hideCacheConfirmPopup();
}

// Handler for dismissing (e.g., clicking outside)
function handleDismissClick() {
    if (cacheConfirmReject) {
        cacheConfirmReject('dismiss'); // Reject the promise with 'dismiss' status
    }
    hideCacheConfirmPopup();
}

// Optional: Handler for clicking outside the modal content
// /* -> Remove comment start
function handleOutsideClick(e) {
    // Check if the click target is the modal overlay itself
    if (e.target === cacheConfirmModal) {
        handleDismissClick(); // Treat clicking outside as dismiss
    }
}
// */ -> Remove comment end

// Initialize UI based on settings (needs settings values from main.js or localStorage)
function initializeUIElements(twApiKey, oaApiKey, gaApiKey, selStyle) {
    if (twApiKey) twitterApiKeyInput.value = twApiKey;
    if (oaApiKey) openaiApiKeyInput.value = oaApiKey;
    if (gaApiKey) googleApiKeyInput.value = gaApiKey;
    if (selStyle) {
        imageStyleSelect.value = selStyle;
        settingsStyleSelect.value = selStyle;
        // Initialize style prompt input requires STYLE_PROMPTS from config.js
        // This dependency needs careful handling later in main.js
        if (typeof STYLE_PROMPTS !== 'undefined') {
            stylePromptInput.value = STYLE_PROMPTS[selStyle]?.guide || '';
        }
    }
}

// Settings Modal Handlers
function setupSettingsModalHandlers() {
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('show');
    });

    closeModalBtn.addEventListener('click', () => {
        settingsModal.classList.remove('show');
    });

    // Save button handled in main.js as it modifies settings state

    // Reset prompt button needs DEFAULT_STYLE_PROMPTS from config.js
    resetPromptBtn.addEventListener('click', () => {
        const currentStyle = settingsStyleSelect.value;
        if (typeof DEFAULT_STYLE_PROMPTS !== 'undefined' && DEFAULT_STYLE_PROMPTS[currentStyle]) {
             stylePromptInput.value = DEFAULT_STYLE_PROMPTS[currentStyle].guide;
        }
    });

    // Update style prompt input when style selection changes in settings
    settingsStyleSelect.addEventListener('change', () => {
        const style = settingsStyleSelect.value;
        // Requires STYLE_PROMPTS from config.js
        if (typeof STYLE_PROMPTS !== 'undefined' && STYLE_PROMPTS[style]) {
             stylePromptInput.value = STYLE_PROMPTS[style].guide;
        }
    });

    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
        }
    });
}

// Prompt Popup Handlers
function setupPromptPopupHandlers() {
    closePromptBtn.addEventListener('click', () => {
        promptPopup.classList.remove('show');
    });

    promptPopup.addEventListener('click', (e) => {
        if (e.target === promptPopup) {
            promptPopup.classList.remove('show');
        }
    });
} 
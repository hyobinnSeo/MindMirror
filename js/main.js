// Global variables for application state
let allTweets = [];
let nextCursor = null;
let isLoading = false; // To prevent multiple fetches at the same time
let currentUsername = ''; // To keep track of the current user being fetched
let isAutoLoadProcessComplete = false; // Track completion of the auto-load phase

// Load settings from localStorage - Use constants from config.js
let twitterApiKey = localStorage.getItem(TWITTER_API_KEY_STORAGE_KEY) || '';
let openaiApiKey = localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) || '';
let googleApiKey = localStorage.getItem(GOOGLE_AI_API_KEY_STORAGE_KEY) || '';
let selectedStyle = localStorage.getItem(IMAGE_STYLE_STORAGE_KEY) || 'cinematic';

// Update localStorage when style changes
imageStyleSelect.addEventListener('change', () => {
    selectedStyle = imageStyleSelect.value;
    localStorage.setItem(IMAGE_STYLE_STORAGE_KEY, selectedStyle);
});


// Save Settings Handler (references UI elements and config constants)
saveSettingsBtn.addEventListener('click', () => {
    twitterApiKey = twitterApiKeyInput.value.trim();
    openaiApiKey = openaiApiKeyInput.value.trim();
    googleApiKey = googleApiKeyInput.value.trim();

    // Save API keys
    localStorage.setItem(TWITTER_API_KEY_STORAGE_KEY, twitterApiKey);
    localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, openaiApiKey);
    localStorage.setItem(GOOGLE_AI_API_KEY_STORAGE_KEY, googleApiKey);

    // Save style prompt (references STYLE_PROMPTS from config.js)
    const currentStyle = settingsStyleSelect.value;
    if (STYLE_PROMPTS && STYLE_PROMPTS[currentStyle]) {
        STYLE_PROMPTS[currentStyle].guide = stylePromptInput.value.trim();
        localStorage.setItem(STYLE_PROMPTS_STORAGE_KEY, JSON.stringify(STYLE_PROMPTS));
    } else {
        console.error("Cannot save style prompt: STYLE_PROMPTS not loaded or style key invalid");
    }

    settingsModal.classList.remove('show');

    // Show success message in tweets container (uses UI function)
    showMessage(tweetsContainer, '설정이 성공적으로 저장되었습니다!', 'success');
});

// Create Image Prompt (references UI elements and config maps/prompts)
const createPrompt = (importantMoment) => {
    // Get user's age range and gender values
    const ageValue = ageRangeSelect.value;
    const genderValue = genderSelect.value;
    const style = STYLE_PROMPTS[selectedStyle]; // Uses STYLE_PROMPTS from config.js

    if (!style) {
        console.error(`Selected style '${selectedStyle}' not found in STYLE_PROMPTS.`);
        // Provide a default or throw an error?
        throw new Error(`선택된 스타일 '${selectedStyle}' 설정을 찾을 수 없습니다.`);
    }

    // Map values to Korean text (uses maps from config.js)
    const koreanAge = AGE_MAP_KR[ageValue] || ageValue; // 기본값으로 원래 value 사용
    const koreanGender = GENDER_MAP_KR[genderValue] || genderValue; // 기본값으로 원래 value 사용

    // Uses DEFAULT_PROMPT from config.js
    return DEFAULT_PROMPT
        .replace('{important_moment}', importantMoment)
        .replace('{age}', koreanAge) // 한국어 나이대로 변경
        .replace('{gender}', koreanGender) // 한국어 성별로 변경
        .replace('{style_name}', style.name)
        .replace('{style_guide}', style.guide)
        .replace('{additional_prompt}', additionalPromptInput.value.trim() || '없음'); // 'None'을 '없음'으로 변경
};


// Function to automatically load tweets up to the limit (100) or max 5 calls
async function loadTweetsAutomatically() {
    if (!currentUsername) return;
    let autoLoadError = false;
    let apiCallCount = 0; // Counter for API calls

    // Show initial loading message (uses UI function)
    showLoading(tweetsContainer, '초기 트윗 자동 로딩 중...');

    // Loop while under tweet limit (100), under call limit (5), and potentially more tweets exist
    while (allTweets.length < 100 && apiCallCount < 5) {
        if (isLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
        }
        // Stop if not the first load and no more cursor exists
        if (allTweets.length > 0 && !nextCursor) {
            break;
        }

        isLoading = true;

        try {
            apiCallCount++; // Increment API call counter
            const cursorToUse = (allTweets.length === 0) ? null : nextCursor;
            // Uses API function
            const newData = await fetchTweets(currentUsername, cursorToUse, twitterApiKey);

            if (newData.results.length > 0) {
                allTweets = allTweets.concat(newData.results);
                displayTweets(newData.results); // Uses UI function
            } else if (allTweets.length === 0) {
                clearMessages(tweetsContainer); // Uses UI function
                showMessage(tweetsContainer, '이 사용자에 대한 트윗을 찾을 수 없습니다.', 'info'); // Uses UI function
                break;
            }

            nextCursor = newData.cursor; // Update cursor

            // Stop if there's no next cursor
            if (!nextCursor) {
                break;
            }

            // Small delay only if we are continuing the loop AND haven't hit the call limit yet
            if (allTweets.length < 100 && apiCallCount < 5) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }

        } catch (error) {
            console.error("자동 트윗 로딩 중 오류:", error); // 한국어 콘솔 메시지로 변경
            clearMessages(tweetsContainer); // Uses UI function
            showMessage(tweetsContainer, `자동 트윗 로딩 오류: ${error.message}.`, 'error'); // Uses UI function
            autoLoadError = true;
            break;
        } finally {
            isLoading = false;
        }
    } // End while loop

    // --- Post-Automatic Load Logic ---
    isLoading = false; // Ensure flag is reset

    // Clear the main loading spinner AFTER the loop finishes
    if (!(autoLoadError && allTweets.length === 0)) {
         clearMessages(tweetsContainer, 'loading'); // Uses UI function
    }

    // Uses UI function (showMessage)
    if (!autoLoadError) {
        if (apiCallCount >= 5 && allTweets.length < 100) {
            // Stopped by call limit BEFORE reaching tweet limit
            showMessage(tweetsContainer, `${apiCallCount}번의 API 호출 후 ${allTweets.length}개의 트윗을 로드했습니다 (호출 제한 도달).`, 'info'); // 한국어 메시지로 변경
        } else if (allTweets.length >= 100 && nextCursor) {
            // Stopped by tweet limit, more were available (cursor exists)
            showMessage(tweetsContainer, `자동으로 ${allTweets.length}개의 트윗을 로드했습니다 (제한 도달).`, 'info'); // 한국어 메시지로 변경
        } else if (!nextCursor && allTweets.length > 0) {
            // Stopped because no more tweets available (no cursor)
             // Check if we stopped exactly at the call limit without reaching 100 tweets
             if (apiCallCount >= 5 && allTweets.length < 100) {
                 // Message already handled above
             } else {
                 showMessage(tweetsContainer, `사용 가능한 모든 ${allTweets.length}개의 트윗을 로드했습니다.`, 'info'); // 한국어 메시지로 변경
             }
        } else if (!nextCursor && allTweets.length === 0) {
            // Stopped because no tweets were found at all (message handled in loop)
        }
        // The case where allTweets.length >= 100 AND !nextCursor is covered by the third condition

        // --- Cache Saving Logic ---
        if (allTweets.length > 0) { // Only save if we actually got tweets
             const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
             const cacheKey = `mindMirrorCache_${currentUsername}`;
             const dataToCache = {
                 date: today,
                 tweets: allTweets
                 // cursor: nextCursor // Optionally cache the cursor too
             };
             try {
                 localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
                 console.log(`성공적으로 @${currentUsername}의 트윗 ${allTweets.length}개를 캐시에 저장했습니다.`);
             } catch (error) {
                 console.error("캐시 저장 오류:", error);
                 // Inform user? Maybe not necessary, just log it.
             }
        }
        // --- End Cache Saving ---

    } else {
        // Error occurred during auto-load
    }

    // Set the flag indicating the auto-load process is complete
    isAutoLoadProcessComplete = true;
}

// Fetch Tweets Button Handler - Initiates automatic loading
fetchTweetsBtn.addEventListener('click', async () => {
    const username = twitterHandle.value.trim();
    if (!username) {
        showMessage(tweetsContainer, '트위터 사용자 이름을 입력하세요.'); // 한국어 메시지로 변경
        return;
    }
     if (!twitterApiKey) {
         showMessage(tweetsContainer, '설정에서 RapidAPI 키를 입력하세요.'); // 한국어 메시지로 변경
         return;
     }

    // --- Cache Check Logic ---
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const cacheKey = `mindMirrorCache_${username}`;
    try {
        const cachedDataString = localStorage.getItem(cacheKey);
        if (cachedDataString) {
            const cachedData = JSON.parse(cachedDataString);
            if (cachedData.date === today && cachedData.tweets) {
                // --- Use Custom Popup instead of confirm() ---
                try {
                    // Show the custom popup and wait for user choice
                    await showCacheConfirmPopup(username); 
                    // If promise resolves (user clicked '기록 사용'):
                    // Reset state partially but use cached tweets
                    allTweets = cachedData.tweets;
                    nextCursor = null; // Simple reset for now
                    isLoading = false;
                    currentUsername = username;
                    tweetsContainer.innerHTML = ''; // Clear previous tweets
                    imageContainer.innerHTML = ''; // Clear previous image
                    clearMessages(tweetsContainer); // Clear any previous messages

                    // Display cached tweets
                    displayTweets(allTweets);

                    // Show completion message
                    showMessage(tweetsContainer, `캐시에서 ${allTweets.length}개의 트윗을 로드했습니다.`, 'info');
                    isAutoLoadProcessComplete = true; // Mark as complete
                    return; // Skip API fetch
                } catch (error) {
                    // If promise rejects (user clicked '새로 불러오기' or dismissed):
                    if (error === 'dismiss') {
                        // User clicked outside or closed the popup without choosing
                        console.log("사용자가 팝업을 닫았습니다. 작업을 취소합니다.");
                        // Do nothing else, effectively cancelling the fetch operation
                        return; // Exit the handler
                    } else if (error === 'fetchNew') {
                        // User clicked '새로 불러오기'
                        localStorage.removeItem(cacheKey); // Remove outdated cache
                        console.log("사용자가 새로 불러오기를 선택했습니다. 캐시를 삭제하고 새로 가져옵니다.");
                        // Proceed to fetch fresh data (code execution continues below)
                    } else {
                        // Handle other unexpected errors from showCacheConfirmPopup if any
                         console.error("캐시 확인 팝업 처리 중 예상치 못한 오류:", error);
                         // Optionally, proceed to fetch new data or show an error message
                         localStorage.removeItem(cacheKey); // Safely remove cache just in case
                    }
                }
                // --- End Custom Popup Logic ---
            } else {
                // Cache exists but is outdated, remove it before fetching new
                localStorage.removeItem(cacheKey);
            }
        }
    } catch (error) {
        console.error("캐시 로드/처리 중 오류:", error);
        // Proceed to fetch fresh data if cache loading fails
    }
    // --- End Cache Check ---


    // Reset state for new user fetch (if not loaded from cache)
    allTweets = [];
    nextCursor = null; // Reset cursor for the first load
    isLoading = false;
    currentUsername = username; // Store the username
    tweetsContainer.innerHTML = ''; // Clear previous tweets
    imageContainer.innerHTML = ''; // Clear previous image
    clearMessages(tweetsContainer); // Clear any previous messages (uses UI function)

    // Reset completion flag for new fetch
    isAutoLoadProcessComplete = false;

    // Start the automatic loading process
    loadTweetsAutomatically();
});

// Generate Image Button Handler
generateImageBtn.addEventListener('click', async () => {
    // First, check if the automatic loading process has completed
    if (!isAutoLoadProcessComplete) {
        showMessage(imageContainer, '자동 트윗 로딩이 완료될 때까지 기다려 주세요.'); // Uses UI function
        return;
    }

    // Then, check if any tweets were actually loaded
    if (allTweets.length === 0) {
        // Modify the message slightly for clarity after auto-load attempt
        showMessage(imageContainer, '로드된 트윗이 없습니다. 이미지를 생성할 수 없습니다.'); // Uses UI function
        return;
    }

    // Check for both API Keys needed
    if (!googleApiKey) { // Gemini 키 확인
        showMessage(imageContainer, 'Google AI API 키가 설정되지 않았습니다. 아래 ⚙️ 설정 버튼을 클릭하여 API 키를 추가하세요.'); // Uses UI function
        return;
    }
    if (!openaiApiKey) { // DALL-E 키 확인
        showMessage(imageContainer, 'OpenAI API 키(DALL-E용)가 설정되지 않았습니다. 아래 ⚙️ 설정 버튼을 클릭하여 API 키를 추가하세요.'); // Uses UI function
        return;
    }

    showLoading(imageContainer, '트윗 분석 중 (Gemini)...'); // Uses UI function

    try {
        // Pass the allTweets array directly to Gemini (uses API function)
        const importantMoment = await getImportantMoment(allTweets, googleApiKey);

        // Create the prompt with the important moment
        showLoading(imageContainer, '이미지 생성 중 (DALL-E)...'); // Uses UI function
        const prompt = createPrompt(importantMoment); // Uses local function which depends on config/UI

        // Generate the image using DALL-E 3 (uses API function)
        const imageUrl = await generateImage(prompt, openaiApiKey);
        displayImage(imageUrl, prompt); // Uses UI function
    } catch (error) {
        showMessage(imageContainer, `오류: ${error.message}`); // Uses UI function
    }
});

// Handle Enter key press for tweet fetching
twitterHandle.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchTweetsBtn.click(); // Triggers the click handler above
    }
});


// --- Initialization --- //

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI elements with loaded settings
    initializeUIElements(twitterApiKey, openaiApiKey, googleApiKey, selectedStyle);

    // Setup event listeners for UI components
    setupSettingsModalHandlers();
    setupPromptPopupHandlers();

    // Initial check if keys are missing and modal should be shown
    if (!twitterApiKey || !googleApiKey || !openaiApiKey) {
        settingsModal.classList.add('show');
        showMessage(tweetsContainer, '환영합니다! 설정(⚙️)에서 필요한 API 키(RapidAPI, Google AI, OpenAI)를 모두 입력해 주세요.', 'info'); // Uses UI function
    }
}); 
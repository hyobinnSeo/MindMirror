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

// Constants
const TWITTER_API_KEY_STORAGE_KEY = 'twitter_api_key';
const OPENAI_API_KEY_STORAGE_KEY = 'openai_api_key';
const GOOGLE_AI_API_KEY_STORAGE_KEY = 'google_ai_api_key';
const IMAGE_STYLE_STORAGE_KEY = 'image_style';
const STYLE_PROMPTS_STORAGE_KEY = 'style_prompts';
const MAX_PROMPT_LENGTH = 4000;

// Default Image Style Prompts (한국어)
const DEFAULT_STYLE_PROMPTS = {
    cinematic: {
        name: "시네마틱 리얼리즘",
        guide: "생생한 디테일과 현대적인 터치를 혼합하여 사실주의 스타일로 장면을 만듭니다. 차분한 톤, 부드러운 질감, 분위기 있는 환경을 사용하여 캐릭터의 일상 생활을 시네마틱하게 보여줍니다."
    },
    renaissance: {
        name: "르네상스 유화",
        guide: "풍부한 색상, 고전적인 구도 기법을 사용하여 르네상스 유화 스타일로 장면을 만듭니다. 전통적인 초상화 기법을 통해 캐릭터의 일상 생활을 보여줍니다."
    },
    photography: {
        name: "19세기 사진",
        guide: "특징적인 흑백 톤의 빈티지 카메라 렌즈를 통해 포착된 것처럼 장면을 렌더링합니다. 초기 사진의 전형적인 구도를 강조하면서 캐릭터의 일상 생활을 보여줍니다."
    },
    poster: {
        name: "TV 시리즈 포스터",
        guide: "현대적인 효과를 특징으로 하는 스트리밍 플랫폼 마케팅의 세련되고 현대적인 TV 시리즈 포스터 스타일로 장면을 구성합니다. 현재 엔터테인먼트 시각 트렌드를 반영하는 분위기를 만들어 캐릭터의 일상 생활을 보여줍니다."
    },
    anime: {
        name: "애니메이션 스타일",
        guide: "풍부한 표현과 시각적 요소를 사용하여 일본 애니메이션 아트 스타일로 장면을 만들어 캐릭터의 일상 생활을 보여줍니다."
    },
    animation_3D: {
        name: "3D 애니메이션",
        guide: "현대 디즈니/드림웍스 3D 애니메이션 스타일로 장면을 만들어 캐릭터의 일상 생활을 보여줍니다. 캐릭터는 약간 확대된 눈과 디즈니/드림웍스 캐릭터의 전형적인 특징을 가져야 합니다."
    }
};

// Global variables for pagination
let allTweets = [];
let nextCursor = null;
let isLoading = false; // To prevent multiple fetches at the same time
let currentUsername = ''; // To keep track of the current user being fetched
let isAutoLoadProcessComplete = false; // Track completion of the auto-load phase

// Load style prompts from localStorage or use defaults
let STYLE_PROMPTS = JSON.parse(localStorage.getItem(STYLE_PROMPTS_STORAGE_KEY)) || DEFAULT_STYLE_PROMPTS;

// Default DALL-E prompt template (한국어)
const DEFAULT_PROMPT = `
아래의 정보에 기반하여 캐릭터의 일상 생활을 묘사하는 이미지를 생성합니다.

캐릭터 세부 정보:
성별: {gender}
나이: {age}

스타일 가이드라인:
스타일: {style_name}
가이드: {style_guide}
캐릭터 하루 중 중요한 순간: {important_moment}

추가 요구 사항: {additional_prompt}`;

// Load settings from localStorage
let twitterApiKey = localStorage.getItem(TWITTER_API_KEY_STORAGE_KEY) || '';
let openaiApiKey = localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) || '';
let googleApiKey = localStorage.getItem(GOOGLE_AI_API_KEY_STORAGE_KEY) || '';
let selectedStyle = localStorage.getItem(IMAGE_STYLE_STORAGE_KEY) || 'cinematic';

// Initialize form values
if (twitterApiKey) twitterApiKeyInput.value = twitterApiKey;
if (openaiApiKey) openaiApiKeyInput.value = openaiApiKey;
if (googleApiKey) googleApiKeyInput.value = googleApiKey;
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
    googleApiKey = googleApiKeyInput.value.trim();
    
    // Save API keys
    localStorage.setItem(TWITTER_API_KEY_STORAGE_KEY, twitterApiKey);
    localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, openaiApiKey);
    localStorage.setItem(GOOGLE_AI_API_KEY_STORAGE_KEY, googleApiKey);
    
    // Save style prompt
    const currentStyle = settingsStyleSelect.value;
    STYLE_PROMPTS[currentStyle].guide = stylePromptInput.value.trim();
    localStorage.setItem(STYLE_PROMPTS_STORAGE_KEY, JSON.stringify(STYLE_PROMPTS));
    
    settingsModal.classList.remove('show');
    
    // Show success message in tweets container (한국어)
    showMessage(tweetsContainer, '설정이 성공적으로 저장되었습니다!', 'success');
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

    let url = `https://twitter-v24.p.rapidapi.com/user/tweets?username=${encodeURIComponent(username)}&limit=100`; // Changed limit to 100
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
            let errorMsg = '트윗을 가져오지 못했습니다'; // 한국어 메시지로 변경
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || `오류 ${response.status}`;
            } catch (e) {
                // Ignore if response is not JSON
                 errorMsg = `오류 ${response.status}: ${response.statusText}`;
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
        // Error is handled within fetchTweets (console log), show message here (한국어)
        showMessage(tweetsContainer, `트윗 로드 실패: ${error.message}`, 'error');
        console.error("트윗 가져오기 오류:", error); // 한국어 콘솔 메시지로 변경
        throw error; // Re-throw the error
    }
};

// Get Important Moment from Google AI (Gemini)
const getImportantMoment = async (tweets) => {
    if (!googleApiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 설정에서 키를 입력하세요.');
    }

    const tweetTexts = tweets.map(tweet => tweet.text).join('\n');

    // Remove URLs, mentions, and hashtags
    const cleanText = tweetTexts
        .replace(/https?:\/\/\S+/g, '')
        .replace(/@\w+/g, '')
        .replace(/#\w+/g, '')
        .trim();

    // Gemini API endpoint (Attempting to use the specific preview model)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-03-25:generateContent?key=${googleApiKey}`;

    // Combine system prompt and user text for Gemini
    const promptTextContent = `
당신은 한 캐릭터의 관찰자이며 이 캐릭터의 일상을 그리는 일러스트레이터에게 전달할 장면 지침을 완성해야합니다. 아래의 지시에 따라 캐릭터가 하루 동안 떠올린 생각을 검토하고 하루 중 가장 중요한 순간을 포착한 시각적 장면의 지침을 완성하세요.

[구현 팁]
1. 일러스트레이터가 장면을 그릴 수 있도록 시각적이고 구체적인 정보에 집중하세요. 추상적인 개념이나 내적 독백 또는 철학적 성찰을 피하세요.
2. 시각화할 수 있는 정확한 물리적 세부 정보를 포함하세요.
3. 장면을 구체적인 구성 요소(위치, 조명, 행동, 물체)로 분해하세요.
4. 내적 감정보다는 관찰 가능한 상태에 집중하세요.
5. 배경적 정보를 사용하여 추상적이지 않게 분위기를 설정하세요.
6. 장면에 특징을 더할 수 있는 특정 물체 및 소품 등을 작성하세요.
7. 일러스트레이터가 한 특정 장면의 스냅샷을 그릴 수 있도록 장면 지침을 단일 사진 또는 그림으로 캡처할 수 있는 설명으로 작성하세요.

[출력 형식]
물리적 위치: (실내/실외 또는 특정 장소 설정)
시간, 날씨 및 조명 조건: (아침, 낮, 저녁, 밤 등, 날씨나 조명은 필요할 경우)
인물의 물리적 행동: (캐릭터가 육체적으로 무엇을 하고 있는지 설명)
장면 속 주요 사물 또는 소품: (장면과 관련된 3-4가지 항목 나열)
관련 배경 요소: (장면과 관련된 추가 요소 나열)

아래는 오늘 사용자가 한 생각입니다:
${cleanText}
    `;

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: promptTextContent
                }]
            }],
            // Optional: Add generation config if needed
            // generationConfig: {
            //     "temperature": 0.7,
            //     "topP": 1.0,
            //     "topK": 40
            // }
        })
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            let errorMsg = '트윗 분석 실패 (Google AI)'; // 오류 메시지 업데이트
            try {
                const errorData = await response.json();
                // Google AI API 오류 구조에 따라 메시지 추출 시도
                errorMsg = errorData?.error?.message || `HTTP 오류 ${response.status}`;
            } catch (e) {
                 errorMsg = `HTTP 오류 ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMsg);
        }
        const result = await response.json();

        // Extract text from the first candidate's content parts
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
             // Handle cases where the expected response structure is missing
             console.error("Google AI 응답 구조 예상과 다름:", result); // 한국어 콘솔 메시지로 변경
             throw new Error('Google AI로부터 유효한 응답을 받지 못했습니다.'); // 한국어 오류 메시지로 변경
        }
    } catch (error) {
        console.error("Google AI 호출 오류:", error); // 한국어 콘솔 메시지로 변경
        throw error; // Re-throw the error
    }
};

// 한글 값 매핑 객체 추가
const AGE_MAP_KR = {
    '10s': '10대',
    '20s': '20대',
    '30s': '30대',
    '40s': '40대',
    '50s': '50대',
    '60s_plus': '60대 이상',
    '': '선택 안함'
};

const GENDER_MAP_KR = {
    'female': '여성',
    'male': '남성',
    'unspecified': '미기재',
    '': '선택 안함'
};

// Create Image Prompt
const createPrompt = (importantMoment) => {
    // Get user's age range and gender values
    const ageValue = ageRangeSelect.value;
    const genderValue = genderSelect.value;
    const style = STYLE_PROMPTS[selectedStyle];

    // Map values to Korean text
    const koreanAge = AGE_MAP_KR[ageValue] || ageValue; // 기본값으로 원래 value 사용
    const koreanGender = GENDER_MAP_KR[genderValue] || genderValue; // 기본값으로 원래 value 사용

    return DEFAULT_PROMPT
        .replace('{important_moment}', importantMoment)
        .replace('{age}', koreanAge) // 한국어 나이대로 변경
        .replace('{gender}', koreanGender) // 한국어 성별로 변경
        .replace('{style_name}', style.name)
        .replace('{style_guide}', style.guide)
        .replace('{additional_prompt}', additionalPromptInput.value.trim() || '없음'); // 'None'을 '없음'으로 변경
};

// Generate Image from OpenAI (DALL-E) - 이 함수는 OpenAI API 키를 계속 사용
const generateImage = async (prompt) => {
     if (!openaiApiKey) { // DALL-E 키 확인
         throw new Error('OpenAI API 키(DALL-E용)가 설정되지 않았습니다. 설정에서 키를 입력하세요.');
     }
    // Validate DALL-E prompt length
    if (prompt.length > MAX_PROMPT_LENGTH) {
        throw new Error(`프롬프트가 DALL-E의 ${MAX_PROMPT_LENGTH}자 제한을 초과합니다`); // 한국어 오류 메시지로 변경
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
            throw new Error(error.error?.message || '이미지 생성 실패'); // 한국어 오류 메시지로 변경
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

// Function to automatically load tweets up to the limit (100) or max 5 calls
async function loadTweetsAutomatically() {
    if (!currentUsername) return;
    let autoLoadError = false;
    let apiCallCount = 0; // Counter for API calls

    // Show initial loading message (한국어)
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
            const newData = await fetchTweets(currentUsername, cursorToUse);

            if (newData.results.length > 0) {
                allTweets = allTweets.concat(newData.results);
                displayTweets(newData.results); 
            } else if (allTweets.length === 0) {
                clearMessages(tweetsContainer); 
                showMessage(tweetsContainer, '이 사용자에 대한 트윗을 찾을 수 없습니다.', 'info'); // 한국어 메시지로 변경
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
            clearMessages(tweetsContainer); 
            showMessage(tweetsContainer, `자동 트윗 로딩 오류: ${error.message}.`, 'error'); // 한국어 메시지로 변경
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
         clearMessages(tweetsContainer, 'loading');
    }

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

    // Reset state for new user fetch
    allTweets = [];
    nextCursor = null; // Reset cursor for the first load
    isLoading = false;
    currentUsername = username; // Store the username
    tweetsContainer.innerHTML = ''; // Clear previous tweets
    imageContainer.innerHTML = ''; // Clear previous image
    clearMessages(tweetsContainer); // Clear any previous messages

    // Reset completion flag for new fetch
    isAutoLoadProcessComplete = false; 

    // Start the automatic loading process
    loadTweetsAutomatically(); 
});

// Generate Image Button Handler
generateImageBtn.addEventListener('click', async () => {
    // First, check if the automatic loading process has completed
    if (!isAutoLoadProcessComplete) {
        showMessage(imageContainer, '자동 트윗 로딩이 완료될 때까지 기다려 주세요.'); // 한국어 메시지로 변경
        return;
    }

    // Then, check if any tweets were actually loaded
    if (allTweets.length === 0) {
        // Modify the message slightly for clarity after auto-load attempt
        showMessage(imageContainer, '로드된 트윗이 없습니다. 이미지를 생성할 수 없습니다.'); // 한국어 메시지로 변경
        return;
    }

    // Check for both API Keys needed
    if (!googleApiKey) { // Gemini 키 확인
        showMessage(imageContainer, 'Google AI API 키가 설정되지 않았습니다. 아래 ⚙️ 설정 버튼을 클릭하여 API 키를 추가하세요.'); // 한국어 메시지로 변경
        return;
    }
    if (!openaiApiKey) { // DALL-E 키 확인
        showMessage(imageContainer, 'OpenAI API 키(DALL-E용)가 설정되지 않았습니다. 아래 ⚙️ 설정 버튼을 클릭하여 API 키를 추가하세요.'); // 한국어 메시지로 변경
        return;
    }

    showLoading(imageContainer, '트윗 분석 중 (Gemini)...'); // 모델 이름 명시

    try {
        // Pass the allTweets array directly to Gemini
        const importantMoment = await getImportantMoment(allTweets);

        // Create the prompt with the important moment
        showLoading(imageContainer, '이미지 생성 중 (DALL-E)...'); // 모델 이름 명시
        const prompt = createPrompt(importantMoment);

        // Generate the image using DALL-E 3
        const imageUrl = await generateImage(prompt);
        displayImage(imageUrl, prompt);
    } catch (error) {
        showMessage(imageContainer, `오류: ${error.message}`); // 한국어 메시지로 변경
    }
});

// Initial check if keys are missing and modal should be shown
// Check for Twitter, Google AI (for analysis), and OpenAI (for DALL-E) keys
if (!twitterApiKey || !googleApiKey || !openaiApiKey) {
     settingsModal.classList.add('show');
     showMessage(tweetsContainer, '환영합니다! 설정(⚙️)에서 필요한 API 키(RapidAPI, Google AI, OpenAI)를 모두 입력해 주세요.', 'info'); // 안내 메시지 업데이트
}

// Handle Enter key press for tweet fetching
twitterHandle.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchTweetsBtn.click();
    }
});

// Fetch Tweets Function - Modified for Pagination
const fetchTweets = async (username, cursor = null, apiKey) => {
    // isLoading = true; // Set by caller
    // REMOVE: showLoading(tweetsContainer, 'Fetching tweets...'); // Don't show loading inside container
    if (!apiKey) {
        throw new Error('Twitter API 키가 설정되지 않았습니다.');
    }

    let url = `https://twitter-v24.p.rapidapi.com/user/tweets?username=${encodeURIComponent(username)}&limit=100`; // Changed limit to 100
    if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': apiKey,
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
        // showMessage(tweetsContainer, `트윗 로드 실패: ${error.message}`, 'error'); // UI update should be in main.js
        console.error("트윗 가져오기 오류:", error); // 한국어 콘솔 메시지로 변경
        throw error; // Re-throw the error
    }
};

// Get Important Moment from Google AI (Gemini)
const getImportantMoment = async (tweets, apiKey) => {
    if (!apiKey) {
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-03-25:generateContent?key=${apiKey}`;

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


// Generate Image from OpenAI (DALL-E)
const generateImage = async (prompt, apiKey) => {
     if (!apiKey) { // DALL-E 키 확인
         throw new Error('OpenAI API 키(DALL-E용)가 설정되지 않았습니다. 설정에서 키를 입력하세요.');
     }
    // Validate DALL-E prompt length - MAX_PROMPT_LENGTH should be accessible (from config.js)
    // This dependency needs to be handled in main.js
    if (typeof MAX_PROMPT_LENGTH !== 'undefined' && prompt.length > MAX_PROMPT_LENGTH) {
        throw new Error(`프롬프트가 DALL-E의 ${MAX_PROMPT_LENGTH}자 제한을 초과합니다`); // 한국어 오류 메시지로 변경
    }

    const url = 'https://api.openai.com/v1/images/generations';
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
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
        console.error("OpenAI 이미지 생성 오류:", error); // Add console log
        throw error;
    }
}; 
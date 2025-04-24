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

// Load style prompts from localStorage or use defaults
// This needs to be accessed globally, so maybe move initialization to main.js?
// For now, keep it here, but main.js will need to reference this.
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
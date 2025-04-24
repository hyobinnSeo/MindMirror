# Tweet Visualizer

Tweet Visualizer is a web application that transforms Twitter content into AI-generated visual representations. It combines Twitter data analysis with DALL-E 3 image generation to create unique visualizations of a user's tweets.

## Features

- **Tweet Fetching**: Retrieve tweets from any public Twitter account
- **AI Analysis**: Uses GPT-4 to analyze tweets and extract meaningful moments
- **Image Generation**: Creates custom images using DALL-E 3 based on tweet analysis
- **Customization Options**:
  - Age range selection
  - Gender specification
  - Multiple image styles:
    - Cinematic Realism
    - Renaissance Oil Painting
    - 19th Century Photography
    - TV Series Poster
    - Anime Character
    - 3D Animation
  - Additional prompt customization
- **Settings Management**: Save and manage API keys and style preferences
- **Responsive Design**: Works seamlessly across different screen sizes

## Prerequisites

To use Tweet Visualizer, you'll need:

1. A RapidAPI key with access to the Twitter API
2. An OpenAI API key for GPT-4 and DALL-E 3

## Setup

1. Clone the repository
2. Open the application in your web browser
3. Click the ⚙️ Settings button
4. Enter your API keys:
   - RapidAPI Key for Twitter access
   - OpenAI API Key for GPT-4 and DALL-E 3
5. Save your settings

## Usage

1. Enter a Twitter username in the input field
2. Click "Fetch Tweets" to retrieve recent tweets
3. Select the desired age range and gender
4. Choose an image style
5. (Optional) Add any additional prompt requirements
6. Click "Generate Image" to create a visualization
7. Click on the generated image to view the full prompt used

## Image Styles

- **Cinematic Realism**: Modern cinematic style with muted tones and atmospheric lighting
- **Renaissance Oil Painting**: Classical style with rich colors and dramatic lighting
- **19th Century Photography**: Vintage black and white photography aesthetic
- **TV Series Poster**: Contemporary streaming platform marketing style
- **Anime Character**: Japanese anime art style
- **3D Animation**: Modern Disney/DreamWorks 3D animation style

## Technical Details

- Frontend: HTML, CSS, JavaScript
- APIs:
  - Twitter API (via RapidAPI)
  - OpenAI GPT-4
  - DALL-E 3
- Deployment: Google Cloud Platform (App Engine)

## Deployment

The application is configured for deployment on Google Cloud Platform using App Engine. The `app.yaml` file includes the necessary configuration for static file serving and routing.

## Security

- API keys are stored locally in the browser's localStorage
- Keys are never exposed in the frontend code
- All API requests are made directly to their respective endpoints

## Limitations

- Twitter API rate limits apply
- OpenAI API costs are based on usage
- Maximum prompt length for DALL-E is 4000 characters
- Requires modern web browser support

## Contributing

Feel free to submit issues and enhancement requests!

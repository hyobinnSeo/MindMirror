# Twitter Profile Viewer

A web application that allows users to view recent tweets from any Twitter profile using the Twitter API via RapidAPI.

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Get your RapidAPI Key:
   - Sign up at [RapidAPI](https://rapidapi.com)
   - Subscribe to the [Twitter API v1.54](https://rapidapi.com/omarmhaimdat/api/twitter154)
   - Copy your API key

4. Create a `.env` file in the root directory:
```bash
RAPIDAPI_KEY=your_rapidapi_key_here
```

5. Start the server:
```bash
npm start
```

6. Open your browser and navigate to `http://localhost:3000`

## Features

- Clean, Twitter-themed interface
- Real-time tweet fetching
- Display of tweet metrics (likes, retweets)
- Timestamp display
- Error handling
- Input validation
- Responsive design

## Usage

1. Enter a Twitter handle (without the @ symbol)
2. Click Submit
3. View the user's recent tweets displayed in a Twitter-like interface

## Security

- API key is stored securely in environment variables
- .env file is excluded from version control
- API key is never exposed to the client-side code directly

## Technical Details

- Frontend: HTML, CSS, JavaScript (ES6+)
- Backend: Node.js, Express
- API: Twitter API via RapidAPI
- Environment Variables: dotenv

import { Frog } from 'frog';
import axios from 'axios';

export const config = {
  runtime: 'edge',
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const app = new Frog({
  basePath: `${basePath}/api`,
});

function getRandomDarkColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 50 + Math.random() * 30;
  const lightness = 15 + Math.random() * 20;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getWordSize(count, maxCount) {
  const minSize = 20;
  const maxSize = 60;
  return minSize + (count / maxCount) * (maxSize - minSize);
}

app.frame('/analyzeMe', async (c) => {
  console.log('Analyzing Farcaster profile');
  const { frameData } = c;
  const { fid } = frameData;

  try {
    console.log('Fetching casts for FID:', fid);
    const response = await axios.get(`https://api.neynar.com/v1/farcaster/casts?fid=${fid}&limit=50`);
    const casts = response.data.result.casts;
    console.log('Fetched casts:', casts.length);

    const wordCounts = {};
    let maxCount = 0;

    casts.forEach((cast) => {
      const words = cast.text.split(/\s+/).filter(word => word.length > 2);
      words.forEach((word) => {
        const lowerCaseWord = word.toLowerCase();
        wordCounts[lowerCaseWord] = (wordCounts[lowerCaseWord] || 0) + 1;
        maxCount = Math.max(maxCount, wordCounts[lowerCaseWord]);
      });
    });

    const wordsArray = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    console.log('Generated word cloud data');

    return c.res({
      image: (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#1a1a1a',
            padding: '20px',
          }}
        >
          {wordsArray.map(({ word, count }) => (
            <div
              key={word}
              style={{
                fontSize: `${getWordSize(count, maxCount)}px`,
                color: getRandomDarkColor(),
                margin: '5px',
                fontWeight: 'bold',
              }}
            >
              {word}
            </div>
          ))}
        </div>
      ),
      intents: [
        <button action="/">Analyze Again</button>,
        <button action={`https://warpcast.com/~/compose?text=Check out my Farcaster word cloud!%0A%0ACreated with Know Me Frame`}>Share</button>
      ]
    });
  } catch (error) {
    console.error('Error analyzing profile:', error);
    return c.res({
      image: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
            color: 'red',
            fontSize: 32,
            textAlign: 'center',
            padding: '20px',
          }}
        >
          An error occurred while analyzing your profile. Please try again.
        </div>
      ),
      intents: [
        <button action="/">Try Again</button>
      ]
    });
  }
});

export default function handler(req) {
  console.log('Received request:', req.method, req.url);
  return app.handle(req);
}
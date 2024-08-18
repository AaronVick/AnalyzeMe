import axios from 'axios';
import { Frog } from 'frog';
import { neynar } from 'frog/hubs';
import { ImageResponse } from '@vercel/og'; // For generating images
import Head from 'next/head';

const stopwords = [
  'the', 'is', 'in', 'and', 'to', 'a', 'of', 'that', 'it', 'on', 'with', 'as', 'for', 'this', 'was', 'are', 'by', 'an', 'be', 'at', 'from',
];

const app = new Frog({
  hub: neynar({ apiKey: 'NEYNAR_FROG_FM' }),
  title: 'Analyze Me Frame',
  verify: 'silent',
});

function getRandomDarkColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 50 + Math.random() * 30; // 50-80%
  const lightness = 15 + Math.random() * 20; // 15-35%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getWordSize(count) {
  return 20 + count * 2; // Adjust this multiplier based on the desired size range
}

function generateWordCloud(wordsArray) {
  return wordsArray.map(({ word, count }) => (
    <div
      key={word}
      style={{
        fontSize: `${getWordSize(count)}px`,
        color: getRandomDarkColor(),
        margin: '5px',
      }}
    >
      {word}
    </div>
  ));
}

async function generateImageResponse(content) {
  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: 'black',
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          padding: '20px',
        }}
      >
        {content}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

app.frame('/analyzeMe', async (c) => {
  const { frameData } = c;
  const { fid } = frameData;

  try {
    // Fetch the user's casts from Pinata
    const response = await axios.get(`https://hub.pinata.cloud/v1/casts?fid=${fid}`);
    const casts = response.data.data.casts;

    // Extract and process text from casts
    let wordsArray = [];
    const wordCounts = {};

    casts.forEach((cast) => {
      const words = cast.text.split(' ').filter((word) => {
        const lowerCaseWord = word.toLowerCase();
        return !stopwords.includes(lowerCaseWord) && !word.startsWith('http');
      });

      words.forEach((word) => {
        const lowerCaseWord = word.toLowerCase();
        if (!wordCounts[lowerCaseWord]) {
          wordCounts[lowerCaseWord] = 0;
        }
        wordCounts[lowerCaseWord]++;
      });
    });

    // Convert wordCounts to an array suitable for word cloud
    for (const [word, count] of Object.entries(wordCounts)) {
      wordsArray.push({ word, count });
    }

    // Generate the word cloud image
    const wordCloudImage = await generateImageResponse(generateWordCloud(wordsArray));

    return c.res({
      head: (
        <Head>
          <title>Word Cloud Result</title>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content={wordCloudImage} />
        </Head>
      ),
      body: (
        <>
          <h1>Here’s Your Word Cloud</h1>
          <img src={wordCloudImage} alt="Word Cloud" />
          <p>Click below to share or analyze again.</p>
        </>
      ),
    });
  } catch (error) {
    console.error('Error in analyzeMe:', error);

    // Generate an error image
    const errorImage = await generateImageResponse(
      <div
        style={{
          fontSize: '40px',
          color: 'red',
          textAlign: 'center',
        }}
      >
        An error occurred while analyzing your casts. Please try again.
      </div>
    );

    return c.res({
      head: (
        <Head>
          <title>Error</title>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content={errorImage} />
        </Head>
      ),
      body: (
        <>
          <h1>Error</h1>
          <img src={errorImage} alt="Error" />
          <p>An error occurred while analyzing your casts. Please try again.</p>
        </>
      ),
    });
  }
});

export default app;

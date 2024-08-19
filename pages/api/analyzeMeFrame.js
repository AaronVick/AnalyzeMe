import { Message } from '@farcaster/core';
import axios from 'axios';

// Expanded list of stop words
const stopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
  'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with',
  'i', 'you', 'he', 'she', 'we', 'they',
  'im', "i'm", 'ive', "i've", 'id', "i'd", 'ill', "i'll",
  'youre', "you're", 'youve', "you've", 'youd', "you'd", 'youll', "you'll",
  'hes', "he's", 'shes', "she's", 'its', "it's", 'were', "we're", 'theyre', "they're",
  'this', 'that', 'these', 'those',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing',
  'a', 'an', 'the',
  'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while',
  'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
  'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'can', 'will', 'just', 'should', 'now',
  'got', 'get', 'gets', 'getting'
]);

// Function to remove URLs from text
function removeUrls(text) {
  return text.replace(/https?:\/\/[^\s]+/g, '');
}

// Improved word processing function
function processText(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9'\s]/g, '')
    .split(/\s+/)
    .map(word => word.replace(/^'|'$/g, ''))
    .filter(word => word.length > 2 && !stopWords.has(word));
}

async function fetchUserCasts(fid) {
  console.log(`Attempting to fetch casts for FID: ${fid}`);
  try {
    const response = await axios.get(`https://api.pinata.cloud/v3/farcaster/casts?fid=${fid}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`,
      }
    });
    if (response.data && response.data.casts) {
      return response.data.casts;
    } else {
      console.error('No casts found in the response');
      return [];
    }
  } catch (error) {
    console.error('Error fetching casts from Pinata:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return [];
  }
}

function generateWordCloudImage(wordsArray) {
  const width = 1200; // Increased width for better resolution
  const height = Math.round(width / 1.91); // Approximately 628 to maintain 1.91:1 ratio
  const words = wordsArray.slice(0, 30); // Limit to top 30 words for simplicity

  const randomVibrantColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const lightness = Math.floor(Math.random() * 30) + 60; // 60-90% lightness
    return `hsl(${hue}, 100%, ${lightness}%)`;
  };

  // Calculate the maximum count for scaling
  const maxCount = Math.max(...words.map(w => w.count));

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#000000"/>`;

  const placedWords = [];

  words.forEach((word, index) => {
    const fontSize = Math.max(16, Math.min(100, 24 + (word.count / maxCount) * 76)); // Adjusted scaling
    const color = randomVibrantColor();

    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) { // Increased attempts
      const x = Math.random() * (width - 200) + 100; // Adjusted to keep words more centered
      const y = Math.random() * (height - 40) + fontSize;

      // Simple collision detection
      const overlap = placedWords.some(placedWord => 
        Math.abs(placedWord.x - x) < placedWord.width &&
        Math.abs(placedWord.y - y) < fontSize
      );

      if (!overlap) {
        svg += `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${color}" font-weight="bold" text-anchor="middle">${word.word}</text>`;
        placedWords.push({ x, y, width: word.word.length * fontSize * 0.6, height: fontSize }); // Approximate width
        placed = true;
      }

      attempts++;
    }
  });

  svg += '</svg>';

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export default async function handler(req, res) {
  console.log('Received request method:', req.method);
  console.log('Received headers:', JSON.stringify(req.headers, null, 2));

  if (req.method === 'POST') {
    try {
      const { trustedData } = req.body;
      
      if (!trustedData?.messageBytes) {
        return res.status(400).json({ error: 'Invalid request: missing trusted data' });
      }

      const frameMessage = Message.decode(Buffer.from(trustedData.messageBytes, 'hex'));
      const fid = frameMessage.data.fid;
      console.log('Received FID:', fid);

      const casts = await fetchUserCasts(fid);
      console.log('Number of casts fetched:', casts.length);

      if (casts.length === 0) {
        return res.status(404).json({ error: 'No casts found for this user' });
      }

      const wordCounts = {};
      casts.forEach(cast => {
        const cleanText = removeUrls(cast.text || '');
        const words = processText(cleanText);
        
        words.forEach(word => {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
      });

      const wordsArray = Object.entries(wordCounts)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50);

      const wordCloudImage = generateWordCloudImage(wordsArray);
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${wordCloudImage}" />
            <meta property="fc:frame:button:1" content="Analyze Again" />
            <meta property="fc:frame:button:2" content="Share" />
            <meta property="fc:frame:button:2:action" content="link" />
            <meta property="fc:frame:button:2:target" content="https://warpcast.com/~/compose?text=Check out your current Farcaster word cloud!%0A%0AFrame by @aaronv%0A%0Ahttps://analyze-me.vercel.app/" />
          </head>
          <body>
            <h1>Your Farcaster Word Cloud</h1>
            <img src="${wordCloudImage}" alt="Word Cloud" />
          </body>
        </html>
      `;

      console.log('Sending response');
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (error) {
      console.error('Error processing the request:', error);
      return res.status(500).json({ error: 'An error occurred while analyzing the profile.', details: error.message });
    }
  } else {
    console.log('Invalid method:', req.method);
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
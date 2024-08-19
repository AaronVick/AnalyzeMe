import { Message } from '@farcaster/core';
import axios from 'axios';

// Function to remove URLs from text
function removeUrls(text) {
  return text.replace(/https?:\/\/[^\s]+/g, '');
}

// List of common stop words
const stopWords = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with']);

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
    return []; // Return an empty array instead of throwing an error
  }
}

function generateWordCloudImage(wordsArray) {
  const width = 800;
  const height = 400;
  const words = wordsArray.slice(0, 30); // Limit to top 30 words for simplicity

  // Function to generate random pastel colors
  const randomPastelColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
  };

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f0f0f0"/>`;

  words.forEach((word, index) => {
    const fontSize = Math.max(12, Math.min(60, 10 + word.count * 5)); // Scale font size
    const x = Math.random() * (width - 100) + 50;
    const y = Math.random() * (height - 20) + fontSize;
    const color = randomPastelColor();
    svg += `<text x="${x}" y="${y}" font-family="Arial" font-size="${fontSize}" fill="${color}">${word.word}</text>`;
  });

  svg += '</svg>';

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export default async function handler(req, res) {
  console.log('Received request method:', req.method);

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
        const words = cleanText.split(/\s+/)
          .map(word => word.toLowerCase().replace(/[^a-z0-9]/g, ''))
          .filter(word => word.length > 2 && !stopWords.has(word));
        
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
            <meta property="fc:frame:button:2:target" content="https://warpcast.com/~/compose?text=Check out my Farcaster word cloud!%0A%0ACreated with Know Me Frame" />
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

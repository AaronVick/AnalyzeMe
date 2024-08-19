import { Message, FrameActionBody } from '@farcaster/core';
import axios from 'axios';
import sharp from 'sharp';

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
    const response = await axios.get(`https://hub.pinata.cloud/v1/casts?fid=${fid}&limit=50`);
    if (response.data && response.data.casts) {
      return response.data.casts;
    } else {
      console.error('No casts found in the response');
      return [];
    }
  } catch (error) {
    console.error('Error fetching casts from Pinata:', error.message);
    throw error;
  }
}

async function generateWordCloudImage(wordsArray) {
  // Implement your word cloud generation logic here
  // For now, we'll return a placeholder image
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
}

export default async function handler(req, res) {
  console.log('Received request method:', req.method);
  console.log('Received headers:', JSON.stringify(req.headers, null, 2));

  if (req.method === 'POST') {
    try {
      const { trustedData, untrustedData } = req.body;
      
      if (!trustedData?.messageBytes) {
        return res.status(400).json({ error: 'Invalid request: missing trusted data' });
      }

      // Decode the frame message
      const frameMessage = Message.decode(Buffer.from(trustedData.messageBytes, 'hex'));

      // For now, we'll assume the message is valid if we can decode it
      // In a production environment, you should implement proper validation
      const fid = frameMessage.data.fid;
      console.log('Received FID:', fid);

      // Fetch user's casts
      const casts = await fetchUserCasts(fid);
      console.log('Number of casts fetched:', casts.length);

      // Process casts and generate word cloud
      const wordCounts = {};
      casts.forEach(cast => {
        const cleanText = removeUrls(cast.text);
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

      // Generate word cloud image
      const wordCloudImage = await generateWordCloudImage(wordsArray);
      
      // Construct HTML response
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
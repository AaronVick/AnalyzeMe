import axios from 'axios';
import { ethers } from 'ethers';
import satori from 'satori';
import sharp from 'sharp';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

async function verifyFrameMessage(trustedData) {
  try {
    const response = await axios.post('https://api.neynar.com/v2/farcaster/frame/validate', 
      { trusted_data: trustedData },
      { headers: { 'api_key': NEYNAR_API_KEY } }
    );
    return response.data.valid;
  } catch (error) {
    console.error('Error verifying frame message:', error);
    return false;
  }
}

async function generateWordCloudImage(wordsArray) {
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1a1a1a"/>
      ${wordsArray.map(({ word, count }, index) => `
        <text
          x="${600 + Math.cos(index) * 300}"
          y="${315 + Math.sin(index) * 150}"
          font-size="${20 + count * 2}"
          fill="white"
          text-anchor="middle"
          dominant-baseline="middle"
        >${word}</text>
      `).join('')}
    </svg>
  `;

  const png = await sharp(Buffer.from(svg))
    .resize(1200, 630)
    .png()
    .toBuffer();

  return `data:image/png;base64,${png.toString('base64')}`;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { trustedData, untrustedData } = req.body;
      
      const isValid = await verifyFrameMessage(trustedData);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid frame message' });
      }

      const fid = trustedData.fid;

      // Fetch user's casts
      const response = await axios.get(`https://api.neynar.com/v1/farcaster/casts?fid=${fid}&limit=50`, {
        headers: { 'api_key': NEYNAR_API_KEY }
      });
      const casts = response.data.result.casts;

      // Process casts and generate word cloud data
      const wordCounts = {};
      casts.forEach(cast => {
        const words = cast.text.split(/\s+/).filter(word => word.length > 2);
        words.forEach(word => {
          const lowerCaseWord = word.toLowerCase();
          wordCounts[lowerCaseWord] = (wordCounts[lowerCaseWord] || 0) + 1;
        });
      });

      const wordsArray = Object.entries(wordCounts)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50);

      const wordCloudImage = await generateWordCloudImage(wordsArray);

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

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred while analyzing the profile.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
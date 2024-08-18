import { getSSLHubRpcClient, Message } from '@farcaster/hub-nodejs';
import { VerificationResult, validateMessage } from '@farcaster/core';
import axios from 'axios';

const HUB_URL = process.env.HUB_URL || 'nemes.farcaster.xyz:2283';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { trustedData, untrustedData } = req.body;
      
      // Parse and validate the frame message
      const frameMessage = Message.fromJSON(JSON.parse(trustedData.messageBytes));
      const result = await validateMessage(frameMessage);
      
      if (result !== VerificationResult.Valid) {
        return res.status(400).json({ error: 'Invalid frame message' });
      }

      // Extract FID from the validated message
      const fid = frameMessage.data.fid;

      // Fetch user's casts
      const response = await axios.get(`https://api.neynar.com/v1/farcaster/casts?fid=${fid}&limit=50`);
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

      // Generate simple HTML for word cloud
      const wordCloudHtml = wordsArray.map(({ word, count }) => 
        `<span style="font-size: ${20 + count * 2}px; margin: 5px;">${word}</span>`
      ).join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="data:image/svg+xml,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
                <rect width="100%" height="100%" fill="#1a1a1a"/>
                <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
                  ${wordCloudHtml}
                </text>
              </svg>
            `)}" />
            <meta property="fc:frame:button:1" content="Analyze Again" />
            <meta property="fc:frame:button:2" content="Share" />
            <meta property="fc:frame:button:2:action" content="link" />
            <meta property="fc:frame:button:2:target" content="https://warpcast.com/~/compose?text=Check out my Farcaster word cloud!%0A%0ACreated with Know Me Frame" />
          </head>
          <body>
            <h1>Your Farcaster Word Cloud</h1>
            <div>${wordCloudHtml}</div>
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
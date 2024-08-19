import axios from 'axios';
import sharp from 'sharp';
import { getSSLHubRpcClient, Message, FrameActionBody } from '@farcaster/core';

const HUB_URL = process.env.HUB_URL || 'nemes.farcaster.xyz:2283';
const client = getSSLHubRpcClient(HUB_URL);

// Keep your helper functions (removeUrls, stopWords, verifyFrame, fetchUserCasts, generateWordCloudImage) here

export default async function handler(req, res) {
  console.log('Received request:', req.method);
  console.log('Request Headers:', JSON.stringify(req.headers, null, 2));

  if (req.method === 'POST') {
    try {
      const body = req.body;
      console.log('Request Body:', JSON.stringify(body, null, 2));

      const { trustedData, untrustedData } = body;
      
      if (!trustedData?.messageBytes) {
        return res.status(400).json({ error: 'Invalid request: missing trusted data' });
      }

      // Verify the frame and get trusted data
      const verifiedData = await verifyFrame(trustedData);
      const fid = verifiedData.fid;
      console.log('Verified FID:', fid);

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
      return res.status(500).json({ error: 'An error occurred while analyzing the profile.' });
    }
  } else {
    console.log('Invalid method:', req.method);
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
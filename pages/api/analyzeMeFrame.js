import axios from 'axios';
import sharp from 'sharp';
import { getSSLHubRpcClient, Message, FrameActionBody } from '@farcaster/core';

const HUB_URL = process.env.HUB_URL || 'nemes.farcaster.xyz:2283';
const client = getSSLHubRpcClient(HUB_URL);

// ... (keep your helper functions like removeUrls, stopWords, etc.)

export default async function handler(req, res) {
  console.log('Received request method:', req.method);
  console.log('Received headers:', JSON.stringify(req.headers, null, 2));
  console.log('Received body:', JSON.stringify(req.body, null, 2));

  if (req.method === 'POST') {
    try {
      const { trustedData, untrustedData } = req.body;
      
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
      // ... (your existing word cloud generation code)

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
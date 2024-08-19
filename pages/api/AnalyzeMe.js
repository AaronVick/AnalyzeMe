import axios from 'axios';
import sharp from 'sharp';

// Function to fetch user casts from Pinata API
async function fetchUserCasts(fid) {
  try {
    const response = await axios.get(`https://hub.pinata.cloud/v1/casts?fid=${fid}&limit=50`);
    return response.data.data.casts;
  } catch (error) {
    console.error('Error fetching casts:', error);
    throw error;
  }
}

// Function to generate word cloud image
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

// Main handler function for the API endpoint
export default async function handler(req, res) {
  console.log('Received request:', req.method);

  if (req.method === 'POST') {
    try {
      const { untrustedData } = req.body;
      const fid = untrustedData.fid;

      // Fetch user's casts
      const casts = await fetchUserCasts(fid);

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

      // Send the HTML response
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'An error occurred while analyzing the profile.' });
    }
  } else {
    // Method not allowed for other HTTP methods
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

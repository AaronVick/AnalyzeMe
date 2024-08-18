import { Frog } from 'frog';
import { neynar } from 'frog/hubs';
import Head from 'next/head';

export const app = new Frog({
  hub: neynar({ apiKey: 'NEYNAR_FROG_FM' }),
  title: 'Know Me Frame',
  verify: 'silent',
});

app.frame('/', (c) => {
  return c.res({
    head: (
      <Head>
        <title>Know Me Farcaster Frame</title>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="/knowme.png" />
        <meta property="fc:frame:button:1" content="Analyze Me" />
        <meta property="fc:frame:post_url" content="/analyzeMe" />
      </Head>
    ),
    body: (
      <>
        <img src="/knowme.png" alt="Know Me" width="500" height="300" />
        <p>Click the button below to analyze your Farcaster profile.</p>
      </>
    ),
  });
});

export default app;

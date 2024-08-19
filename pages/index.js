import { useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  
  // This useEffect hook will run when the component mounts
  useEffect(() => {
    console.log('Home component mounted');
    
    // Log the button click events
    const analyzeButton = document.querySelector('meta[property="fc:frame:button:1"]');
    if (analyzeButton) {
      console.log('Analyze Me button found:', analyzeButton);
    } else {
      console.error('Analyze Me button not found in the document');
    }

    // Cleanup if necessary
    return () => {
      console.log('Home component unmounted');
    };
  }, []);

  return (
    <div>
      <Head>
        <title>Know Me</title>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://analyze-me.vercel.app/knowme.png" />
        <meta property="fc:frame:button:1" content="Analyze Me" />
        <meta property="fc:frame:post_url" content="https://analyze-me.vercel.app/api/analyzeMeFrame" />
      </Head>
      <main>
        <h1>Analyze My Casts</h1>
      </main>
    </div>
  );
}
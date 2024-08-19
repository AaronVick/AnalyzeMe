import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Know Me Frame</title>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://analyze-me.vercel.app/knowme.png" />
        <meta property="fc:frame:button:1" content="Analyze Me" />
        <meta property="fc:frame:post_url" content="https://analyze-me.vercel.app/api/analyzeMe" />
      </Head>
      <h1>Know Me Frame</h1>
      <p>This is a Farcaster frame. View it on a Farcaster client.</p>
    </div>
  )
}
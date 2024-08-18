export default function Home() {
  return (
    <div>
      <h1>Know Me Frame</h1>
      <p>This is a Farcaster frame. View it on a Farcaster client.</p>
    </div>
  )
}

export function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'text/html')
  res.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Know Me Frame</title>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="https://analyze-me.vercel.app/knowme.png" />
      <meta property="fc:frame:button:1" content="Analyze Me" />
      <meta property="fc:frame:post_url" content="https://analyze-me.vercel.app/api/analyzeMe" />
    </head>
    <body>
      <h1>Know Me Frame</h1>
      <p>This is a Farcaster frame. View it on a Farcaster client.</p>
    </body>
    </html>
  `)
  res.end()

  return { props: {} }
}
import { Frog } from 'frog';
import { getFrameMetadata } from 'frog/next';
import Head from 'next/head';

console.log('Starting index.js execution');

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
console.log('basePath:', basePath);

export const app = new Frog({
  basePath: `${basePath}/api`,
  initialState: {
    count: 0,
  },
});

app.frame('/', (c) => {
  console.log('Frame function called');
  const imageUrl = `${basePath}/knowme.png`;
  console.log('Image URL:', imageUrl);
  
  return c.res({
    image: (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#f0f0f0',
          fontSize: 40,
          fontWeight: 'bold',
        }}
      >
        <img src={imageUrl} alt="Know Me" style={{ maxWidth: '100%', maxHeight: '300px' }} />
        <div style={{ fontSize: 24, marginTop: 20 }}>Analyze your Farcaster profile</div>
      </div>
    ),
    intents: [
      <button action={`${basePath}/api/analyzeMe`}>Analyze Me</button>
    ]
  });
});

// Export a Next.js page component
export default function Page() {
  console.log('Rendering Page component');
  const frameMetadata = getFrameMetadata(app, '/');
  
  return (
    <>
      <Head>
        {frameMetadata.map((tag) => (
          <meta key={tag.property} {...tag} />
        ))}
      </Head>
      <h1>Know Me Frame</h1>
      <p>This is a Farcaster frame. View it on a Farcaster client.</p>
    </>
  );
}

console.log('index.js execution completed');
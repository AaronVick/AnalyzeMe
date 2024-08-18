import { Frog } from 'frog';

export const config = {
  runtime: 'edge',
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const app = new Frog({
  basePath: `${basePath}/api`,
  initialState: {
    count: 0,
  },
});

app.frame('/', (c) => {
  console.log('Rendering initial frame');
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

export default function handler(req) {
  console.log('Received request:', req.method, req.url);
  return app.handle(req);
}
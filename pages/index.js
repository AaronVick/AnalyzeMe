import { Frog } from 'frog';

console.log('Starting index.js execution');

export const config = {
  runtime: 'edge',
};

console.log('Defining basePath');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
console.log('basePath:', basePath);

console.log('Initializing Frog app');
export const app = new Frog({
  basePath: `${basePath}/api`,
  initialState: {
    count: 0,
  },
});
console.log('Frog app initialized');

console.log('Defining frame');
app.frame('/', (c) => {
  console.log('Frame function called');
  console.log('Context:', JSON.stringify(c, null, 2));
  
  const imageUrl = `${basePath}/knowme.png`;
  console.log('Image URL:', imageUrl);
  
  console.log('Rendering frame');
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
console.log('Frame defined');

console.log('Defining handler function');
export default function handler(req) {
  console.log('Handler function called');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  
  console.log('Calling app.handle');
  const result = app.handle(req);
  console.log('app.handle result:', result);
  
  return result;
}
console.log('Handler function defined');

console.log('index.js execution completed');
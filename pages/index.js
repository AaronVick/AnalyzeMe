import { Frog } from 'frog'

export const config = {
  runtime: 'edge',
}

export const app = new Frog({
  basePath: '/api',
  initialState: {
    count: 0,
  },
})

app.frame('/', (c) => {
  console.log('Rendering initial frame')
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
        <div>Know Me Frame</div>
        <div style={{ fontSize: 24, marginTop: 20 }}>Analyze your Farcaster profile</div>
      </div>
    ),
    intents: [
      <button action="/api/analyzeMe">Analyze Me</button>
    ]
  })
})

export default function handler(req, res) {
  console.log('Received request:', req.method, req.url)
  return app.handle(req, res)
}
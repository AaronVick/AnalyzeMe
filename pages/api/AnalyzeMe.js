import { Frog } from 'frog'
import axios from 'axios'

export const config = {
  runtime: 'edge',
}

const stopwords = [
  'the', 'is', 'in', 'and', 'to', 'a', 'of', 'that', 'it', 'on', 'with', 'as', 'for', 'this', 'was', 'are', 'by', 'an', 'be', 'at', 'from',
]

function getRandomDarkColor() {
  const hue = Math.floor(Math.random() * 360)
  const saturation = 50 + Math.random() * 30 // 50-80%
  const lightness = 15 + Math.random() * 20 // 15-35%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

function getWordSize(count, maxCount) {
  const minSize = 20
  const maxSize = 60
  return minSize + (count / maxCount) * (maxSize - minSize)
}

const app = new Frog({
  basePath: '/api',
})

app.frame('/analyzeMe', async (c) => {
  console.log('Received analyzeMe request')
  const { frameData } = c
  const { fid } = frameData
  console.log('FID:', fid)

  try {
    console.log('Fetching casts from Pinata')
    const response = await axios.get(`https://hub.pinata.cloud/v1/casts?fid=${fid}`)
    console.log('Pinata response status:', response.status)
    const casts = response.data.data.casts
    console.log('Number of casts:', casts.length)

    const wordCounts = {}
    let maxCount = 0

    console.log('Processing casts')
    casts.forEach((cast, index) => {
      console.log(`Processing cast ${index + 1}`)
      const words = cast.text.split(/\s+/).filter((word) => {
        const lowerCaseWord = word.toLowerCase()
        return !stopwords.includes(lowerCaseWord) && !word.startsWith('http') && word.length > 2
      })

      words.forEach((word) => {
        const lowerCaseWord = word.toLowerCase()
        wordCounts[lowerCaseWord] = (wordCounts[lowerCaseWord] || 0) + 1
        maxCount = Math.max(maxCount, wordCounts[lowerCaseWord])
      })
    })

    console.log('Sorting and limiting words')
    const wordsArray = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50)

    console.log('Generating word cloud image')
    return c.res({
      image: (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#1a1a1a',
            padding: '20px',
          }}
        >
          {wordsArray.map(({ word, count }) => (
            <div
              key={word}
              style={{
                fontSize: `${getWordSize(count, maxCount)}px`,
                color: getRandomDarkColor(),
                margin: '5px',
                fontWeight: 'bold',
              }}
            >
              {word}
            </div>
          ))}
        </div>
      ),
      intents: [
        <button action="/">Analyze Again</button>,
        <button action={`https://warpcast.com/~/compose?text=Check out my Farcaster word cloud!%0A%0ACreated with Know Me Frame`}>Share</button>
      ]
    })
  } catch (error) {
    console.error('Error in analyzeMe:', error)
    console.error('Error stack:', error.stack)

    return c.res({
      image: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
            color: 'red',
            fontSize: 32,
            textAlign: 'center',
            padding: '20px',
          }}
        >
          An error occurred while analyzing your casts. Please try again.
        </div>
      ),
      intents: [
        <button action="/">Try Again</button>
      ]
    })
  }
})

export default function handler(req, res) {
  console.log('Received request:', req.method, req.url)
  return app.handle(req, res)
}
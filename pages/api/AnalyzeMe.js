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
  const { frameData } = c
  const { fid } = frameData

  try {
    // Fetch the user's casts from Pinata
    const response = await axios.get(`https://hub.pinata.cloud/v1/casts?fid=${fid}`)
    const casts = response.data.data.casts

    // Extract and process text from casts
    const wordCounts = {}
    let maxCount = 0

    casts.forEach((cast) => {
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

    // Convert wordCounts to an array and sort by count
    const wordsArray = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50)  // Limit to top 50 words

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

export default app
{
    "name": "farcaster-frame-analyze-me",
    "version": "1.0.0",
    "description": "A Farcaster frame that analyzes user casts and generates a word cloud image.",
    "main": "index.js",
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start"
    },
    "dependencies": {
      "@vercel/og": "^0.4.0",  // Ensure this version matches the latest one available or the one you're using
      "axios": "^1.4.0",        // Ensure this version matches the latest one available or the one you're using
      "frog": "^0.16.1",        // Ensure this version matches the Frog.fm version you're using
      "next": "^13.4.0",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "stopwords": "^0.0.1"     // Assuming this package or similar is used to handle stop words
    },
    "devDependencies": {
      "eslint": "8.35.0",
      "eslint-config-next": "13.4.0"
    },
    "author": "AaronV",
    "license": "MIT"
  }
  
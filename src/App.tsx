import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            🎬 Sorot.AI
          </h1>
          <p className="text-lg text-muted-foreground">
            AI-powered film curation platform for Indonesian film festival selectors
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg border p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Welcome to Sorot.AI Development
            </h2>
            <p className="text-muted-foreground mb-6">
              This is a placeholder for the film analysis interface.
              The application is currently under development.
            </p>
            <button
              onClick={() => setCount(count + 1)}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Development Counter: {count}
            </button>
          </div>
        </main>

        <footer className="text-center mt-12 text-sm text-muted-foreground">
          <p>© 2025 Sorot.AI - Built with React, TypeScript & Tailwind CSS</p>
        </footer>
      </div>
    </div>
  )
}

export default App

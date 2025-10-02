import { FilmAnalysisContainer } from '@/features/film-analysis/containers/FilmAnalysisContainer'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-primary mb-4">
            🎬 Sorot.AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered film curation platform for Indonesian film festival selectors
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Analyze trailers and synopses with dual AI: OpenAI GPT OSS-120B + Google Gemini
          </p>
        </header>

        <main>
          <FilmAnalysisContainer />
        </main>

        <footer className="text-center mt-16 text-sm text-muted-foreground border-t pt-8">
          <p>© 2025 Sorot.AI - Built with React 19, TypeScript & Tailwind CSS</p>
          <p className="mt-1">Dual AI Analysis: OpenAI + Google Gemini | Serverless on Netlify</p>
        </footer>
      </div>
    </div>
  )
}

export default App

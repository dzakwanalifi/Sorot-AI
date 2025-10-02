import { FilmAnalysisContainer } from '@/features/film-analysis/containers/FilmAnalysisContainer'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-3 md:mb-4">
            🎬 Sorot.AI
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
            AI-powered film curation platform for Indonesian film festival selectors
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2 leading-relaxed">
            Analyze trailers and synopses with dual AI: DeepSeek-R1 + Google Gemini
          </p>
        </header>

        <main className="pb-8">
          <FilmAnalysisContainer />
        </main>

        <footer className="text-center mt-8 md:mt-16 text-xs md:text-sm text-muted-foreground border-t pt-6 md:pt-8 px-4">
          <p className="mb-1">© 2025 Sorot.AI - Built with React 19, TypeScript & Tailwind CSS</p>
          <p className="leading-relaxed">Dual AI Analysis: DeepSeek-R1 + Google Gemini | Serverless on AWS Lambda</p>
        </footer>
      </div>
    </div>
  )
}

export default App

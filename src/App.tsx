import { FilmAnalysisContainer } from '@/features/film-analysis/containers/FilmAnalysisContainer'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
        <header className="text-center mb-3 md:mb-4 lg:mb-5">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary mb-1 md:mb-2">
            🎬 Sorot.AI
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI-powered film curation for Indonesian film festival selectors
          </p>
        </header>

        <main className="pb-2 md:pb-3 lg:pb-4">
          <FilmAnalysisContainer />
        </main>

        <footer className="text-center mt-2 md:mt-3 lg:mt-4 text-xs text-muted-foreground border-t pt-1.5 md:pt-2 lg:pt-3 px-1.5 md:px-2">
          <p>Sorot.AI © 2025</p>
        </footer>
      </div>
    </div>
  )
}

export default App

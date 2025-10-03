import { FilmAnalysisContainer } from '@/features/film-analysis/containers/FilmAnalysisContainer'
import { DeepSeek, Gemini, Aws } from '@lobehub/icons'

function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-2 md:px-3 lg:px-4 py-1 md:py-2 lg:py-3 flex flex-col flex-1">
        <header className="text-center mb-4 md:mb-6 lg:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-2 md:mb-3 flex items-center justify-center gap-3">
            🎬 Sorot.AI
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
            AI-powered film curation for Indonesian film festival selectors
          </p>

          {/* Key Features - Simplified */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-xl mx-auto">
            <DeepSeek.Color size={24} />
            <Gemini.Color size={24} />
            <Aws.Color size={24} />
          </div>
        </header>

        <main className="flex-1">
          <FilmAnalysisContainer />
        </main>

        <footer className="text-center text-xs text-muted-foreground border-t pt-1.5 md:pt-2 lg:pt-3 px-1.5 md:px-2 mt-auto">
          <p>Sorot.AI © 2025</p>
        </footer>
      </div>
    </div>
  )
}

export default App

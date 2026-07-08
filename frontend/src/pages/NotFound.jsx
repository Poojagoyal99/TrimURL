import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 px-4 animate-fade-in">
      {/* Animated 404 */}
      <div className="relative">
        <div className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <h1 className="relative text-8xl font-black text-transparent bg-gradient-to-br
                       from-blue-500 via-indigo-500 to-violet-600 bg-clip-text
                       animate-float select-none tracking-tighter">
          404
        </h1>
      </div>

      <div className="text-5xl animate-float-delay">🔍</div>

      <div className="text-center space-y-2">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">Page not found</p>
        <p className="text-sm text-gray-400 max-w-xs">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <Link to="/"
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600
                   hover:from-blue-500 hover:to-violet-500 text-white font-semibold rounded-xl
                   shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
                   transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-sm">
        ← Back to Home
      </Link>
    </div>
  )
}

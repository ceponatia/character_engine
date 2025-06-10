import HamburgerMenu from './HamburgerMenu'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Brand and Version */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                CharacterEngine
              </span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                1.0
              </span>
            </div>
          </div>


          {/* Right: User Actions */}
          <div className="flex items-center space-x-4">
            {/* Notification */}
            <button className="text-slate-400 hover:text-rose-400 transition-colors">
              <span className="text-lg">🔔</span>
            </button>
            
            {/* User Avatar/Initial */}
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm text-slate-300">
              B
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
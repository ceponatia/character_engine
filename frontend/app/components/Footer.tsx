export default function Footer() {
  return (
    <footer className="bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50 px-6 py-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start">
          {/* Left: Main Brand Section */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                CharacterEngine
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              An open-source project dedicated to creating large language models for chat and role-play purposes.
            </p>
          </div>

          {/* Right: Project, Connect Links and Debug Status */}
          <div className="flex space-x-16">
            {/* Project Links */}
            <div>
              <h3 className="text-slate-200 font-semibold mb-3">Project</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-rose-400 transition-colors">Updates</a></li>
                <li><a href="#" className="text-slate-400 hover:text-rose-400 transition-colors">Guidelines</a></li>
                <li><a href="#" className="text-slate-400 hover:text-rose-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-rose-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-slate-400 hover:text-rose-400 transition-colors">About Us</a></li>
              </ul>
            </div>

            {/* Connect Links */}
            <div>
              <h3 className="text-slate-200 font-semibold mb-3">Connect</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-rose-400 transition-colors">Discord</a></li>
                <li><a href="#" className="text-slate-400 hover:text-rose-400 transition-colors">HuggingFace</a></li>
                <li><a href="#" className="text-slate-400 hover:text-rose-400 transition-colors">GitHub</a></li>
              </ul>
            </div>

          </div>
        </div>

        {/* Copyright and Debug/System Section */}
        <div className="border-t border-slate-700/50 mt-8 pt-6 flex justify-between items-center">
          <p className="text-slate-500 text-xs">
            Copyright 2025 - Snarebox LLC. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Debug</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span>System</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
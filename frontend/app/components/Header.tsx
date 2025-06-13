'use client'

import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const { user, logout, loading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const toggleHamburgerMenu = () => {
    setShowHamburgerMenu(!showHamburgerMenu);
  };

  const closeHamburgerMenu = () => {
    setShowHamburgerMenu(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Brand and Version */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                CharacterEngine
              </span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                1.0
              </span>
            </Link>
          </div>

          {/* Right: User Actions - with responsive spacing for hamburger menu */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Notification - hidden on small screens */}
            <button className="hidden sm:block text-slate-400 hover:text-rose-400 transition-colors">
              <span className="text-lg">🔔</span>
            </button>
            
            {/* User Avatar/Initial or Login - adjusted positioning */}
            <div className="mr-2"> {/* Small margin for spacing */}
              {loading ? (
                <div className="w-8 h-8 bg-slate-700 rounded-full animate-pulse"></div>
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-8 h-8 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-sm text-white font-medium hover:from-rose-400 hover:to-pink-400 transition-all"
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-700">
                        <p className="text-sm font-medium text-white">{user.username}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-sm text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
            
            {/* Hamburger Menu Button - show on all screens */}
            <button 
              className={`w-10 h-10 bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-center items-center space-y-0.5 ${showHamburgerMenu ? 'rotate-90' : ''}`}
              onClick={toggleHamburgerMenu}
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${showHamburgerMenu ? 'rotate-45 translate-y-1' : ''}`}></span>
              <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${showHamburgerMenu ? 'opacity-0' : ''}`}></span>
              <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${showHamburgerMenu ? '-rotate-45 -translate-y-1' : ''}`}></span>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Overlay - Dark backdrop when menu is open */}
      {showHamburgerMenu && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeHamburgerMenu}
        ></div>
      )}

      {/* Menu Panel - Slides in from right, starts below header */}
      <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-96 bg-slate-900/95 backdrop-blur-md border-l border-slate-700/50 z-40 transform transition-transform duration-300 overflow-y-auto ${showHamburgerMenu ? 'translate-x-0' : 'translate-x-full'}`}>
        <nav className="p-6 space-y-8">
          {/* Main Actions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">Quick Start</h3>
            <div className="space-y-2">
              <Link 
                href="/story-config" 
                className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-rose-400 transition-all duration-200"
                onClick={closeHamburgerMenu}
              >
                <span className="text-xl">🎭</span>
                <span className="font-medium">Start New Story</span>
              </Link>
            </div>
          </div>

          {/* Creation Tools */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">Create</h3>
            <div className="space-y-2">
              <Link 
                href="/character-builder" 
                className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-rose-400 transition-all duration-200"
                onClick={closeHamburgerMenu}
              >
                <span className="text-xl">✨</span>
                <span className="font-medium">Create Character</span>
              </Link>
              <Link 
                href="/setting-builder" 
                className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-rose-400 transition-all duration-200"
                onClick={closeHamburgerMenu}
              >
                <span className="text-xl">🏰</span>
                <span className="font-medium">Design Setting</span>
              </Link>
            </div>
          </div>

          {/* Libraries */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">Your Content</h3>
            <div className="space-y-2">
              <Link 
                href="/library?type=stories" 
                className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-rose-400 transition-all duration-200"
                onClick={closeHamburgerMenu}
              >
                <span className="text-xl">📚</span>
                <span className="font-medium">Story Library</span>
              </Link>
              <Link 
                href="/library?type=characters" 
                className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-rose-400 transition-all duration-200"
                onClick={closeHamburgerMenu}
              >
                <span className="text-xl">💕</span>
                <span className="font-medium">Characters</span>
              </Link>
              <Link 
                href="/library?type=settings" 
                className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-rose-400 transition-all duration-200"
                onClick={closeHamburgerMenu}
              >
                <span className="text-xl">🏰</span>
                <span className="font-medium">Settings</span>
              </Link>
              <Link 
                href="/library?type=locations" 
                className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-rose-400 transition-all duration-200"
                onClick={closeHamburgerMenu}
              >
                <span className="text-xl">📍</span>
                <span className="font-medium">Locations</span>
              </Link>
            </div>
          </div>

          {/* Account - Updated to show current user state */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">Account</h3>
            <div className="space-y-2">
              {user ? (
                <>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-sm font-medium text-white">{user.username}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  <button 
                    onClick={() => { handleLogout(); closeHamburgerMenu(); }}
                    className="flex items-center space-x-3 w-full p-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-rose-400 transition-all duration-200"
                  >
                    <span className="text-xl">👋</span>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </>
              ) : (
                <Link 
                  href="/login"
                  className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-rose-400 transition-all duration-200"
                  onClick={closeHamburgerMenu}
                >
                  <span className="text-xl">👤</span>
                  <span className="font-medium">Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Menu Footer */}
        <div className="border-t border-slate-700/50 p-6">
          <Link 
            href="/" 
            className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-rose-400 transition-all duration-200"
            onClick={closeHamburgerMenu}
          >
            <span>🏠</span>
            <span className="font-medium">Home</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
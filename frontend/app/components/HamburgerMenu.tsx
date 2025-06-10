'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button - Positioned to align with header center */}
      <button 
        className={`fixed top-4 right-6 z-50 w-10 h-10 bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-center items-center space-y-0.5 ${isOpen ? 'rotate-90' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
        <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
        <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
      </button>

      {/* Menu Overlay - Dark backdrop when menu is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeMenu}
        ></div>
      )}

      {/* Menu Panel - Slides in from right, starts below header */}
      <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-96 bg-slate-900/95 backdrop-blur-md border-l border-slate-700/50 z-40 transform transition-transform duration-300 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        <nav className="p-6 space-y-8">
          {/* Main Actions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">Quick Start</h3>
            <div className="space-y-2">
              <Link 
                href="/story-config" 
                className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-rose-400 transition-all duration-200"
                onClick={closeMenu}
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
                onClick={closeMenu}
              >
                <span className="text-xl">✨</span>
                <span className="font-medium">Create Character</span>
              </Link>
              <Link 
                href="/setting-builder" 
                className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-rose-400 transition-all duration-200"
                onClick={closeMenu}
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
                onClick={closeMenu}
              >
                <span className="text-xl">📚</span>
                <span className="font-medium">Story Library</span>
              </Link>
              <Link 
                href="/library?type=characters" 
                className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-rose-400 transition-all duration-200"
                onClick={closeMenu}
              >
                <span className="text-xl">💕</span>
                <span className="font-medium">Characters</span>
              </Link>
              <Link 
                href="/library?type=settings" 
                className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-rose-400 transition-all duration-200"
                onClick={closeMenu}
              >
                <span className="text-xl">🏰</span>
                <span className="font-medium">Settings</span>
              </Link>
              <Link 
                href="/library?type=locations" 
                className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-rose-400 transition-all duration-200"
                onClick={closeMenu}
              >
                <span className="text-xl">📍</span>
                <span className="font-medium">Locations</span>
              </Link>
            </div>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">Account</h3>
            <div className="space-y-2">
              <button 
                className="flex items-center justify-between w-full p-3 rounded-lg text-slate-500 cursor-not-allowed"
                disabled
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">👤</span>
                  <span className="font-medium">Login</span>
                </div>
                <span className="px-2 py-1 text-xs bg-slate-700 text-slate-400 rounded">Soon</span>
              </button>
              <button 
                className="flex items-center justify-between w-full p-3 rounded-lg text-slate-500 cursor-not-allowed"
                disabled
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📝</span>
                  <span className="font-medium">Register</span>
                </div>
                <span className="px-2 py-1 text-xs bg-slate-700 text-slate-400 rounded">Soon</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Menu Footer */}
        <div className="border-t border-slate-700/50 p-6">
          <Link 
            href="/" 
            className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-rose-400 transition-all duration-200"
            onClick={closeMenu}
          >
            <span>🏠</span>
            <span className="font-medium">Home</span>
          </Link>
        </div>
      </div>
    </>
  );
}
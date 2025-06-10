'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import LibraryTemplate from './LibraryTemplate';
import { charactersConfig, settingsConfig, locationsConfig, storiesConfig } from './configs';

function LibraryPageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'characters';

  const configs = {
    characters: charactersConfig,
    settings: settingsConfig,
    locations: locationsConfig,
    stories: storiesConfig,
  };

  const config = configs[type as keyof typeof configs];

  if (!config) {
    return (
      <div className="min-h-screen bg-romantic-gradient">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-100 mb-4">📚 Library</h1>
            <div className="card-romantic p-8 max-w-md mx-auto">
              <div className="text-red-400 text-lg mb-4">⚠️ Invalid Library Type</div>
              <p className="text-slate-300 mb-4">
                The library type "{type}" is not recognized.
              </p>
              <a href="/library?type=characters" className="btn-romantic-primary">
                Go to Characters
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <LibraryTemplate config={config} />;
}

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-romantic-gradient">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading library...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <LibraryPageContent />
    </Suspense>
  );
}
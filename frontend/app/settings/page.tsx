'use client';

import { Suspense } from 'react';
import LibraryTemplate from '../library/LibraryTemplate';
import { settingsConfig } from '../library/configs';

function SettingsPageContent() {
  return <LibraryTemplate config={settingsConfig} />;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-romantic-gradient">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}
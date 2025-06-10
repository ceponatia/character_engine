'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Location {
  id: string;
  name: string;
  description: string;
  details?: string;
  locationType: string;
  ambiance?: string;
  lighting?: string;
  accessibility?: string;
  createdAt: string;
  updatedAt: string;
  settingLocations?: Array<{
    setting: {
      id: string;
      name: string;
      settingType: string;
    }
  }>;
}

export default function LocationBrowser() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the unified library
    router.replace('/library?type=locations');
  }, [router]);

  return (
    <div className="min-h-screen bg-romantic-gradient">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Redirecting to Locations Library...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
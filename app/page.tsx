'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [keywords, setKeywords] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (keywords.trim()) {
      router.push(`/search?q=${encodeURIComponent(keywords)}`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">PermitTrack</h1>
          <p className="text-xl text-gray-600">Live permit intelligence for Bay Area HVAC contractors</p>
        </div>

        <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search permits..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Search
            </button>
          </div>
        </form>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg shadow">
            <p className="text-4xl font-bold text-blue-600 mb-2">0</p>
            <p className="text-gray-600 font-medium">Active Permits</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <p className="text-4xl font-bold text-blue-600 mb-2">12</p>
            <p className="text-gray-600 font-medium">Bay Area Cities</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <p className="text-4xl font-bold text-blue-600 mb-2">Live</p>
            <p className="text-gray-600 font-medium">Daily Updates</p>
          </div>
        </div>
      </div>
    </main>
  );
}
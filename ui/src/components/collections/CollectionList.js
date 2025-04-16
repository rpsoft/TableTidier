'use client';

import Link from 'next/link';

export default function CollectionList({ collections }) {
  if (collections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-black">No collections yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {collections.map((collection) => (
        <Link
          key={collection.id}
          href={`/collections/${collection.id}`}
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2 text-black">{collection.name}</h2>
          <p className="text-black text-sm">
            Created: {new Date(collection.createdAt).toLocaleDateString()}
          </p>
        </Link>
      ))}
    </div>
  );
} 
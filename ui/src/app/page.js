"use client"
import Header from "@/components/ui/header";
import { SessionProvider } from 'next-auth/react';
import Link from "next/link";
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

function Content() {
	const { data: session } = useSession();
	const [collections, setCollections] = useState([]);

	useEffect(() => {
		if (session?.user?.email) {
			fetchCollections();
		}
	}, [session]);

	const fetchCollections = async () => {
		try {
			const response = await fetch('/api/collections');
			if (response.ok) {
				const data = await response.json();
				setCollections(data);
			}
		} catch (error) {
			console.error('Error fetching collections:', error);
		}
	};

	if (!session) {
		return (
			<div className="max-w-4xl mx-auto text-center">
				<h1 className="text-4xl font-bold mb-6 text-white">Welcome to TableTidier</h1>
				<p className="text-xl mb-8 text-gray-300">Organize and analyze your tables with ease</p>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
					<div className="p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
						<h3 className="text-xl font-semibold mb-2 text-white">Organize</h3>
						<p className="text-gray-300">Create collections to keep your tables organized</p>
					</div>
					<div className="p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
						<h3 className="text-xl font-semibold mb-2 text-white">Analyze</h3>
						<p className="text-gray-300">Extract and analyze data from your tables</p>
					</div>
					<div className="p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
						<h3 className="text-xl font-semibold mb-2 text-white">Collaborate</h3>
						<p className="text-gray-300">Share your collections with team members</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto">
			<div className="text-center mb-12">
				<h1 className="text-4xl font-bold mb-4 text-white">Welcome back, {session.user?.name}</h1>
				<p className="text-xl mb-8 text-gray-300">Manage your collections and tables</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
					<h2 className="text-2xl font-bold mb-4 text-white">Quick Actions</h2>
					<div className="space-y-4">
						<Link 
							href="/collections" 
							className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
						>
							View All Collections
						</Link>
						<Link 
							href="/table" 
							className="block w-full text-center px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
						>
							Go to Tables Dashboard
						</Link>
					</div>
				</div>

				<div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
					<h2 className="text-2xl font-bold mb-4 text-white">Recent Collections</h2>
					{collections.length > 0 ? (
						<div className="space-y-4">
							{collections.slice(0, 3).map(collection => (
								<Link
									key={collection.id}
									href={`/collections/${collection.id}`}
									className="block p-4 bg-gray-700 rounded hover:bg-gray-600 transition-colors border border-gray-600"
								>
									<h3 className="font-semibold text-white">{collection.name}</h3>
									<p className="text-sm text-gray-400">
										Created: {new Date(collection.createdAt).toLocaleDateString()}
									</p>
								</Link>
							))}
						</div>
					) : (
						<p className="text-gray-400">No collections yet. Create your first collection to get started!</p>
					)}
				</div>
			</div>
		</div>
	);
}

export default function Home() {
	return (
		<SessionProvider>
			<main className="min-h-screen bg-gray-900">
				<Header />
				<div className="py-12 px-4">
					<Content />
				</div>
			</main>
		</SessionProvider>
	);
}

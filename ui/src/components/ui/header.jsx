"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  LogIn,
  Home,
  Database,
  BarChart3,
  Brain
} from 'lucide-react';

const AUTH0_ISSUER_BASE_URL = process.env.NEXT_PUBLIC_AUTH0_ISSUER_BASE_URL;
const AUTH0_CLIENT_ID = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function SignOut() {
    const handleSignOut = async () => {
        try {
            // Sign out from NextAuth
            await signOut({ 
                redirect: false,
                callbackUrl: '/'
            });
            
            // Clear any remaining session data
            window.location.href = '/';
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <button 
            type="button" 
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            onClick={handleSignOut}
        >
            <LogOut size={16} />
            Sign Out
        </button>
    );
}

const Header = () => {
    const { data: session, status } = useSession();

    const handleSignIn = async () => {
        try {
            await signIn("google", { 
                callbackUrl: '/',
                prompt: "select_account"
            });
        } catch (error) {
            console.error('Sign in error:', error);
        }
    };

    return (
        <header className="bg-gray-900 border-b border-gray-700">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and Brand */}
                    <div className="flex items-center gap-8">
                        <Link 
                            href="/" 
                            className="flex items-center gap-2 text-xl font-bold text-white hover:text-blue-400 transition-colors"
                        >
                            <Brain size={24} className="text-blue-400" />
                            SLR Platform
                        </Link>
                        
                        {/* Navigation Links */}
                        {status === "authenticated" && (
                            <nav className="hidden md:flex items-center gap-1">
                                <Link 
                                    href="/" 
                                    className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <Home size={16} />
                                    Home
                                </Link>
                                <Link 
                                    href="/projects" 
                                    className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <FileText size={16} />
                                    Projects
                                </Link>
                                <Link 
                                    href="/collections" 
                                    className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <Database size={16} />
                                    Collections
                                </Link>
                                <Link 
                                    href="/table" 
                                    className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <BarChart3 size={16} />
                                    Table Editor
                                </Link>
                                <Link 
                                    href="/settings/api" 
                                    className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <Settings size={16} />
                                    API Settings
                                </Link>
                                <Link 
                                    href="/admin" 
                                    className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <Settings size={16} />
                                    Admin
                                </Link>
                            </nav>
                        )}
                    </div>

                    {/* User Section */}
                    <div className="flex items-center gap-4">
                        {status === "authenticated" ? (
                            <>
                                {/* User Info */}
                                <div className="flex items-center gap-3">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-medium text-white">
                                            {session?.user?.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {session?.user?.email}
                                        </p>
                                    </div>
                                    <Image 
                                        src={session?.user?.image || "/next.svg"} 
                                        alt={session?.user?.name || "User"} 
                                        width={32} 
                                        height={32} 
                                        className="rounded-full border-2 border-gray-600" 
                                    />
                                </div>
                                <SignOut />
                            </>
                        ) : (
                            <button 
                                type="button" 
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                onClick={handleSignIn}
                            >
                                <LogIn size={16} />
                                Sign In
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation */}
                {status === "authenticated" && (
                    <div className="md:hidden border-t border-gray-700 py-4">
                        <nav className="flex flex-col gap-2">
                            <Link 
                                href="/" 
                                className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <Home size={16} />
                                Home
                            </Link>
                            <Link 
                                href="/projects" 
                                className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <FileText size={16} />
                                Projects
                            </Link>
                            <Link 
                                href="/collections" 
                                className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <Database size={16} />
                                Collections
                            </Link>
                            <Link 
                                href="/table" 
                                className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <BarChart3 size={16} />
                                Table Editor
                            </Link>
                            <Link 
                                href="/settings/api" 
                                className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <Settings size={16} />
                                API Settings
                            </Link>
                            <Link 
                                href="/admin" 
                                className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <Settings size={16} />
                                Admin
                            </Link>
                        </nav>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Header;
"use client"
import Header from "@/components/ui/header";
import AdminIndicator from "@/components/AdminIndicator";
import { SessionProvider } from 'next-auth/react';
import Link from "next/link";
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  BarChart3, 
  Users, 
  Brain, 
  Target, 
  CheckCircle, 
  Database,
  Eye,
  Download,
  Settings,
  TrendingUp,
  MessageCircle,
  Zap
} from 'lucide-react';

function Content() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalDocuments: 0,
    activeReviews: 0,
    completedReviews: 0
  });

  useEffect(() => {
    if (session?.user?.email) {
      fetchProjects();
      fetchStats();
    }
  }, [session]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats for now - in real implementation, this would come from the API
      setStats({
        totalProjects: 3,
        totalDocuments: 47,
        activeReviews: 2,
        completedReviews: 1
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 text-white">
            Systematic Review
            <span className="text-blue-400"> Management Platform</span>
          </h1>
          <p className="text-xl mb-8 text-gray-300 max-w-3xl mx-auto">
            Streamline your systematic review process with AI-powered document analysis, 
            collaborative screening, and comprehensive data extraction tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/signin"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
            >
              Get Started
            </Link>
            <Link 
              href="/projects"
              className="px-8 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-lg font-semibold"
            >
              View Demo
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-blue-500 transition-colors">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Smart Document Search</h3>
            <p className="text-gray-300">
              Advanced search capabilities with AI-powered concept extraction and ontology mapping.
            </p>
          </div>

          <div className="p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-green-500 transition-colors">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Collaborative Screening</h3>
            <p className="text-gray-300">
              Multi-reviewer screening with real-time collaboration and conflict resolution.
            </p>
          </div>

          <div className="p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-purple-500 transition-colors">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Data Extraction</h3>
            <p className="text-gray-300">
              Automated data extraction from tables and text with quality assessment tools.
            </p>
          </div>

          <div className="p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-yellow-500 transition-colors">
            <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">AI Assistant</h3>
            <p className="text-gray-300">
              AI-powered insights, suggestions, and automated quality checks for your review.
            </p>
          </div>

          <div className="p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-red-500 transition-colors">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Analytics & Reports</h3>
            <p className="text-gray-300">
              Comprehensive analytics, PRISMA flow diagrams, and exportable reports.
            </p>
          </div>

          <div className="p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-indigo-500 transition-colors">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Team Collaboration</h3>
            <p className="text-gray-300">
              Real-time collaboration with task management and communication tools.
            </p>
          </div>
        </div>

        {/* Workflow Section */}
        <div className="bg-gray-800 rounded-xl p-8 mb-16 border border-gray-700">
          <h2 className="text-3xl font-bold text-center mb-8 text-white">Complete Review Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">1. Document Upload</h3>
              <p className="text-gray-300 text-sm">Upload and organize your research documents</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">2. Screening</h3>
              <p className="text-gray-300 text-sm">Collaborative title/abstract and full-text screening</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">3. Data Extraction</h3>
              <p className="text-gray-300 text-sm">Extract and analyze data from included studies</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">4. Synthesis</h3>
              <p className="text-gray-300 text-sm">Generate reports and visualizations</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Review?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join researchers worldwide who trust our platform for their systematic reviews.
          </p>
          <Link 
            href="/auth/signin"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors text-lg font-semibold"
          >
            Start Your First Review
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <AdminIndicator />
      
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-white">
          Welcome back, {session.user?.name}
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          Continue your systematic review projects
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalProjects}</p>
              <p className="text-gray-400">Active Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalDocuments}</p>
              <p className="text-gray-400">Documents</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mr-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.activeReviews}</p>
              <p className="text-gray-400">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.completedReviews}</p>
              <p className="text-gray-400">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-white">Quick Actions</h2>
          <div className="space-y-4">
            <Link 
              href="/projects" 
              className="flex items-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-5 h-5 mr-3" />
              <span className="font-medium">View All Projects</span>
            </Link>
            <Link 
              href="/projects?action=create" 
              className="flex items-center p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Target className="w-5 h-5 mr-3" />
              <span className="font-medium">Create New Project</span>
            </Link>
            <Link 
              href="/table" 
              className="flex items-center p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Database className="w-5 h-5 mr-3" />
              <span className="font-medium">Table Editor</span>
            </Link>
            <Link 
              href="/admin" 
              className="flex items-center p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-5 h-5 mr-3" />
              <span className="font-medium">Admin Panel</span>
            </Link>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-white">Recent Projects</h2>
          {projects.length > 0 ? (
            <div className="space-y-4">
              {projects.slice(0, 3).map(project => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{project.name}</h3>
                      <p className="text-sm text-gray-400">
                        {project.researchQuestion?.substring(0, 60)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-xs text-gray-400">Active</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No projects yet</p>
              <Link 
                href="/projects?action=create"
                className="text-blue-400 hover:text-blue-300"
              >
                Create your first project
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Features Overview */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-700">
            <Search className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">Advanced Search</h3>
            <p className="text-sm text-gray-400">AI-powered document search and filtering</p>
          </div>
          <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-700">
            <Eye className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">Screening Tools</h3>
            <p className="text-sm text-gray-400">Collaborative screening workflows</p>
          </div>
          <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-700">
            <Brain className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">AI Assistant</h3>
            <p className="text-sm text-gray-400">Intelligent insights and suggestions</p>
          </div>
          <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-700">
            <Download className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">Export & Reports</h3>
            <p className="text-sm text-gray-400">Multiple export formats and reports</p>
          </div>
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
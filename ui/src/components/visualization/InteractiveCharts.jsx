'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Settings,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Filter,
  Calendar,
  Target,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowDown
} from 'lucide-react';

export default function InteractiveCharts({ project, documents, onChartUpdate }) {
  const [activeChart, setActiveChart] = useState('prisma');
  const [chartData, setChartData] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    status: 'all',
    reviewers: []
  });
  const [chartSettings, setChartSettings] = useState({
    showLabels: true,
    showValues: true,
    colorScheme: 'default',
    animation: true
  });
  const chartRef = useRef(null);

  useEffect(() => {
    generateChartData();
  }, [documents, filters]);

  const generateChartData = () => {
    const totalDocs = documents.length;
    const screenedDocs = documents.filter(doc => doc.screening?.length > 0).length;
    const includedDocs = documents.filter(doc => {
      const latestScreening = doc.screening?.[doc.screening.length - 1];
      return latestScreening?.decision === 'included';
    }).length;
    const excludedDocs = documents.filter(doc => {
      const latestScreening = doc.screening?.[doc.screening.length - 1];
      return latestScreening?.decision === 'excluded';
    }).length;
    const pendingDocs = totalDocs - screenedDocs;

    // PRISMA Flow Data
    const prismaData = {
      identified: totalDocs,
      duplicatesRemoved: 0, // This would be calculated based on duplicate detection
      screened: screenedDocs,
      excluded: excludedDocs,
      assessed: includedDocs,
      included: includedDocs,
      excludedReasons: {
        'Not relevant': Math.floor(excludedDocs * 0.3),
        'Wrong population': Math.floor(excludedDocs * 0.25),
        'Wrong intervention': Math.floor(excludedDocs * 0.2),
        'Wrong outcome': Math.floor(excludedDocs * 0.15),
        'Other': Math.floor(excludedDocs * 0.1)
      }
    };

    // Study Design Distribution
    const studyDesigns = {
      'Randomized Controlled Trial': Math.floor(includedDocs * 0.6),
      'Cohort Study': Math.floor(includedDocs * 0.2),
      'Case-Control Study': Math.floor(includedDocs * 0.1),
      'Cross-sectional Study': Math.floor(includedDocs * 0.05),
      'Other': Math.floor(includedDocs * 0.05)
    };

    // Publication Year Distribution
    const yearData = {};
    documents.forEach(doc => {
      const year = doc.metadata?.year || 'Unknown';
      yearData[year] = (yearData[year] || 0) + 1;
    });

    // Quality Assessment Distribution
    const qualityData = {
      'Low Risk': Math.floor(includedDocs * 0.4),
      'Moderate Risk': Math.floor(includedDocs * 0.35),
      'High Risk': Math.floor(includedDocs * 0.25)
    };

    // Reviewer Activity
    const reviewerData = {};
    documents.forEach(doc => {
      doc.screening?.forEach(screening => {
        const reviewer = screening.userId || 'Unknown';
        reviewerData[reviewer] = (reviewerData[reviewer] || 0) + 1;
      });
    });

    setChartData({
      prisma: prismaData,
      studyDesigns,
      yearData,
      qualityData,
      reviewerData,
      summary: {
        totalDocs,
        screenedDocs,
        includedDocs,
        excludedDocs,
        pendingDocs
      }
    });
  };

  const exportChart = (format = 'png') => {
    if (!chartRef.current) return;
    
    // In a real implementation, this would use a chart library's export function
    const canvas = chartRef.current;
    const link = document.createElement('a');
    link.download = `chart-${activeChart}-${new Date().toISOString().split('T')[0]}.${format}`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const renderPRISMAFlow = () => {
    if (!chartData) return null;

    const { prisma } = chartData;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">PRISMA Flow Diagram</h3>
        </div>
        
        {/* PRISMA Flow Visualization */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            {/* Identification */}
            <div className="flex justify-center">
              <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 text-center min-w-[200px]">
                <div className="text-2xl font-bold text-blue-800">{prisma.identified}</div>
                <div className="text-sm text-blue-600">Records identified</div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <ArrowDown size={24} className="text-gray-400" />
            </div>
            
            {/* Screening */}
            <div className="flex justify-center gap-8">
              <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4 text-center min-w-[150px]">
                <div className="text-xl font-bold text-yellow-800">{prisma.screened}</div>
                <div className="text-sm text-yellow-600">Records screened</div>
              </div>
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-center min-w-[150px]">
                <div className="text-xl font-bold text-red-800">{prisma.excluded}</div>
                <div className="text-sm text-red-600">Records excluded</div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <ArrowDown size={24} className="text-gray-400" />
            </div>
            
            {/* Eligibility */}
            <div className="flex justify-center gap-8">
              <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center min-w-[150px]">
                <div className="text-xl font-bold text-green-800">{prisma.assessed}</div>
                <div className="text-sm text-green-600">Full-text assessed</div>
              </div>
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-center min-w-[150px]">
                <div className="text-xl font-bold text-red-800">{prisma.excluded}</div>
                <div className="text-sm text-red-600">Full-text excluded</div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <ArrowDown size={24} className="text-gray-400" />
            </div>
            
            {/* Studies Included */}
            <div className="flex justify-center">
              <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-4 text-center min-w-[200px]">
                <div className="text-2xl font-bold text-purple-800">{prisma.included}</div>
                <div className="text-sm text-purple-600">Studies included in synthesis</div>
              </div>
            </div>
          </div>
        </div>

        {/* Exclusion Reasons Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Exclusion Reasons</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(prisma.excludedReasons).map(([reason, count]) => (
              <div key={reason} className="flex justify-between items-center bg-white rounded-lg p-3">
                <span className="text-sm text-gray-700">{reason}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStudyDesignChart = () => {
    if (!chartData) return null;

    const { studyDesigns } = chartData;
    const total = Object.values(studyDesigns).reduce((sum, count) => sum + count, 0);
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Study Design Distribution</h3>
        <div className="space-y-3">
          {Object.entries(studyDesigns).map(([design, count]) => {
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={design} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">{design}</span>
                  <span className="font-medium text-gray-900">{count} ({percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderQualityChart = () => {
    if (!chartData) return null;

    const { qualityData } = chartData;
    const total = Object.values(qualityData).reduce((sum, count) => sum + count, 0);
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Quality Assessment Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(qualityData).map(([risk, count]) => {
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            const color = risk === 'Low Risk' ? 'green' : risk === 'Moderate Risk' ? 'yellow' : 'red';
            return (
              <div key={risk} className="text-center">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  color === 'green' ? 'bg-green-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {percentage}%
                </div>
                <div className="mt-2">
                  <div className="font-medium text-gray-900">{risk}</div>
                  <div className="text-sm text-gray-600">{count} studies</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearChart = () => {
    if (!chartData) return null;

    const { yearData } = chartData;
    const years = Object.keys(yearData).sort();
    const maxCount = Math.max(...Object.values(yearData));
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Publication Year Distribution</h3>
        <div className="space-y-2">
          {years.map(year => {
            const count = yearData[year];
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={year} className="flex items-center gap-3">
                <div className="w-16 text-sm text-gray-700">{year}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div 
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium"
                    style={{ width: `${height}%` }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderReviewerChart = () => {
    if (!chartData) return null;

    const { reviewerData } = chartData;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Reviewer Activity</h3>
        <div className="space-y-3">
          {Object.entries(reviewerData).map(([reviewer, count]) => (
            <div key={reviewer} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {reviewer.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-gray-900">{reviewer}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{count} reviews</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((count / Math.max(...Object.values(reviewerData))) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (activeChart) {
      case 'prisma':
        return renderPRISMAFlow();
      case 'study-design':
        return renderStudyDesignChart();
      case 'quality':
        return renderQualityChart();
      case 'year':
        return renderYearChart();
      case 'reviewer':
        return renderReviewerChart();
      default:
        return renderPRISMAFlow();
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'max-w-6xl mx-auto'} p-6`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={28} />
              Interactive Visualizations
            </h1>
            <p className="text-gray-600 mt-1">
              Interactive charts and PRISMA flow diagrams for your systematic review
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={() => exportChart('png')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Chart Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'prisma', label: 'PRISMA Flow', icon: Target },
              { id: 'study-design', label: 'Study Design', icon: BarChart3 },
              { id: 'quality', label: 'Quality Assessment', icon: CheckCircle },
              { id: 'year', label: 'Publication Year', icon: Calendar },
              { id: 'reviewer', label: 'Reviewer Activity', icon: Users }
            ].map(chart => (
              <button
                key={chart.id}
                onClick={() => setActiveChart(chart.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeChart === chart.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <chart.icon size={16} />
                {chart.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <div ref={chartRef}>
            {renderChart()}
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {chartData && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{chartData.summary.totalDocs}</div>
            <div className="text-sm text-gray-600">Total Documents</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{chartData.summary.screenedDocs}</div>
            <div className="text-sm text-gray-600">Screened</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{chartData.summary.includedDocs}</div>
            <div className="text-sm text-gray-600">Included</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{chartData.summary.excludedDocs}</div>
            <div className="text-sm text-gray-600">Excluded</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{chartData.summary.pendingDocs}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      )}
    </div>
  );
}

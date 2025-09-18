'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  Target,
  Activity,
  PieChart,
  Download
} from 'lucide-react';

export default function AnalyticsDashboard({ project, documents, users }) {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [project.id]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?projectId=${project.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.analytics);
        }
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeData = () => {
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return { startDate, endDate: now };
  };

  const calculateProgressMetrics = () => {
    if (analytics) {
      return {
        totalDocs: analytics.overview.totalDocuments,
        screenedDocs: analytics.overview.screenedDocuments,
        includedDocs: analytics.overview.includedDocuments,
        excludedDocs: analytics.overview.excludedDocuments,
        pendingDocs: analytics.overview.pendingDocuments,
        docsWithExtractedData: documents.filter(doc => doc.extractedData?.length > 0).length,
        docsWithTables: documents.filter(doc => doc.tables?.length > 0).length,
        screeningProgress: analytics.overview.screeningProgress,
        inclusionRate: analytics.overview.inclusionRate
      };
    }
    
    // Fallback to calculated metrics
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
    const docsWithExtractedData = documents.filter(doc => doc.extractedData?.length > 0).length;
    const docsWithTables = documents.filter(doc => doc.tables?.length > 0).length;

    return {
      totalDocs,
      screenedDocs,
      includedDocs,
      excludedDocs,
      pendingDocs,
      docsWithExtractedData,
      docsWithTables,
      screeningProgress: totalDocs > 0 ? Math.round((screenedDocs / totalDocs) * 100) : 0,
      inclusionRate: screenedDocs > 0 ? Math.round((includedDocs / screenedDocs) * 100) : 0
    };
  };

  const calculateUserActivity = () => {
    const userActivity = {};
    
    documents.forEach(doc => {
      // Screening activity
      doc.screening?.forEach(screening => {
        const userId = screening.userId;
        if (!userActivity[userId]) {
          userActivity[userId] = {
            screenings: 0,
            extractions: 0,
            lastActivity: null
          };
        }
        userActivity[userId].screenings++;
        if (!userActivity[userId].lastActivity || new Date(screening.timestamp) > new Date(userActivity[userId].lastActivity)) {
          userActivity[userId].lastActivity = screening.timestamp;
        }
      });

      // Extraction activity
      doc.extractedData?.forEach(extraction => {
        const userId = extraction.extractedBy;
        if (userId && userActivity[userId]) {
          userActivity[userId].extractions++;
        }
      });
    });

    return userActivity;
  };

  const calculateTimeSeriesData = () => {
    const { startDate, endDate } = getTimeRangeData();
    const timeSeries = [];
    
    // Group documents by creation date
    const docsByDate = {};
    documents.forEach(doc => {
      const docDate = new Date(doc.createdAt).toDateString();
      if (!docsByDate[docDate]) {
        docsByDate[docDate] = { total: 0, screened: 0, included: 0, excluded: 0 };
      }
      docsByDate[docDate].total++;
      
      if (doc.screening?.length > 0) {
        docsByDate[docDate].screened++;
        const latestScreening = doc.screening[doc.screening.length - 1];
        if (latestScreening.decision === 'included') {
          docsByDate[docDate].included++;
        } else if (latestScreening.decision === 'excluded') {
          docsByDate[docDate].excluded++;
        }
      }
    });

    // Create time series data
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toDateString();
      const dayData = docsByDate[dateStr] || { total: 0, screened: 0, included: 0, excluded: 0 };
      
      timeSeries.push({
        date: d.toISOString().split('T')[0],
        total: dayData.total,
        screened: dayData.screened,
        included: dayData.included,
        excluded: dayData.excluded
      });
    }

    return timeSeries;
  };

  const calculateQualityMetrics = () => {
    const docsWithQualityAssessment = documents.filter(doc => doc.qualityAssessment);
    const qualityScores = docsWithQualityAssessment.map(doc => doc.qualityAssessment.overallScore);
    
    if (qualityScores.length === 0) {
      return {
        averageScore: 0,
        lowRiskCount: 0,
        moderateRiskCount: 0,
        highRiskCount: 0,
        assessedCount: 0
      };
    }

    const averageScore = Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length);
    const lowRiskCount = qualityScores.filter(score => score >= 80).length;
    const moderateRiskCount = qualityScores.filter(score => score >= 60 && score < 80).length;
    const highRiskCount = qualityScores.filter(score => score < 60).length;

    return {
      averageScore,
      lowRiskCount,
      moderateRiskCount,
      highRiskCount,
      assessedCount: docsWithQualityAssessment.length
    };
  };

  const metrics = calculateProgressMetrics();
  const userActivity = calculateUserActivity();
  const timeSeriesData = calculateTimeSeriesData();
  const qualityMetrics = calculateQualityMetrics();

  const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center mt-1 text-sm ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              <TrendingUp size={16} className={trend < 0 ? 'rotate-180' : ''} />
              <span className="ml-1">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon size={24} className={`text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ label, current, total, color = 'blue' }) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{current} / {total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
          style={{ width: `${total > 0 ? (current / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">{project?.name || 'Project'} - Progress & Performance</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download size={16} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Documents"
          value={metrics.totalDocs}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Screening Progress"
          value={`${metrics.screeningProgress}%`}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Included Studies"
          value={metrics.includedDocs}
          icon={Target}
          color="green"
        />
        <StatCard
          title="Inclusion Rate"
          value={`${metrics.inclusionRate}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={20} />
            Screening Progress
          </h2>
          <ProgressBar
            label="Documents Screened"
            current={metrics.screenedDocs}
            total={metrics.totalDocs}
            color="blue"
          />
          <ProgressBar
            label="Documents with Extracted Data"
            current={metrics.docsWithExtractedData}
            total={metrics.includedDocs}
            color="green"
          />
          <ProgressBar
            label="Documents with Tables"
            current={metrics.docsWithTables}
            total={metrics.totalDocs}
            color="purple"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart size={20} />
            Document Status Distribution
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Included</span>
              </div>
              <span className="font-medium">{metrics.includedDocs}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Excluded</span>
              </div>
              <span className="font-medium">{metrics.excludedDocs}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="font-medium">{metrics.pendingDocs}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Assessment Metrics */}
      {qualityMetrics.assessedCount > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            Quality Assessment Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{qualityMetrics.averageScore}%</div>
              <div className="text-sm text-gray-600">Average Quality Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{qualityMetrics.lowRiskCount}</div>
              <div className="text-sm text-gray-600">Low Risk Studies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{qualityMetrics.moderateRiskCount}</div>
              <div className="text-sm text-gray-600">Moderate Risk Studies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{qualityMetrics.highRiskCount}</div>
              <div className="text-sm text-gray-600">High Risk Studies</div>
            </div>
          </div>
        </div>
      )}

      {/* User Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={20} />
          User Activity
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Screenings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Extractions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(userActivity).map(([userId, activity]) => {
                const user = users?.find(u => u.id === userId);
                return (
                  <tr key={userId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user?.name || user?.email || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.screenings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.extractions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.lastActivity ? new Date(activity.lastActivity).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Time Series Chart Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar size={20} />
          Activity Over Time
        </h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 size={48} className="mx-auto mb-2 text-gray-400" />
            <p>Chart visualization would be implemented here</p>
            <p className="text-sm">Data points: {timeSeriesData.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

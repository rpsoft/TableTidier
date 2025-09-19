'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export default function APISettingsPage() {
  const [settings, setSettings] = useState({
    cochrane: {
      enabled: false,
      apiKey: ''
    },
    embase: {
      enabled: false,
      apiKey: ''
    }
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load current settings
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings/api-keys');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (source, field, value) => {
    setSettings(prev => ({
      ...prev,
      [source]: {
        ...prev[source],
        [field]: value
      }
    }));
  };

  const dataSources = [
    {
      id: 'pubmed',
      name: 'PubMed/MEDLINE',
      description: 'Free access to biomedical literature via NCBI E-utilities',
      icon: '🔬',
      requiresAuth: false,
      status: 'enabled'
    },
    {
      id: 'clinicaltrials',
      name: 'ClinicalTrials.gov',
      description: 'Clinical trial registry database via REST API v2.0',
      icon: '🏥',
      requiresAuth: false,
      status: 'enabled'
    },
    {
      id: 'cochrane',
      name: 'Cochrane Library',
      description: 'Systematic reviews and meta-analyses',
      icon: '📚',
      requiresAuth: true,
      status: settings.cochrane.enabled ? 'enabled' : 'disabled'
    },
    {
      id: 'embase',
      name: 'Embase',
      description: 'Comprehensive biomedical database via Elsevier API',
      icon: '🔍',
      requiresAuth: true,
      status: settings.embase.enabled ? 'enabled' : 'disabled'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">API Settings</h1>
            <p className="text-gray-600 mt-1">
              Configure API keys and settings for external data sources
            </p>
          </div>

          <div className="p-6 space-y-8">
            {dataSources.map((source) => (
              <div key={source.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{source.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {source.name}
                      </h3>
                      <p className="text-gray-600 mt-1">{source.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          source.status === 'enabled' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {source.status === 'enabled' ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Enabled
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Disabled
                            </>
                          )}
                        </span>
                        {source.requiresAuth && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Requires API Key
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {source.requiresAuth && (
                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      Get API Key
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {source.requiresAuth && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${source.id}-enabled`}
                        checked={settings[source.id]?.enabled || false}
                        onChange={(e) => handleSettingChange(source.id, 'enabled', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`${source.id}-enabled`} className="ml-2 text-sm text-gray-700">
                        Enable {source.name} integration
                      </label>
                    </div>

                    {settings[source.id]?.enabled && (
                      <div>
                        <label htmlFor={`${source.id}-key`} className="block text-sm font-medium text-gray-700 mb-2">
                          API Key
                        </label>
                        <input
                          type="password"
                          id={`${source.id}-key`}
                          value={settings[source.id]?.apiKey || ''}
                          onChange={(e) => handleSettingChange(source.id, 'apiKey', e.target.value)}
                          placeholder={`Enter your ${source.name} API key`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Your API key will be stored securely and used for {source.name} requests.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {message && (
              <div className={`flex items-center gap-2 p-4 rounded-md ${
                message.includes('success') 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {message.includes('success') ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                {message}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TestAnalysisPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState(null);
  const [businessIdea, setBusinessIdea] = useState('');
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState(null);

  useEffect(() => {
    // Test database connection
    const testDb = async () => {
      try {
        const response = await fetch('/api/test-db');
        const data = await response.json();
        setDbStatus(data);
      } catch (error) {
        console.error('Error testing database:', error);
        setDbStatus({ success: false, error: error.message });
      }
    };

    testDb();

    // Get analysis from localStorage
    if (typeof window !== 'undefined') {
      // First try to get the latest analysis
      const latestAnalysis = localStorage.getItem('noviq_latest_analysis');
      const latestIdea = localStorage.getItem('noviq_latest_business_idea');
      
      if (latestAnalysis) {
        try {
          setAnalysis(JSON.parse(latestAnalysis));
          setBusinessIdea(latestIdea || '');
        } catch (error) {
          console.error('Error parsing latest analysis:', error);
        }
      }
      
      // If no latest analysis, try the regular one
      if (!latestAnalysis) {
        const savedAnalysis = localStorage.getItem('noviq_analysis');
        const savedIdea = localStorage.getItem('noviq_business_idea');
        
        if (savedAnalysis) {
          try {
            setAnalysis(JSON.parse(savedAnalysis));
            setBusinessIdea(savedIdea || '');
          } catch (error) {
            console.error('Error parsing analysis:', error);
          }
        }
      }
      
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Test Analysis Page</h1>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/summary')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Summary
            </button>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">Database Status</h2>
          {dbStatus ? (
            <div>
              <p className="mb-2">
                <span className="font-bold">Status:</span>{' '}
                <span className={dbStatus.success ? 'text-green-600' : 'text-red-600'}>
                  {dbStatus.success ? 'Connected' : 'Error'}
                </span>
              </p>
              {dbStatus.success ? (
                <>
                  <p className="mb-2"><span className="font-bold">Collections:</span> {dbStatus.collections.join(', ')}</p>
                  <p><span className="font-bold">Analyses Count:</span> {dbStatus.analysesCount}</p>
                </>
              ) : (
                <p className="text-red-600">{dbStatus.error}</p>
              )}
            </div>
          ) : (
            <p>Testing database connection...</p>
          )}
        </div>

        {/* Business Idea */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">Business Idea</h2>
          <p className="text-lg">{businessIdea || 'No business idea found'}</p>
        </div>

        {/* Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">Analysis</h2>
          {analysis ? (
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px] text-sm">
              {JSON.stringify(analysis, null, 2)}
            </pre>
          ) : (
            <p>No analysis found</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              localStorage.removeItem('noviq_latest_analysis');
              localStorage.removeItem('noviq_latest_business_idea');
              localStorage.removeItem('noviq_analysis');
              localStorage.removeItem('noviq_business_idea');
              window.location.reload();
            }}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear LocalStorage
          </button>
          <button
            onClick={() => {
              if (analysis) {
                localStorage.setItem('noviq_analysis', JSON.stringify(analysis));
                localStorage.setItem('noviq_business_idea', businessIdea);
                router.push('/summary');
              }
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            disabled={!analysis}
          >
            View in Summary
          </button>
        </div>
      </div>
    </div>
  );
} 
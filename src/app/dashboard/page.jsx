"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace('/register');
    },
  });

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    console.log('Dashboard page loaded, session status:', status);
    console.log('Session data:', session);
    
    if (status === 'authenticated' && session?.user?.id) {
      console.log('Fetching analyses for user:', session.user.id);
      fetchAnalyses();
    }
  }, [status, session]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching analyses from API...');
      const response = await fetch(`/api/analyses/all?userId=${session.user.id}`);
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analyses: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('API response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error(`Failed to parse response: ${responseText.substring(0, 100)}...`);
      }
      
      console.log('Analyses data:', data);
      setDebugInfo({
        responseStatus: response.status,
        responseData: data
      });
      
      setAnalyses(data.analyses || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      setError('Failed to load your business ideas: ' + error.message);
      setDebugInfo({
        error: error.message
      });
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Show loading state while checking authentication
  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-blue-500">Loading session...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-blue-500">Loading your business ideas...</p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs max-w-md overflow-auto">
            <p className="font-bold">Debug Info:</p>
            <p>Session ID: {session?.user?.id}</p>
            <p>Session Status: {status}</p>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="font-medium mb-4">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={fetchAnalyses}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs max-w-md overflow-auto">
            <p className="font-bold">Debug Info:</p>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Business Ideas</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Idea
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-gray-100 rounded-lg text-xs overflow-auto">
            <p className="font-bold">Debug Info:</p>
            <p>Analyses count: {analyses.length}</p>
            <button
              onClick={() => console.log('Analyses:', analyses)}
              className="mt-2 px-2 py-1 bg-gray-300 rounded"
            >
              Log Analyses
            </button>
          </div>
        )}

        {analyses.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold mb-4">No Business Ideas Yet</h2>
            <p className="text-gray-600 mb-6">Start by submitting your first business idea!</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Idea
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyses.map((analysis, index) => (
              <div 
                key={analysis._id || index} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  // Store in localStorage for the summary page
                  localStorage.setItem('noviq_analysis', JSON.stringify(analysis.analysis));
                  localStorage.setItem('noviq_business_idea', analysis.businessIdea);
                  router.push('/summary');
                }}
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2 line-clamp-2">{analysis.businessIdea}</h2>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-800 text-sm font-bold">
                        {analysis.analysis?.offline_analysis?.executive_summary?.viability_score || '?'}%
                      </div>
                      <span className="ml-2 text-sm text-gray-600">Viability</span>
                    </div>
                    <span className="text-xs text-gray-500">{analysis.createdAt ? formatDate(analysis.createdAt) : 'Unknown date'}</span>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-3">
                  <p className="text-sm text-gray-600 font-medium">
                    {analysis.analysis?.offline_analysis?.executive_summary?.headline || 'No headline available'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
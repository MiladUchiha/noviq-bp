"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SummaryPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace('/register');
    },
  });

  const [analysis, setAnalysis] = useState(null);
  const [businessIdea, setBusinessIdea] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run if we have a session
    if (status === 'authenticated' && session?.user?.id) {
      // Get analysis from localStorage
      if (typeof window !== 'undefined') {
        // First try to get the latest analysis
        const latestAnalysis = localStorage.getItem('noviq_latest_analysis');
        const latestIdea = localStorage.getItem('noviq_latest_business_idea');
        
        if (latestAnalysis) {
          try {
            setAnalysis(JSON.parse(latestAnalysis));
            setBusinessIdea(latestIdea || '');
            setLoading(false);
            
            // Clear the latest analysis from localStorage to avoid confusion
            localStorage.removeItem('noviq_latest_analysis');
            localStorage.removeItem('noviq_latest_business_idea');
            return;
          } catch (error) {
            console.error('Error parsing latest analysis:', error);
          }
        }
        
        // If no latest analysis, try the regular one
        const savedAnalysis = localStorage.getItem('noviq_analysis');
        const savedIdea = localStorage.getItem('noviq_business_idea');
        
        if (savedAnalysis) {
          try {
            setAnalysis(JSON.parse(savedAnalysis));
            setBusinessIdea(savedIdea || '');
            setLoading(false);
          } catch (error) {
            console.error('Error parsing analysis:', error);
            fetchAnalysisFromDatabase();
          }
        } else {
          fetchAnalysisFromDatabase();
        }
      }
    }
  }, [status, session]);

  const fetchAnalysisFromDatabase = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/analyses?userId=${session.user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }
      
      const data = await response.json();
      
      if (data.success && data.analysis) {
        setAnalysis(data.analysis.analysis);
        setBusinessIdea(data.analysis.businessIdea || '');
      } else {
        console.log('No analysis found in database');
        // Redirect to dashboard if no analysis is found
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      // Redirect to dashboard on error
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDeepResearch = () => {
    // This will be implemented later
    alert('Deep research functionality will be implemented in a future update.');
  };

  // Show loading state while checking authentication
  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Analysis Found</h1>
          <p className="text-gray-600 mb-6">Please start by submitting your business idea.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { offline_analysis } = analysis;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Business Idea Analysis</h1>
          <p className="text-xl text-gray-700 mb-8">"{businessIdea}"</p>
        </div>

        {/* Executive Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">Executive Summary</h2>
          <div className="flex flex-col md:flex-row items-center mb-6">
            <div className="w-32 h-32 rounded-full flex items-center justify-center bg-blue-100 text-blue-800 text-4xl font-bold mb-4 md:mb-0 md:mr-6">
              {offline_analysis.executive_summary.viability_score}%
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">{offline_analysis.executive_summary.headline}</h3>
              <ul className="list-disc pl-5 space-y-1">
                {offline_analysis.executive_summary.key_points.map((point, index) => (
                  <li key={index} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Radar Chart (simplified visualization) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">Business Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {offline_analysis.radar_chart.categories.map((category, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${offline_analysis.radar_chart.values[index]}%` }}
                  ></div>
                </div>
                <div className="h-16 flex items-center justify-center">
                  <p className="text-center text-sm font-medium">{category}: {offline_analysis.radar_chart.values[index]}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Projection */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">Revenue Projection</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {offline_analysis.revenue_projection.timeline.map((time, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="h-32 flex items-end justify-center w-full">
                  <div 
                    className="w-16 bg-green-500 rounded-t-lg" 
                    style={{ 
                      height: `${(offline_analysis.revenue_projection.values[index] / Math.max(...offline_analysis.revenue_projection.values)) * 100}%`,
                      minHeight: '10%'
                    }}
                  ></div>
                </div>
                <p className="mt-2 text-center font-medium">{time}</p>
                <p className="text-center text-sm">{offline_analysis.revenue_projection.values[index]} {offline_analysis.revenue_projection.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Startup Costs */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">Startup Costs</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {offline_analysis.startup_costs.categories.map((category, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="h-32 flex items-end justify-center w-full">
                  <div 
                    className="w-16 bg-red-500 rounded-t-lg" 
                    style={{ 
                      height: `${(offline_analysis.startup_costs.values[index] / Math.max(...offline_analysis.startup_costs.values)) * 100}%`,
                      minHeight: '10%'
                    }}
                  ></div>
                </div>
                <p className="mt-2 text-center font-medium">{category}</p>
                <p className="text-center text-sm">{offline_analysis.startup_costs.values[index]} {offline_analysis.startup_costs.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">Business Timeline</h2>
          <div className="relative">
            <div className="absolute left-0 top-6 w-full h-1 bg-gray-200"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {offline_analysis.timeline.phases.map((phase, index) => {
                const totalMonths = offline_analysis.timeline.durations.reduce((a, b) => a + b, 0);
                const previousMonths = offline_analysis.timeline.durations.slice(0, index).reduce((a, b) => a + b, 0);
                const phaseWidth = (offline_analysis.timeline.durations[index] / totalMonths) * 100;
                
                return (
                  <div key={index} className="flex flex-col items-center pt-8">
                    <div className="w-4 h-4 rounded-full bg-blue-600 absolute top-5"></div>
                    <p className="font-medium">{phase}</p>
                    <p className="text-sm text-gray-600">{offline_analysis.timeline.durations[index]} months</p>
                    {offline_analysis.timeline.milestones.filter(m => m.phase === phase).map((milestone, i) => (
                      <div key={i} className="mt-2 p-2 bg-blue-100 rounded text-sm w-full">
                        <p className="font-medium">{milestone.title}</p>
                        <p className="text-xs">Month {milestone.month}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SWOT Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">SWOT Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-green-800">Strengths</h3>
              <ul className="list-disc pl-5 space-y-1">
                {offline_analysis.swot.strengths.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-red-800">Weaknesses</h3>
              <ul className="list-disc pl-5 space-y-1">
                {offline_analysis.swot.weaknesses.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Opportunities</h3>
              <ul className="list-disc pl-5 space-y-1">
                {offline_analysis.swot.opportunities.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-yellow-800">Threats</h3>
              <ul className="list-disc pl-5 space-y-1">
                {offline_analysis.swot.threats.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Research Query */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">Research Query</h2>
          <p className="text-gray-700 mb-4">{analysis.research_query}</p>
          <div className="flex justify-center">
            <button
              onClick={handleDeepResearch}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Run Deep Research
            </button>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Idea
          </button>
        </div>
      </div>
    </div>
  );
} 
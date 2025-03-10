"use client";

import { useState } from 'react';

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const testData = {
        prompt: "I want to open a specialty coffee shop in Amsterdam focusing on unique pistachio and chocolate flavored coffee drinks.",
        answers: {
          "q1": {
            "question": "Who is most likely to visit your unique coffee shop?",
            "selected": "Coffee enthusiasts"
          },
          "q2": {
            "question": "What makes your coffee shop different from others?",
            "selected": "Special pistachio chocolate coffee blend"
          },
          "q3": {
            "question": "How will you price your specialty coffee drinks?",
            "selected": "Premium prices for unique recipes"
          },
          "q4": {
            "question": "What equipment will you need to start?",
            "selected": "Professional chocolate and pistachio preparation tools"
          }
        },
        userId: "test-user"
      };

      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        throw new Error('Test failed');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.analysis);
      
      // Store in localStorage for testing the summary page
      localStorage.setItem('noviq_analysis', JSON.stringify(data.analysis));
      localStorage.setItem('noviq_business_idea', testData.prompt);
      
    } catch (error) {
      console.error('Test error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Test Page</h1>
        
        <button
          onClick={handleTest}
          disabled={loading}
          className={`px-6 py-3 bg-blue-600 text-white rounded-lg mb-8 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
        >
          {loading ? 'Testing...' : 'Run Test'}
        </button>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}
        
        {result && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Test Result</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px]">
              {JSON.stringify(result, null, 2)}
            </pre>
            
            <div className="mt-6">
              <a 
                href="/summary" 
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                View Summary Page
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
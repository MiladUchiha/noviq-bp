"use client";

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function IdeaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace('/register');
    },
  });
  const [feedback, setFeedback] = useState(() => {
    // Try to get from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('noviq_feedback');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [needsMoreInfo, setNeedsMoreInfo] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('noviq_needs_more_info');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [questions, setQuestions] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('noviq_questions');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [currentFeedbackIndex, setCurrentFeedbackIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('noviq_feedback_index');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('noviq_answers');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [showQuestions, setShowQuestions] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('noviq_show_questions');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const initialPrompt = searchParams.get('prompt');

  // Save state to localStorage when it changes
  useEffect(() => {
    if (feedback.length > 0) {
      localStorage.setItem('noviq_feedback', JSON.stringify(feedback));
      localStorage.setItem('noviq_needs_more_info', JSON.stringify(needsMoreInfo));
      localStorage.setItem('noviq_feedback_index', currentFeedbackIndex.toString());
      localStorage.setItem('noviq_show_questions', JSON.stringify(showQuestions));
    }
  }, [feedback, needsMoreInfo, currentFeedbackIndex, showQuestions]);

  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem('noviq_questions', JSON.stringify(questions));
    }
  }, [questions]);

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem('noviq_answers', JSON.stringify(answers));
    }
  }, [answers]);

  // Clear localStorage when component unmounts
  useEffect(() => {
    return () => {
      localStorage.removeItem('noviq_feedback');
      localStorage.removeItem('noviq_needs_more_info');
      localStorage.removeItem('noviq_questions');
      localStorage.removeItem('noviq_feedback_index');
      localStorage.removeItem('noviq_answers');
      localStorage.removeItem('noviq_show_questions');
    };
  }, []);

  useEffect(() => {
    const getInitialFeedback = async () => {
      // If we already have feedback in state, don't fetch again
      if (feedback.length > 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const systemPrompt = `# Noviq Business Idea Analysis System Prompt

You are Noviq's AI business advisor. Your responses must be valid JSON with concise, inspiring feedback about the user's business idea.

## Response Format

{
  "feedback": [
    "First short, inspiring sentence about the idea.",
    "Second short, inspiring sentence about potential.",
    "Third short, inspiring sentence about market fit.",
    "Fourth short, inspiring sentence about uniqueness."
  ],
  "needsMoreInfo": true
}

## Feedback Guidelines

1. Provide EXACTLY 4 sentences in the feedback array.
2. Each sentence should be 10-15 words maximum.
3. Be specific to their idea, not generic business advice.
4. Focus on different aspects: concept, potential, market fit, and uniqueness.
5. Use energetic, positive language that motivates the entrepreneur.
6. Always set needsMoreInfo to true so we can collect additional information.`;

        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: initialPrompt,
            systemPrompt,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI feedback');
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.feedback || data.feedback.length === 0) {
          throw new Error('No feedback received');
        }

        console.log('Feedback received:', data);
        setFeedback(data.feedback);
        setNeedsMoreInfo(true); // Force this to true to ensure questions are shown
        
        // Always get questions regardless of needsMoreInfo flag
        await getQuestions();
      } catch (error) {
        console.error('Error getting feedback:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const getQuestions = async () => {
      try {
        console.log('Fetching questions...');
        const followUpSystemPrompt = `# Noviq Follow-up Questions Generator

You are Noviq's business idea analysis assistant. When more information is needed about a business idea, generate clear, simple questions that anyone can understand, regardless of business experience or age.

## Response Format

{
  "questions": [
    {
      "id": "q1",
      "question": "Simple question about the business idea?",
      "category": "target_market",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4"
      ]
    }
  ]
}

## Question Guidelines

1. Generate 3-5 questions total
2. Keep questions under 15 words
3. Use everyday language, avoid business jargon
4. Make questions specific to the user's idea
5. Each question should focus on a different aspect of the business

## Question Categories

Each question should have one of these categories:
- "target_market" (who will buy/use this?)
- "revenue_model" (how will this make money?)
- "unique_value" (what makes this special?)
- "resources_needed" (what will you need to start?)
- "personal_fit" (why are you the right person for this?)`;

        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: initialPrompt,
            systemPrompt: followUpSystemPrompt,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get follow-up questions');
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.questions || data.questions.length === 0) {
          throw new Error('No questions received');
        }

        console.log('Questions received:', data.questions);
        setQuestions(data.questions);
      } catch (error) {
        console.error('Error getting questions:', error);
        setError(error.message);
      }
    };

    if (initialPrompt && session) {
      getInitialFeedback();
    }
  }, [initialPrompt, session]);

  const handleAnswerSelect = (questionId, answer) => {
    const question = questions.find(q => q.id === questionId);
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        question: question.question,
        selected: answer
      }
    }));
  };

  const handleNextFeedback = () => {
    console.log('Current feedback index:', currentFeedbackIndex, 'Total feedback:', feedback.length, 'Needs more info:', needsMoreInfo);
    
    if (currentFeedbackIndex < feedback.length - 1) {
      setCurrentFeedbackIndex(currentFeedbackIndex + 1);
    } else if (needsMoreInfo) {
      console.log('Setting showQuestions to true');
      setShowQuestions(true);
    } else {
      // If no more questions needed, redirect to dashboard
      router.push('/dashboard');
    }
  };

  const handleSubmitAnswers = async () => {
    try {
      setSubmitting(true);
      setError(null);

      console.log('Submitting answers:', {
        prompt: initialPrompt,
        answers: answers,
        userId: session?.user?.id
      });

      // Store answers in the database and get AI analysis
      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: initialPrompt,
          answers: answers,
          userId: session?.user?.id
        }),
      });

      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error(`Failed to parse response: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(`Server error (${response.status}): ${data.error || 'Unknown error'}`);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Store the latest analysis in localStorage for immediate access
      if (data.success && data.analysis) {
        localStorage.setItem('noviq_latest_analysis', JSON.stringify(data.analysis));
        localStorage.setItem('noviq_latest_business_idea', initialPrompt);
      }

      // Clear localStorage items related to the idea flow
      localStorage.removeItem('noviq_feedback');
      localStorage.removeItem('noviq_needs_more_info');
      localStorage.removeItem('noviq_questions');
      localStorage.removeItem('noviq_feedback_index');
      localStorage.removeItem('noviq_answers');
      localStorage.removeItem('noviq_show_questions');

      // Redirect to the summary page instead of dashboard to show the analysis immediately
      router.push('/summary');
    } catch (error) {
      console.error('Submit answers error:', error);
      setError('Failed to submit answers: ' + error.message);
    } finally {
      setSubmitting(false);
    }
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="font-medium mb-4">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                // Clear error and go back to questions
                setError(null);
                setSubmitting(false);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Back to Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!initialPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Business Idea Found</h1>
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

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        {!showQuestions ? (
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold mb-8">Your Business Idea Analysis</h1>
            
            <div className="bg-white p-8 rounded-lg shadow-lg transition-all duration-500 ease-in-out">
              {/* Progress indicator */}
              <div className="flex justify-center mb-4 space-x-2">
                {feedback.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                      index === currentFeedbackIndex
                        ? 'bg-blue-500 scale-125'
                        : index < currentFeedbackIndex
                        ? 'bg-blue-200'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              <div className="min-h-[120px] flex items-center justify-center">
                <p className="text-xl font-medium text-gray-800 animate-fade-in transition-opacity duration-300">
                  {feedback[currentFeedbackIndex]}
                </p>
              </div>
              
              <button
                onClick={handleNextFeedback}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105"
              >
                {currentFeedbackIndex < feedback.length - 1 ? 'Next' : needsMoreInfo ? 'Continue to Questions' : 'Finish'}
              </button>
              
              {/* Debug button - only visible in development */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => {
                    console.log({
                      feedback,
                      needsMoreInfo,
                      questions,
                      currentFeedbackIndex,
                      showQuestions
                    });
                    setShowQuestions(true);
                  }}
                  className="mt-4 px-4 py-1 bg-gray-200 text-gray-700 text-sm rounded"
                >
                  Debug: Show Questions
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-center">Help Us Understand Better</h2>
            
            {/* Debug info in development mode */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-100 p-4 rounded-lg mb-4 text-xs">
                <p className="font-bold mb-2">Debug Info:</p>
                <p>Questions: {questions.length}</p>
                <p>Answers: {Object.keys(answers).length}</p>
                <p>Questions IDs: {questions.map(q => q.id).join(', ')}</p>
                <p>Answer IDs: {Object.keys(answers).join(', ')}</p>
                <button
                  onClick={() => console.log({ questions, answers })}
                  className="mt-2 px-2 py-1 bg-gray-300 rounded"
                >
                  Log Details
                </button>
              </div>
            )}
            
            {questions.length === 0 ? (
              <div className="bg-yellow-50 p-6 rounded-lg shadow-lg text-center">
                <p className="text-lg font-medium mb-4">Loading questions...</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                >
                  Refresh
                </button>
              </div>
            ) : (
              questions.map((q) => (
                <div 
                  key={q.id} 
                  className="bg-white p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <p className="text-lg font-medium mb-4">{q.question}</p>
                  <div className="grid grid-cols-1 gap-3">
                    {q.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(q.id, option)}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          answers[q.id]?.selected === option
                            ? 'bg-blue-500 text-white border-blue-600 transform scale-105'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:shadow'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}

            {questions.length > 0 && questions.every(q => answers[q.id]?.selected) && (
              <div className="text-center">
                <button
                  onClick={handleSubmitAnswers}
                  disabled={submitting}
                  className={`px-8 py-3 bg-green-600 text-white rounded-lg transition-all duration-300 
                    ${submitting 
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-green-700 hover:scale-105'
                    }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Answers'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
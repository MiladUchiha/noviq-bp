"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Encode the prompt for URL safety
    const encodedPrompt = encodeURIComponent(prompt);
    router.push(`/register?prompt=${encodedPrompt}`);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Noviq AI</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit
          </button>
        </form>
      </div>
    </main>
  );
}

import { connectToDatabase } from '@/lib/db';
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(req) {
  try {
    const { prompt, answers, userId } = await req.json();

    console.log('Processing answers request:', { prompt, userId });

    // Read the system prompt from the prompts.md file
    const promptsPath = path.join(process.cwd(), 'src', 'prompts.md');
    const systemPrompt = fs.readFileSync(promptsPath, 'utf8');

    // Format the user input for Claude
    const userInput = `Business Idea: "${prompt}"

User Responses:
${JSON.stringify(answers, null, 2)}`;

    console.log('Calling Claude API with model: claude-3-sonnet-20240229');
    
    // Call Claude API with the correct format for system prompt
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        system: systemPrompt, // Use top-level system parameter
        messages: [
          {
            role: 'user',
            content: userInput
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error:', errorData);
      throw new Error(`AI request failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const result = data.content[0].text;

    // Parse the JSON response
    const parsedResult = JSON.parse(result);

    // Save the analysis to the database
    const { db } = await connectToDatabase();
    
    const analysisDocument = {
      userId,
      businessIdea: prompt,
      answers,
      analysis: parsedResult,
      createdAt: new Date()
    };
    
    await db.collection('analyses').insertOne(analysisDocument);

    return NextResponse.json({
      success: true,
      analysis: parsedResult
    });
  } catch (error) {
    console.error('Answer submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process answers: ' + error.message },
      { status: 500 }
    );
  }
} 
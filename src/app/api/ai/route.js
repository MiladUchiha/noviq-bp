import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { prompt, systemPrompt } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `User's idea: ${prompt}`
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

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('AI Error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
} 
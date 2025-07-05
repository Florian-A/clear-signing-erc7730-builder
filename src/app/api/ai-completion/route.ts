import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operation, abi } = body;
    if (!operation || !abi) {
      return NextResponse.json({ error: 'Missing operation structure or ABI' }, { status: 400 });
    }

    // Préparer le prompt pour OpenAI
    const prompt = `Here is the ABI of an Ethereum smart contract:\n${typeof abi === 'string' ? abi : JSON.stringify(abi, null, 2)}\n\nHere is the structure of an ERC-7730 operation to complete (some fields are empty or need to be qualified):\n${JSON.stringify(operation, null, 2)}\n\nIntelligently fill in all missing or empty fields, strictly following the ERC-7730 standard and using the provided ABI as context. Return only the final JSON, with no explanation.`;

    // Appel à l'API OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano',
        messages: [
          { role: 'system', content: 'You are an expert assistant in smart contracts and the ERC-7730 standard.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    let json;
    try {
      json = JSON.parse(content);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid AI response: ' + content }, { status: 500 });
    }

    return NextResponse.json({ result: json });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 
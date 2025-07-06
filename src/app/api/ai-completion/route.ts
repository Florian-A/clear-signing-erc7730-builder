import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operation, abi, metadata, type = 'operation' } = body;
    
    if (type === 'metadata') {
      return handleMetadataCompletion(metadata, abi);
    } else {
      return handleOperationCompletion(operation, abi);
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

async function handleMetadataCompletion(metadata: any, abi: any) {
  if (!metadata || !abi) {
    return NextResponse.json({ error: 'Missing metadata structure or ABI' }, { status: 400 });
  }

  const example = {
    "owner": "Example Company",
    "info": {
      "legalName": "Example Company Ltd.",
      "url": "https://example.com"
    }
  };

  const prompt = `Here is the ABI of an Ethereum smart contract:\n${typeof abi === 'string' ? abi : JSON.stringify(abi, null, 2)}\n\nHere is the current metadata structure (some fields may be empty or need to be completed):\n${JSON.stringify(metadata, null, 2)}\n\nYour task is to suggest appropriate values for the metadata fields based on the smart contract ABI. The metadata should include:
- owner: A common name for the smart contract owner/company
- info.legalName: The full legal name of the company
- info.url: A URL where users can find more information about the company/contract
- context.$id: A descriptive name for the smart contract

Your answer must be a valid metadata object with only the following structure:
{
  "owner": "string",
  "info": {
    "legalName": "string", 
    "url": "string"
  },
  "context": {
    "$id": "string"
  }
}

Return only the final JSON, with no explanation.`;

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
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are an expert assistant in smart contracts and the ERC-7730 standard.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 800,
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
}

async function handleOperationCompletion(operation: any, abi: any) {
  if (!operation || !abi) {
    return NextResponse.json({ error: 'Missing operation structure or ABI' }, { status: 400 });
  }

  const example = {
    "intent": "Mint a new token",
    "fields": [
      {
        "label": "Receiver",
        "format": "addressName",
        "params": {
          "types": ["eoa", "wallet"],
          "sources": ["userInput", "addressBook"]
        },
        "path": "#.receiver",
        "isRequired": true,
        "isIncluded": true
      },
      {
        "label": "Amount",
        "format": "tokenAmount",
        "params": {
          "tokenPath": "#.token"
        },
        "path": "#.amount",
        "isRequired": true,
        "isIncluded": true
      }
    ]
  };

  // Préparer le prompt pour OpenAI
  const prompt = `Here is the ABI of an Ethereum smart contract:\n${typeof abi === 'string' ? abi : JSON.stringify(abi, null, 2)}\n\nHere is the structure of an ERC-7730 operation to complete (some fields are empty or need to be qualified):\n${JSON.stringify(operation, null, 2)}\n\nYour answer must be a valid ERC-7730 operation object, with only the following keys: intent (string), fields (array of objects with label, format, params, path, isRequired, isIncluded), and nothing else. Do not include screens, required, excluded, value, $id, or any other keys. Do not wrap the answer in markdown or code block.\n\nHere are some valid values for the 'format' property: raw, addressName, calldata, amount, tokenAmount, nftName, date, duration, unit, enum. Always choose the most relevant one for each field.\n\nExample of the expected output:\n${JSON.stringify(example, null, 2)}\n\nFor each field, if it is missing, empty, or incomplete, suggest a plausible value based on the ABI and the ERC-7730 standard.\nFor each field, you MUST always fill the 'format' property with a valid and relevant value according to the ABI and the ERC-7730 standard. Do not leave any 'format' property empty, null, or undefined.\nFor dropdown or list fields, always select a valid and relevant option.\nAll fields and their parameters must be fully completed.\nReturn only the final JSON, with no explanation.`;

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
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are an expert assistant in smart contracts and the ERC-7730 standard.' },
        { role: 'user', content: `${prompt}\n\nFor each field, if it is missing, empty, or incomplete, suggest a plausible value based on the ABI and the ERC-7730 standard. Do not leave any field empty. Return only the final JSON, with no explanation.` },
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
} 
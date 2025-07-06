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

  // Préparer le prompt pour OpenAI avec des directives spécifiques ERC-7730
  const prompt = `Here is the ABI of an Ethereum smart contract:\n${typeof abi === 'string' ? abi : JSON.stringify(abi, null, 2)}\n\nHere is the structure of an ERC-7730 operation to complete (some fields are empty or need to be qualified):\n${JSON.stringify(operation, null, 2)}\n\nYour task is to generate a valid ERC-7730 operation object following these strict guidelines:

## ERC-7730 Field Format Standards:

**Valid Field Formats:**
- "raw": For unformatted data, hex strings, or when no specific formatting applies
- "addressName": For Ethereum addresses that should be displayed as human-readable names
- "calldata": For embedded smart contract calls with parameters
- "amount": For simple numeric amounts (wei, gas, etc.)
- "tokenAmount": For token amounts with decimals and ticker symbols
- "nftName": For NFT token IDs that should display collection and token names
- "date": For timestamp or block height values
- "duration": For time duration values
- "unit": For values with specific units (percentages, ratios, etc.)
- "enum": For enumerated values that map to human-readable strings

**Address Type Guidelines (for addressName format):**
- "wallet": Account controlled by the wallet
- "eoa": Externally Owned Account
- "contract": Well-known smart contract
- "token": Well-known ERC-20 token
- "collection": Well-known NFT collection

**Trusted Sources Guidelines (for addressName format):**
- "local": Address may be replaced with a local name trusted by user
- "ens": Address may be replaced with an associated ENS domain
- "userInput": User can input custom names
- "addressBook": From user's saved address book

## Field Naming and Intent Guidelines:

**Operation Intent:**
- Use clear, action-oriented descriptions
- Include the main action (transfer, mint, approve, etc.)
- Specify the target if relevant (e.g., "Transfer tokens to recipient")
- Keep it concise but descriptive

**Field Labels:**
- Use human-readable, descriptive names
- Be specific about what the field represents
- Use consistent terminology (e.g., "Recipient" not "To", "Amount" not "Value")
- Consider the user's perspective when naming

## Format Selection Logic:

1. **addressName**: Use for any address parameter (to, from, spender, owner, etc.)
2. **tokenAmount**: Use for token transfers, balances, allowances
3. **amount**: Use for gas, fees, simple numeric values
4. **calldata**: Use for complex function calls with embedded parameters
5. **date**: Use for timestamps, deadlines, expiration dates
6. **duration**: Use for time periods, lock periods, vesting schedules
7. **unit**: Use for percentages, ratios, multipliers
8. **enum**: Use for status fields, types, categories
9. **raw**: Use as fallback for unknown or complex data types

Your answer must be a valid ERC-7730 operation object with only: intent (string), fields (array of objects with label, format, params, path, isRequired, isIncluded).

Example of the expected output:\n${JSON.stringify(example, null, 2)}\n\nFor each field, analyze the ABI parameter type and name to determine the most appropriate format and parameters. Ensure all format properties are filled with valid ERC-7730 values. Return only the final JSON, with no explanation.`;

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
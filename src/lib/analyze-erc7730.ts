interface Erc7730Operation {
  intent?: string;
  fields?: Array<{
    label: string;
    path?: string;
    format?: string;
  }>;
}

interface Erc7730Json {
  context?: {
    contract?: {
      abi?: any[];
    };
  };
  display?: {
    formats?: Record<string, Erc7730Operation>;
  };
}

export async function analyzeErc7730WithAI(erc7730Json: Erc7730Json): Promise<string> {
  try {
    // Extract relevant information from the ERC7730 JSON
    const operations = erc7730Json.display?.formats || {};
    
    // Generate a summary based on existing descriptions
    let analysis = "";
    
    if (Object.keys(operations).length === 0) {
      analysis += "No functions found in the ERC7730 JSON.\n";
    } else {
      Object.entries(operations).forEach(([functionName, operation]) => {
        const intent = operation.intent;
        
        if (intent && intent.trim() !== "") {
          analysis += `### ${functionName}\n${intent}\n\n`;
          
          // Add field details if available
          if (operation.fields && operation.fields.length > 0) {
            analysis += "**Parameters:**\n";
            operation.fields.forEach((field) => {
              if (field.label && field.label.trim() !== "") {
                analysis += `- **${field.label}**`;
                if (field.path) {
                  analysis += ` (${field.path})`;
                }
                if (field.format) {
                  analysis += ` - Format: ${field.format}`;
                }
                analysis += "\n";
              }
            });
            analysis += "\n";
          }
        } else {
          analysis += `### ${functionName}\n*No description provided*\n\n`;
        }
      });
    }
    
    return analysis;

  } catch (error) {
    console.error("Error analyzing ERC7730:", error);
    return "Error analyzing ERC7730 JSON";
  }
} 
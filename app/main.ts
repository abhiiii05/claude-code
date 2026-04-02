import OpenAI from "openai";
import fs from "fs";

// Use the built-in fetch API instead of the 'openai' package to avoid missing dependency

async function main() {
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });
  
  const messages : any[] = [{ role: "user", content: prompt }];

  
  while (true) {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4.5",
        messages : messages,
        tools: [
          {
            type: "function",
            function: {
              name: "Read",
              description: "Read and return the contents of a file",
              parameters: {
                type: "object",
                properties: {
                  file_path: {
                    type: "string",
                    description: "The path to the file to read",
                  },
                },
                required: ["file_path"],
              },
            },
          },
          {
            "type": "function",
            "function": {
              "name": "Write",
              "description": "Write content to a file",
              "parameters": {
                "type": "object",
                "required": ["file_path", "content"],
                "properties": {
                  "file_path": {
                    "type": "string",
                    "description": "The path of the file to write to"
                  },
                  "content": {
                    "type": "string",
                    "description": "The content to write to the file"
                  }
                }
              }
            }
          }
        ],
        max_tokens: 1000,
      }),
    });
  
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `request failed: ${res.status} ${res.statusText} ${errText}`,
      );
    }
  
    const response = await res.json();
    // console.log(JSON.stringify(response, null, 2));
  
    if (!response.choices || response.choices.length === 0) {
      throw new Error("no choices in response");
    }
    
    const message = response.choices[0].message;
    messages.push(message);
    
  
    // You can use print statements as follows for debugging, they'll be visible when running tests.
    console.error("Logs from your program will appear here!");
    if(message.tool_calls && message.tool_calls.length >= 1) {
      const toolCall = message.tool_calls[0];
      const functionName = toolCall.function.name;
      const argumentsString = toolCall.function.arguments;
      const args = JSON.parse(argumentsString);
      const toolId = toolCall.id;
      
      
      if (functionName === "Read") {
        const content = fs.readFileSync(args.file_path, "utf-8");
        messages.push({ role: "tool", tool_call_id: toolId, content: content })
        // console.log(content);
      }
      
      if (functionName === "Write") {
        const content = args.content;
        const filePath = args.file_path;
        fs.writeFileSync(filePath, content, "utf-8");
        // console.log(filePath)
        messages.push({ role: "tool", tool_call_id: toolId, content: "File written successfully"  })
        
      }
    }

    // console.log(response.choices[0].message.content);
    
    if (!message.tool_calls) {
      console.log(message.content);
      break;
    }
  }

}  // Call the OpenRouter / OpenAI-compatible chat completions endpoint directly via fetch
 

main();

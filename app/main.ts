// Use the built-in fetch API instead of the 'openai' package to avoid missing dependency

async function main() {
  
  
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  
  

  
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  // Call the OpenRouter / OpenAI-compatible chat completions endpoint directly via fetch
  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "anthropic/claude-haiku-4.5",
      messages: [{ role: "user", content: prompt }],
      tools: [
        {
          "type": "function",
          "function": {
            "name": "Read",
            "description": "Read and return the contents of a file",
            "parameters": {
              "type": "object",
              "properties": {
                "file_path": {
                  "type": "string",
                  "description": "The path to the file to read"
                }
              },
              "required": ["file_path"]
            }
          }
        } 
      ],
      "tool_calls": [
                {
                  "id": "call_abc123",
                  "type": "function",
                  "function": {
                    "name": "Read",
                    "arguments": "{\"file_path\": \"/path/to/file.txt\"}"
                  }
                }
      ],
      "finish_reason": "tool_calls"
    } 
    ),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `request failed: ${res.status} ${res.statusText} ${errText}`,
    );
  }

  const response = await res.json();

  if (!response.choices || response.choices.length === 0) {
    throw new Error("no choices in response");
  }

  // You can use print statements as follows for debugging, they'll be visible when running tests.
  console.error("Logs from your program will appear here!");

  // TODO: Uncomment the lines below to pass the first stage
  console.log(response.choices[0].message.content);
}

main();

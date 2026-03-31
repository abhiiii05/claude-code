import OpenAI from "openai";
import fs from "fs";
import "../test1.txt"

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
  console.log(JSON.stringify(response, null, 2));

  if (!response.choices || response.choices.length === 0) {
    throw new Error("no choices in response");
  }
  
  const message = response.choices[0].message;
  

  // You can use print statements as follows for debugging, they'll be visible when running tests.
  console.error("Logs from your program will appear here!");
  // console.log(message)
  if(message.tool_calls && message.tool_calls.length >= 1) {
    const toolCall = message.tool_calls[0];
    const functionName = toolCall.function.name;
    const argumentsString = toolCall.function.arguments;
    const args = JSON.parse(argumentsString);
    
    // console.log("tool call detected", toolCall)
    // console.log(functionName)
    // console.log(argumentsString)
    // console.log(args)
    // console.log(args.file_path)
    
    
    if (functionName === "Read") {
      const content = fs.readFileSync(args.file_path, "utf-8");
      console.log(content);
    }
  }
  
  else {
    console.log(response)
  }

  // TODO: Uncomment the lines below to pass the first stage
  // console.log(response.choices[0].message.content);
}

main();

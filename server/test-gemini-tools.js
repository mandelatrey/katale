// Test script to verify Gemini API works with tool definitions
import { toolDefinitions } from "./ai/tools.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is required. Set it in your environment or a .env file.");
  process.exit(1);
}
const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

function toGeminiSchema(schema) {
  if (schema == null || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);

  const out = {};
  for (const [key, value] of Object.entries(schema)) {
    // Filter out unsupported JSON Schema keywords
    if (
      key === "exclusiveMinimum" ||
      key === "exclusiveMaximum" ||
      key === "pattern" ||
      key === "minLength" ||
      key === "maxLength" ||
      key === "format"
    ) {
      continue;
    }
    out[key] = toGeminiSchema(value);
  }
  return out;
}

function toGeminiTools(anthropicTools) {
  return [
    {
      functionDeclarations: anthropicTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: toGeminiSchema(
          tool.input_schema || { type: "object", properties: {} },
        ),
      })),
    },
  ];
}

async function testGeminiWithTools() {
  console.log(`Testing Gemini API with ${toolDefinitions.length} tools...`);
  
  const tools = toGeminiTools(toolDefinitions);
  console.log(`Converted to ${tools[0].functionDeclarations.length} Gemini function declarations`);
  
  // Sample first tool to verify schema conversion
  console.log("\nFirst tool after conversion:");
  console.log(JSON.stringify(tools[0].functionDeclarations[0], null, 2));

  const payload = {
    systemInstruction: {
      parts: [{ text: "You are a helpful assistant for agricultural markets in Uganda." }],
    },
    tools,
    contents: [
      {
        role: "user",
        parts: [{ text: "What is the price of maize?" }],
      },
    ],
  };

  try {
    const response = await fetch(
      `${GEMINI_ENDPOINT}/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const body = await response.json();
    
    if (!response.ok) {
      console.error("\n❌ Gemini API request failed:");
      console.error("Status:", response.status);
      console.error("Error:", body?.error?.message || "Unknown error");
      if (body?.error?.details) {
        console.error("Details:", JSON.stringify(body.error.details, null, 2));
      }
      process.exit(1);
    }

    console.log("\n✅ Gemini API request succeeded!");
    console.log("Model:", body.modelVersion);
    console.log("Response:", body.candidates?.[0]?.content?.parts?.[0]?.text || "No text response");
    
    // Check if it wants to call a function
    const functionCall = body.candidates?.[0]?.content?.parts?.find(p => p.functionCall);
    if (functionCall) {
      console.log("\n🔧 Function call requested:");
      console.log(JSON.stringify(functionCall, null, 2));
    }
    
  } catch (err) {
    console.error("\n❌ Request failed with exception:");
    console.error(err.message);
    process.exit(1);
  }
}

testGeminiWithTools();

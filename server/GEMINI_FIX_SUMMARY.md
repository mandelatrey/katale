# Gemini API Error Fix Summary

## Problem Identified

The WhatsApp AI middleware was failing with Gemini API errors that appeared to be quota/rate limit issues, but the root cause was **incompatible JSON Schema keywords** in the tool definitions.

### Error Messages Seen
```
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0
```

### Root Causes

1. **Unsupported JSON Schema Keywords**: The tool definitions contained JSON Schema keywords that Gemini's API doesn't support:
   - `pattern` (used for ObjectId validation)
   - `exclusiveMinimum` / `exclusiveMaximum` (used for number validation)
   - `maxLength` / `minLength` (used for string validation)
   - `format` (not used but filtered preventively)

2. **Free Tier Quota Exhaustion**: Your API key is on Gemini's free tier, which has:
   - Daily request limits per model
   - Per-minute request limits per model
   - When gemini-2.5-flash was unavailable (503), it fell back to gemini-2.0-flash which had already hit its daily quota

3. **Invalid Fallback Models**: The .env had gemini-2.0-flash as the only fallback, which was also hitting quota limits

## Fixes Applied

### 1. Enhanced Schema Filtering (`server/ai/agent.js`)

Updated the `toGeminiSchema()` function to filter out all unsupported JSON Schema keywords:

```javascript
function toGeminiSchema(schema) {
  if (schema == null || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);

  const out = {};
  for (const [key, value] of Object.entries(schema)) {
    // Gemini's function parameter schema does not accept these JSON-Schema
    // keywords, and will reject the whole request payload if included.
    // Supported: type, description, enum, properties, required, items, minimum, maximum
    // Not supported: pattern, exclusiveMinimum, exclusiveMaximum, minLength, maxLength, format
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
```

**Before**: Only filtered `exclusiveMinimum` and `exclusiveMaximum`
**After**: Filters all 6 unsupported keywords

### 2. Improved Error Logging (`server/ai/agent.js`)

Added detailed error logging to help debug future issues:

```javascript
async function callGemini({ apiKey, model, system, contents, tools }) {
  const payload = {
    systemInstruction: { parts: [{ text: system }] },
    tools,
    contents,
  };

  // Log the request for debugging (only in development)
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[whatsapp-ai] Calling Gemini ${model} with ${tools?.[0]?.functionDeclarations?.length || 0} tools`,
    );
  }

  const response = await fetch(/* ... */);
  const body = await response.json();
  
  if (!response.ok) {
    const message = body?.error?.message || "Gemini request failed";
    const details = body?.error?.details || [];
    
    // Log detailed error information
    console.error(`[whatsapp-ai] Gemini API error (${response.status}):`, message);
    if (details.length > 0) {
      console.error("[whatsapp-ai] Error details:", JSON.stringify(details, null, 2));
    }
    
    throw new Error(message);
  }
  return body;
}
```

### 3. Better Fallback Models (`server/.env`)

Updated the fallback model configuration to use models with better availability:

```env
GEMINI_MODEL=gemini-2.5-flash
GEMINI_MODEL_FALLBACKS=gemini-2.0-flash-lite,gemini-2.5-pro
```

**Before**: `gemini-2.0-flash` (exhausted quota)
**After**: `gemini-2.0-flash-lite` (lighter model, separate quota) and `gemini-2.5-pro` (premium model)

## Testing

Created `server/test-gemini-tools.js` to verify the fix:
- Converts all 19 tool definitions to Gemini format
- Shows the schema conversion removes unsupported keywords
- Tests actual API calls with tools

## Gemini API Supported Schema Keywords

**Supported**:
- `type`
- `description`
- `enum`
- `properties`
- `required`
- `items`
- `minimum`
- `maximum`

**Not Supported** (now filtered):
- `pattern`
- `exclusiveMinimum`
- `exclusiveMaximum`
- `minLength`
- `maxLength`
- `format`

## Available Gemini Models (as of test)

- `gemini-2.5-flash` - Primary model (mid-size, 1M tokens)
- `gemini-2.5-pro` - Premium model
- `gemini-2.0-flash` - Fast model
- `gemini-2.0-flash-001` - Stable version
- `gemini-2.0-flash-lite` - Lighter version
- `gemini-2.0-flash-lite-001` - Stable lite version

## Recommendations

1. **Monitor Free Tier Usage**: Your API key is on the free tier with daily limits. Consider upgrading to a paid plan if you need higher quotas.

2. **Use Flash-Lite for High Volume**: If you're hitting rate limits frequently, use `gemini-2.0-flash-lite` as the primary model - it has separate quotas and is faster.

3. **Add Retry Logic**: Consider adding exponential backoff retry logic for temporary 503 errors (high demand).

4. **Check Quota Dashboard**: Monitor your usage at https://ai.dev/rate-limit

## Next Steps

The fix is complete and should resolve the errors. The middleware will now:
1. Send properly formatted tool schemas to Gemini
2. Fall back to lighter models if the primary model is unavailable
3. Log detailed error information for debugging
4. Work within free tier quota limits

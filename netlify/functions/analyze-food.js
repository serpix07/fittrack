exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured on the server' }),
    }
  }

  let imageData, mediaType
  try {
    ;({ imageData, mediaType } = JSON.parse(event.body))
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    }
  }

  if (!imageData || !mediaType) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request must include imageData and mediaType' }),
    }
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageData },
          },
          {
            type: 'text',
            text: 'Analyze this food photo. Identify all foods visible, estimate portion sizes, and return ONLY a JSON object with: {"foodName": "string", "totalCalories": number, "protein": number, "carbs": number, "fat": number, "confidence": "high|medium|low", "breakdown": [{"item": "string", "grams": number, "calories": number, "protein": number, "carbs": number, "fat": number}]}',
          },
        ],
      }],
    }),
  })

  const anthropicBody = await anthropicRes.json().catch(() => ({}))

  if (!anthropicRes.ok) {
    return {
      statusCode: anthropicRes.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: anthropicBody.error?.message ?? `Anthropic API error ${anthropicRes.status}`,
      }),
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(anthropicBody),
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured on the server' }),
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

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: { mimeType: mediaType, data: imageData },
            },
            {
              text: 'Analyze this food photo. Identify all foods visible, estimate portion sizes, and return ONLY a JSON object with: {"foodName": "string", "totalCalories": number, "protein": number, "carbs": number, "fat": number, "confidence": "high|medium|low", "breakdown": [{"item": "string", "grams": number, "calories": number, "protein": number, "carbs": number, "fat": number}]}',
            },
          ],
        }],
      }),
    }
  )

  const geminiBody = await geminiRes.json().catch(() => ({}))

  if (!geminiRes.ok) {
    return {
      statusCode: geminiRes.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: geminiBody.error?.message ?? `Gemini API error ${geminiRes.status}`,
      }),
    }
  }

  const text = geminiBody.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Return in the same shape the frontend already expects
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: [{ text }] }),
  }
}

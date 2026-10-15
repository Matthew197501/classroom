// Vercel serverless endpoint. Keep OPENROUTER_API_KEY in Vercel environment variables;
// never put the key in frontend code or a VITE_* variable.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'OpenRouter is not configured' })

  const { topic, persona, recentMessages, mode, userMessage, studentName } = req.body ?? {}
  const safeTopic = String(topic || 'the current lesson').slice(0, 180)
  const safeName = String(persona?.name || 'Classmate').slice(0, 60)
  const safeTone = String(persona?.tone || 'friendly').slice(0, 40)
  const safeUserMessage = String(userMessage || '').slice(0, 500)
  const safeStudentName = String(studentName || 'Student').slice(0, 60)
  const isReply = mode === 'reply' && Boolean(safeUserMessage.trim())
  const recent = Array.isArray(recentMessages)
    ? recentMessages.slice(-8).map((m: any) => ({ name: String(m?.name || 'Classmate').slice(0, 60), text: String(m?.text || '').slice(0, 300) }))
    : []

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'ClassRoom Sim',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: isReply
              ? `You are writing a reply from a fictional AI classmate in a classroom app. Speaker: ${safeName}; personality: ${safeTone}. The student ${safeStudentName} sent a message. Reply directly to their message, answer questions helpfully, and stay relevant to the lesson topic. Be conversational and concise (1-3 sentences, under 75 words). If you are unsure, say so rather than inventing facts. Do not claim to be a real human or a real student. Return only the reply text.`
              : `You generate one short, natural message for a clearly simulated classroom discussion. The speaker is a fictional AI classmate named ${safeName}, personality: ${safeTone}. Keep it relevant to the lesson topic, avoid claiming to be a real human or claiming real attendance, and do not repeat recent messages. Return only the message, in 1-2 sentences, under 45 words.`,
          },
          { role: 'user', content: JSON.stringify({ lessonTopic: safeTopic, studentMessage: isReply ? safeUserMessage : undefined, recentDiscussion: recent }) },
        ],
        temperature: 0.85,
        max_tokens: 100,
      }),
    })
    if (!upstream.ok) {
      const details = await upstream.text()
      console.error('OpenRouter request failed:', upstream.status, details.slice(0, 500))
      return res.status(502).json({ error: 'OpenRouter request failed' })
    }
    const data = await upstream.json()
    const message = data?.choices?.[0]?.message?.content
    if (typeof message !== 'string' || !message.trim()) return res.status(502).json({ error: 'No message returned by model' })
    return res.status(200).json({ message: message.trim() })
  } catch (error) {
    console.error('Chat generation error:', error)
    return res.status(500).json({ error: 'Could not generate a chat message' })
  }
}

const prompt = process.argv.slice(2).join(' ') || 'Cut the introduction from 00:00 to 01:30'
const ollamaBase = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const model = process.env.OLLAMA_MODEL || 'vidversity-edit'
const workspaceBase = process.env.WORKSPACE_AI_BASE || 'http://127.0.0.1:8787'

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => null)
  return { ok: response.ok, status: response.status, body }
}

const localResult = await postJson(`${ollamaBase}/api/chat`, {
  model,
  stream: false,
  format: 'json',
  options: { temperature: 0, top_p: 0.9 },
  messages: [{ role: 'user', content: prompt }],
})

const workspaceResult = await postJson(`${workspaceBase}/api/ai/edit-command`, {
  prompt,
  videoDuration: '00:10:00',
  transcript: [],
})

console.log('=== Local Ollama ===')
console.log(JSON.stringify(localResult.body, null, 2))
console.log('\n=== Workspace API ===')
console.log(JSON.stringify(workspaceResult.body, null, 2))

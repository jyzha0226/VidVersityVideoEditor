import assert from 'node:assert/strict'

const examples = [
  'Cut the introduction from 00:00 to 01:30',
  'Remove silent parts longer than 3 seconds',
  'Split this video into chapters by topic',
  'Extract the video from 2:30 to 3:30 and mute from 2:45 until the end',
]

for (const prompt of examples) {
  assert.equal(typeof prompt, 'string')
  assert.ok(prompt.length > 8)
}

console.log('AI integration example prompts validated:')
examples.forEach((prompt) => console.log(`- ${prompt}`))

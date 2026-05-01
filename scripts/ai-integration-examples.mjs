import assert from 'node:assert/strict'

const examples = [
  {
    prompt: 'Cut the introduction from 00:00 to 01:30',
    expectedIntent: 'cut',
    expectedActions: ['remove'],
  },
  {
    prompt: 'Remove silent parts longer than 3 seconds',
    expectedIntent: 'trim_silence',
    expectedActions: ['trim_silence'],
  },
  {
    prompt: 'Split this video into chapters by topic',
    expectedIntent: 'chapter_suggest',
    expectedActions: ['suggest_chapter'],
  },
  {
    prompt: 'Extract the video from 2:30 to 3:30 and mute from 2:45 until the end',
    expectedIntent: 'subtitle',
    expectedActions: ['keep', 'mute'],
  },
]

for (const example of examples) {
  assert.equal(typeof example.prompt, 'string')
  assert.ok(example.prompt.length > 8)
  assert.equal(typeof example.expectedIntent, 'string')
  assert.ok(example.expectedActions.length > 0)
}

console.log('AI integration scenario checklist:')
examples.forEach((example) => {
  console.log(`- Prompt: ${example.prompt}`)
  console.log(`  Expected intent: ${example.expectedIntent}`)
  console.log(`  Expected actions include: ${example.expectedActions.join(', ')}`)
})

import { describe, test, expect } from 'bun:test'
import { appendHistory, extractUserTexts, extractNodeText, buildUserMessageIndex, createHistoryStore, MAX_HISTORY } from '../src/client/history.js'

describe('appendHistory', () => {
  test('忽略空白字符串', () => {
    const h = []
    appendHistory(h, '   ')
    appendHistory(h, '')
    expect(h).toEqual([])
  })

  test('trim 后追加', () => {
    const h = []
    appendHistory(h, '  hello  ')
    expect(h).toEqual(['hello'])
  })

  test('连续重复去重，非连续重复保留', () => {
    const h = []
    appendHistory(h, 'a')
    appendHistory(h, 'a')
    appendHistory(h, 'b')
    appendHistory(h, 'a')
    expect(h).toEqual(['a', 'b', 'a'])
  })

  test('超过上限裁掉最旧', () => {
    const h = []
    for (let i = 0; i < MAX_HISTORY + 10; i++) appendHistory(h, `m${i}`)
    expect(h.length).toBe(MAX_HISTORY)
    expect(h[0]).toBe('m10')
    expect(h[h.length - 1]).toBe(`m${MAX_HISTORY + 9}`)
  })

  test('原地修改并返回同一数组', () => {
    const h = []
    const r = appendHistory(h, 'x')
    expect(r).toBe(h)
  })

  test('null/undefined 文本不追加', () => {
    const h = []
    appendHistory(h, null)
    appendHistory(h, undefined)
    expect(h).toEqual([])
  })
})

describe('extractUserTexts', () => {
  test('空输入返回空数组', () => {
    expect(extractUserTexts(null)).toEqual([])
    expect(extractUserTexts(undefined)).toEqual([])
    expect(extractUserTexts([])).toEqual([])
  })

  test('只取 user 节点', () => {
    const nodes = [
      { kind: 'assistant', content: [{ type: 'text', text: 'hi' }] },
      { kind: 'user', content: [{ type: 'text', text: 'hello' }] },
    ]
    expect(extractUserTexts(nodes)).toEqual(['hello'])
  })

  test('拼接多个 text 片段，跳过非 text', () => {
    const nodes = [
      {
        kind: 'user',
        content: [
          { type: 'text', text: 'a' },
          { type: 'text', text: 'b' },
          { type: 'image', url: 'x' },
        ],
      },
    ]
    expect(extractUserTexts(nodes)).toEqual(['ab'])
  })

  test('跳过空文本节点', () => {
    const nodes = [
      { kind: 'user', content: [] },
      { kind: 'user', content: [{ type: 'text', text: '' }] },
      { kind: 'user', content: [{ type: 'text', text: 'real' }] },
    ]
    expect(extractUserTexts(nodes)).toEqual(['real'])
  })
})

describe('createHistoryStore', () => {
  test('初始状态', () => {
    const s = createHistoryStore()
    expect(s.history).toEqual([])
    expect(s.navIndex).toBe(-1)
    expect(s.savedDraft).toBeNull()
    expect(s.pending).toBeNull()
    expect(s.seeded).toBeInstanceOf(Set)
    expect(s.seeded.size).toBe(0)
  })
})

describe('extractNodeText', () => {
  test('从 user 节点 data.content 提取文本', () => {
    const data = { kind: 'user', content: [{ type: 'text', text: 'hi' }, { type: 'text', text: ' there' }] }
    expect(extractNodeText(data)).toBe('hi there')
  })

  test('跳过非 text 片段', () => {
    const data = { kind: 'user', content: [{ type: 'image', url: 'x' }, { type: 'text', text: 'ok' }] }
    expect(extractNodeText(data)).toBe('ok')
  })

  test('无 content / 空内容返回空串', () => {
    expect(extractNodeText(null)).toBe('')
    expect(extractNodeText(undefined)).toBe('')
    expect(extractNodeText({ kind: 'user' })).toBe('')
    expect(extractNodeText({ kind: 'user', content: [] })).toBe('')
  })
})

describe('buildUserMessageIndex', () => {
  const mkNode = (kind, text) => ({ key: `${kind}-1`, kind, data: { content: [{ type: 'text', text }] } })
  const mkStore = (nodes) => ({ get: (key) => nodes[key] })

  test('只含 user 节点，按 order 顺序', () => {
    const store = mkStore({
      u1: mkNode('user', '第一条'),
      a1: mkNode('assistant-step', '回复'),
      u2: mkNode('user', '第二条'),
    })
    const chat = { order: ['u1', 'a1', 'u2'], nodes: store }
    expect(buildUserMessageIndex(chat)).toEqual([
      { key: 'u1', text: '第一条' },
      { key: 'u2', text: '第二条' },
    ])
  })

  test('跳过空文本与未知节点', () => {
    const store = mkStore({
      u1: mkNode('user', ''),
      u2: { key: 'u2', kind: 'user', data: {} },
      u3: mkNode('user', '真实'),
    })
    const chat = { order: ['u1', 'u2', 'u3'], nodes: store }
    expect(buildUserMessageIndex(chat)).toEqual([{ key: 'u3', text: '真实' }])
  })

  test('缺 chat/order/nodes 安全返回空数组', () => {
    expect(buildUserMessageIndex(null)).toEqual([])
    expect(buildUserMessageIndex(undefined)).toEqual([])
    expect(buildUserMessageIndex({})).toEqual([])
    expect(buildUserMessageIndex({ order: ['k'], nodes: null })).toEqual([])
  })
})

import { describe, test, expect } from 'bun:test'
import { appendHistory, extractUserTexts, createHistoryStore, MAX_HISTORY } from '../src/client/history.js'

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

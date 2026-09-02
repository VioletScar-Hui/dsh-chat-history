/**
 * 纯历史存储逻辑（无 React / ctx 依赖，便于单测）。
 *
 * 从 client/index.js 抽出的可测试核心：
 *   - appendHistory：追加一条历史（trim、连续去重、上限 200）
 *   - extractUserTexts：从会话 nodes 提取用户消息文本
 *   - createHistoryStore：构造每会话历史存储实例
 */

export const MAX_HISTORY = 200

/**
 * 追加一条历史（原地修改 history 数组并返回它）。
 *   - trim 后为空串则忽略
 *   - 与末尾相同则去重（连续重复不重复记）
 *   - 超过 MAX_HISTORY 时裁掉最旧的一条
 */
export function appendHistory(history, text) {
  const t = String(text ?? '').trim()
  if (t === '') return history
  if (history.length && history[history.length - 1] === t) return history
  history.push(t)
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY)
  return history
}

/**
 * 从会话 nodes 提取所有用户消息文本。
 * 只取 kind === 'user' 的节点，拼接其 content 里 type === 'text' 的片段；
 * 空文本跳过。
 */
export function extractUserTexts(nodes) {
  const texts = []
  if (!Array.isArray(nodes)) return texts
  for (const node of nodes) {
    if (!node || node.kind !== 'user' || !Array.isArray(node.content)) continue
    let text = ''
    for (const block of node.content) {
      if (block && block.type === 'text' && typeof block.text === 'string') text += block.text
    }
    if (text !== '') texts.push(text)
  }
  return texts
}

/**
 * 构造一个每会话历史存储实例。
 */
export function createHistoryStore() {
  return { history: [], navIndex: -1, savedDraft: null, pending: null, seeded: new Set() }
}

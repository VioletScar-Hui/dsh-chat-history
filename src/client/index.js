/**
 * @violet/dsh-chat-history Client half（浏览器）。
 *
 * 给聊天输入框加 CLI 风格历史记忆：在文本域上按 ↑ 召回上一条、按 ↓
 * 前进/还原草稿。实现方式：
 *   - 注册 conversation.input.left（list 槽，工具行内，additive），
 *     组件返回 null 只挂副作用，绝不做 DOM hack。
 *   - 键盘：document 捕获阶段 keydown，只认 textarea[data-phase]
 *     （composer 文本域唯一稳定属性），跳过输入法合成、已 preventDefault、
 *     斜杠命令菜单（phase !== 'plain'）。
 *   - 历史来源：挂载时扫描当前会话 session.nodes 里 kind==='user' 节点，
 *     取 content 中 type==='text' 的文本（启动即预填）；发消息时靠
 *     InputState.phase 'submitting'→'plain' 迁移记入新历史。
 *   - 纯内存存储（每会话 seed），连续重复去重、上限 200 条。
 */
import * as React from 'react'

export const name = 'dsh-chat-history'
export const inject = ['slots']

export function apply(ctx) {
  const store = { history: [], navIndex: -1, savedDraft: null, pending: null, seeded: new Set() }

  function pushHistory(text) {
    const t = text.trim()
    if (t === '') return
    const h = store.history
    if (h.length && h[h.length - 1] === t) return
    h.push(t)
    if (h.length > 200) h.splice(0, h.length - 200)
  }

  function seedSession(session) {
    if (!session || !Array.isArray(session.nodes)) return
    for (const node of session.nodes) {
      if (!node || node.kind !== 'user' || !Array.isArray(node.content)) continue
      let text = ''
      for (const b of node.content) {
        if (b && b.type === 'text' && typeof b.text === 'string') text += b.text
      }
      pushHistory(text)
    }
  }

  function placeCaret(ta, text) {
    const len = text.length
    const applyCaret = () => {
      try { ta.setSelectionRange(len, len) } catch (_) {}
      try { ta.focus() } catch (_) {}
    }
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(applyCaret))
    } else {
      applyCaret()
    }
  }

  function ChatHistory(props) {
    const input = props.useInput((s) => s)
    const actions = props.inputActions

    const draftRef = React.useRef('')
    draftRef.current = input ? input.draft : ''
    const phaseRef = React.useRef('plain')
    phaseRef.current = input ? input.phase : 'plain'
    const actionsRef = React.useRef(null)
    actionsRef.current = actions
    const prevPhaseRef = React.useRef(input ? input.phase : 'plain')

    // 启动预填：每个会话只 seed 一次。
    React.useEffect(() => {
      const sid = props.sessionId
      if (sid == null || store.seeded.has(sid)) return
      store.seeded.add(sid)
      seedSession(props.session)
    }, [props.sessionId])

    // 发消息检测：phase submitting→plain 迁移时，把当时草稿记入历史。
    React.useEffect(() => {
      const phase = input ? input.phase : 'plain'
      const prev = prevPhaseRef.current
      prevPhaseRef.current = phase
      if (prev !== 'submitting' && phase === 'submitting') {
        if (input && input.draft && input.draft.trim() !== '') store.pending = input.draft
      } else if (prev === 'submitting' && phase === 'plain') {
        if (store.pending) {
          pushHistory(store.pending)
          store.pending = null
          store.navIndex = -1
          store.savedDraft = null
        }
      }
    }, [input ? input.phase : 'plain', input ? input.draft : ''])

    // 用户手动改草稿即退出浏览态。
    React.useEffect(() => {
      if (store.navIndex >= 0) {
        if (input && input.draft !== store.history[store.navIndex]) {
          store.navIndex = -1
          store.savedDraft = null
        }
      }
    }, [input ? input.draft : ''])

    // 键盘捕获。
    React.useEffect(() => {
      function onKeyDown(e) {
        if (e.defaultPrevented || e.isComposing) return
        const t = e.target
        if (!t || t.tagName !== 'TEXTAREA' || !t.hasAttribute('data-phase')) return
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
        if (phaseRef.current !== 'plain') return
        const actionsNow = actionsRef.current
        if (!actionsNow) return
        const h = store.history
        const draft = draftRef.current
        let intercepted = false
        let setText = null

        if (e.key === 'ArrowUp') {
          if (store.navIndex >= 0) {
            intercepted = true
            if (store.navIndex > 0) {
              store.navIndex -= 1
              setText = h[store.navIndex]
            }
          } else if (h.length > 0 && t.selectionStart === 0) {
            store.savedDraft = draft
            store.navIndex = h.length - 1
            setText = h[store.navIndex]
            intercepted = true
          }
        } else {
          if (store.navIndex >= 0) {
            intercepted = true
            if (store.navIndex < h.length - 1) {
              store.navIndex += 1
              setText = h[store.navIndex]
            } else {
              store.navIndex = -1
              setText = store.savedDraft != null ? store.savedDraft : ''
              store.savedDraft = null
            }
          }
        }

        if (!intercepted) return
        e.preventDefault()
        e.stopPropagation()
        if (setText !== null) {
          actionsNow.setDraft(setText)
          placeCaret(t, setText)
        }
      }
      document.addEventListener('keydown', onKeyDown, true)
      return () => document.removeEventListener('keydown', onKeyDown, true)
    }, [])

    return null
  }

  ctx.slots.inject('conversation.input.left', () => {
    try {
      return ctx.slots.register(
        { name: 'conversation.input.left', id: 'chat-history', order: 0 },
        ChatHistory
      )
    } catch (error) {
      console.error('[dsh-chat-history] conversation.input.left register failed:', error)
      return () => {}
    }
  })
}

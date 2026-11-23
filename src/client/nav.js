/**
 * @violet/dsh-chat-history 会话消息定位面板（停靠左栏）。
 *
 * 在会话头部（conversation.session.header.actions）挂一个「定位」按钮；点开后在
 * 会话滚动区左缘停靠一条纵向列表（紧挨应用左侧边栏），按会话顺序列出当前 session
 * 里发送过的用户消息，一条一条可浏览、可点击——点任意一条即滚动定位到会话中
 * 对应消息的位置并短暂高亮。
 *
 * 实现要点：
 *   - 数据源用 DSH 0.2.1 Chat target 的 useChat 选择器读 order +
 *     nodes.get(key)，只取 kind === 'user' 节点（data.content 提取文本）。
 *   - 滚动定位走 DOM：会话滚动容器带 [data-conversation-scroll] 属性，每条消息行
 *     带 data-chat-anchor-key="<node.key>"；框架无内置 scroll-to API。
 *   - 面板为 position:fixed 停靠栏：left = 应用侧边栏右缘 + 间距，top/bottom 对齐
 *     会话滚动区。绝不动会话 DOM 结构；纯增强、可安全卸载。
 */
import * as React from 'react'
import { buildUserMessageIndex } from './history.js'

const h = React.createElement

// 一次性注入面板样式（带主题 token 回退值）。
let styleInjected = false
function ensureStyle() {
  if (styleInjected) return
  styleInjected = true
  if (typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = `
.dshch-nav-item{display:flex;align-items:flex-start;gap:8px;text-align:left;background:transparent;border:none;border-radius:8px;padding:6px 8px;cursor:pointer;color:var(--dsw-alias-label-primary,#111827);font-family:inherit;font-size:13px;line-height:18px;width:100%}
.dshch-nav-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))}
.dshch-nav-item:active{background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.09))}
.dshch-nav-item .dshch-nav-num{flex:none;min-width:18px;text-align:right;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-caption,#9ca3af);font-size:12px;padding-top:1px}
.dshch-nav-item .dshch-nav-text{flex:1;min-width:0;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;word-break:break-word}
.dshch-nav-panel::-webkit-scrollbar{width:8px}
.dshch-nav-panel::-webkit-scrollbar-thumb{background:var(--dsw-alias-scrollbar-bg-l2,rgba(0,0,0,.12));border-radius:4px}
`
  document.head.appendChild(style)
}
ensureStyle()

function findScroller(fromEl) {
  let el = fromEl
  while (el) {
    const s = el.querySelector('[data-conversation-scroll]')
    if (s) return s
    el = el.parentElement
  }
  return document.querySelector('[data-conversation-scroll]')
}

function findAnchor(scroller, key) {
  if (!scroller) return null
  for (const row of scroller.querySelectorAll('[data-chat-anchor-key]')) {
    if (row.dataset.chatAnchorKey === key) return row
  }
  return null
}

/** 测量停靠栏定位：左缘 = 应用侧边栏右缘 + 间距；上下对齐会话滚动区。 */
function measureDock(fromEl) {
  const sidebar = document.querySelector('nav.dsh-workbench-nav')
  const scroll = findScroller(fromEl)
  let left = 280
  let top = 48
  let bottom = 48
  if (sidebar) {
    const r = sidebar.getBoundingClientRect()
    if (r.left >= 0 && r.width) left = Math.max(0, Math.round(r.right))
  }
  if (scroll) {
    const r = scroll.getBoundingClientRect()
    top = Math.max(0, Math.round(r.top))
    bottom = Math.max(0, Math.round((window.innerHeight || 0) - r.bottom))
  }
  return { left, top, bottom }
}

/**
 * 会话消息定位停靠栏组件。注册进 conversation.session.header.actions（list 槽）。
 * props 由 framework 会话 kit 注入：sessionId / useChat / useInput / inputActions。
 */
export function SessionNav(props) {
  // DSH 0.2.1 将 Chat 从 SessionSnapshot 中拆成独立的 ChatSnapshot；
  // useChat 是 dsh-client-ui-chat 注入的正式会话标准属性。
  const useChat = props.useChat
  const [open, setOpen] = React.useState(false)
  const [dock, setDock] = React.useState({ left: 280, top: 48, bottom: 48 })
  const rootRef = React.useRef(null)

  // 官方 EMPTY_CHAT_SNAPSHOT 会提供 order/nodes；helper 也兼容首次绑定期间的 undefined。
  const chat = useChat((s) => s)
  const items = React.useMemo(() => buildUserMessageIndex(chat), [chat])

  // 打开时测量停靠栏位置。
  React.useEffect(() => {
    if (!open) return
    setDock(measureDock(rootRef.current))
  }, [open])

  // 点击面板/按钮之外关闭 + Esc 关闭。
  React.useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  function jumpTo(key) {
    const scroller = findScroller(rootRef.current)
    const row = findAnchor(scroller, key)
    if (!row) return
    try {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } catch (_) {
      try { row.scrollIntoView() } catch (_) {}
    }
    const prev = row.style.boxShadow
    row.style.boxShadow = '0 0 0 2px var(--dsw-alias-state-business-primary,#4d6bfe)'
    setTimeout(() => { row.style.boxShadow = prev }, 1600)
  }

  const icon = h('svg', {
    width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true,
  }, h('path', {
    d: 'M3 3.5h10M3 8h10M3 12.5h6',
    stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round',
  }))

  const rail = open
    ? h('div', {
        className: 'dshch-nav-panel',
        style: {
          position: 'fixed', left: dock.left, top: dock.top,
          bottom: Math.max(0, dock.bottom), width: 240, zIndex: 1150,
          display: 'flex', flexDirection: 'column',
          background: 'var(--dsw-alias-bg-base,#fff)',
          border: '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
          borderRadius: 12, boxShadow: 'var(--dsw-shadow-lv2,0 8px 24px rgba(0,0,0,.14))',
          overflow: 'hidden',
        },
      },
      h('div', {
        style: {
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', flex: 'none',
          borderBottom: '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
        },
      },
        h('span', { style: { fontSize: 13, fontWeight: 600, color: 'var(--dsw-alias-label-primary,#111827)' } },
          `消息定位（${items.length}）`),
        h('button', {
          type: 'button', title: '关闭',
          onClick: () => setOpen(false),
          style: {
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 18, lineHeight: 1, padding: '0 4px', color: 'var(--dsw-alias-label-secondary,#4b5563)',
          },
        }, '\u00d7'),
      ),
      h('div', {
        style: {
          overflowY: 'auto', padding: 6, flex: '1 1 auto',
          display: 'flex', flexDirection: 'column', gap: 2,
        },
      },
        items.length === 0
          ? h('div', {
              style: {
                padding: '20px 12px', textAlign: 'center', fontSize: 13,
                color: 'var(--dsw-alias-label-tertiary,#9ca3af)',
              },
            }, '本会话还没有发送过的消息')
          : items.map((it, i) => h('button', {
              key: it.key, type: 'button', className: 'dshch-nav-item',
              title: it.text, onClick: () => jumpTo(it.key),
            },
            h('span', { className: 'dshch-nav-num' }, String(i + 1)),
            h('span', { className: 'dshch-nav-text' }, it.text),
          )),
      ),
    )
    : null

  return h('div', { ref: rootRef, style: { display: 'contents' } },
    h('button', {
      type: 'button',
      onClick: () => setOpen((v) => !v),
      title: '定位本会话发送过的消息',
      'aria-expanded': open,
      style: {
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: open
          ? 'var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.09))'
          : 'var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))',
        border: 'none', borderRadius: 12, padding: '4px 10px',
        fontSize: 13, lineHeight: '20px', fontWeight: 500,
        color: 'var(--dsw-alias-label-secondary,#4b5563)', cursor: 'pointer',
        fontFamily: 'inherit',
      },
    },
      icon,
      '定位',
    ),
    rail,
  )
}

export default SessionNav

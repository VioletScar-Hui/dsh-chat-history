/**
 * @violet/dsh-chat-history 会话消息定位面板。
 *
 * 在会话头部（conversation.session.header.actions）挂一个「定位」按钮，
 * 点开后在左侧浮出一个面板，按会话顺序列出当前 session 里所有发送过的
 * 用户消息；点击任意一条即滚动定位到会话中对应消息的位置（并短暂高亮）。
 *
 * 实现要点：
 *   - 数据源用 framework 会话 kit 的 useSession 选择器读 chat.order +
 *     chat.nodes.get(key)，只取 kind === 'user' 节点（data.content 提取文本）。
 *   - 滚动定位走 DOM：会话滚动容器带 [data-conversation-scroll] 属性，
 *     每条消息行带 data-chat-anchor-key="<node.key>"；无内置 scroll-to API。
 *   - 面板用 position:fixed 悬浮，绝不动会话 DOM 结构；纯增强、可安全卸载。
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
.dshch-nav-item{display:flex;align-items:center;gap:8px;text-align:left;background:transparent;border:none;border-radius:8px;padding:6px 8px;cursor:pointer;color:var(--dsw-alias-label-primary,#111827);font-family:inherit;font-size:13px;line-height:18px;width:100%}
.dshch-nav-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))}
.dshch-nav-item:active{background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.09))}
.dshch-nav-item .dshch-nav-num{flex:none;min-width:18px;text-align:right;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-caption,#9ca3af);font-size:12px}
.dshch-nav-item .dshch-nav-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
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

/**
 * 会话消息定位组件。注册进 conversation.session.header.actions（list 槽）。
 * props 由 framework 会话 kit 注入：sessionId / useSession / useInput / inputActions。
 */
export function SessionNav(props) {
  const useSession = props.useSession
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef(null)

  const order = useSession((s) => s.chat.order)
  const nodes = useSession((s) => s.chat.nodes)
  const items = React.useMemo(() => buildUserMessageIndex({ order, nodes }), [order, nodes])

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

  const panel = open
    ? h('div', {
        className: 'dshch-nav-panel',
        style: {
          position: 'fixed', top: 64, left: 16, zIndex: 1200,
          width: 300, maxHeight: 'min(70vh, 600px)',
          display: 'flex', flexDirection: 'column',
          background: 'var(--dsw-alias-bg-base,#fff)',
          border: '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
          borderRadius: 12,
          boxShadow: 'var(--dsw-shadow-lv2,0 8px 24px rgba(0,0,0,.14))',
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
        background: 'var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))',
        border: 'none', borderRadius: 12, padding: '4px 10px',
        fontSize: 13, lineHeight: '20px', fontWeight: 500,
        color: 'var(--dsw-alias-label-secondary,#4b5563)', cursor: 'pointer',
        fontFamily: 'inherit',
      },
    },
      icon,
      '定位',
    ),
    panel,
  )
}

export default SessionNav

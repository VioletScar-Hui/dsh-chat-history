/**
 * @violet/dsh-chat-history Host half（空壳）。
 *
 * 本插件是纯客户端插件：宿主侧没有任何服务要注册。这个空壳只让
 * cordis 行（cordis.patch.yml 里的 {id, name}）可以解析——
 * 真正的功能在浏览器半边（exports "./client"，由 package.json 的
 * `dsh.client` 声明驱动，经 client-modules 宿主服务注入 boot graph）。
 */
export const name = 'dsh-chat-history'

export function apply(_ctx) {
  // 无宿主副作用。
}

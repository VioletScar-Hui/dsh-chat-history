/**
 * 校验插件清单与构建产物，供 CI 与本地自查使用。
 * 退出码非 0 表示校验失败。
 *
 * 校验点：
 *   - package.json 声明 dsh.bundle.patch 且指向存在的 cordis.patch.yml
 *   - cordis.patch.yml 含 insert 并引用包名
 *   - lib/index.js、lib/client.js 存在，且 client.js 含 __ModuleLoader__.load 包裹
 *   - package.json exports["./client"] 存在
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
let failures = 0

function check(ok, msg) {
  if (ok) console.log('✓ ' + msg)
  else {
    console.error('✗ ' + msg)
    failures++
  }
}

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))

// manifest
check(Boolean(pkg.dsh?.bundle?.patch), 'package.json 声明 dsh.bundle.patch')
check(typeof pkg.dsh?.bundle?.patch === 'string', 'dsh.bundle.patch 是字符串路径')

const patchPath = pkg.dsh?.bundle?.patch
check(Boolean(patchPath) && existsSync(join(ROOT, patchPath)), `cordis patch 文件存在：${patchPath}`)

if (patchPath && existsSync(join(ROOT, patchPath))) {
  const patch = readFileSync(join(ROOT, patchPath), 'utf8')
  check(patch.includes('- insert'), 'cordis.patch.yml 含 insert')
  check(patch.includes(pkg.name), `cordis.patch.yml 引用包名 ${pkg.name}`)
}

// build artifacts
check(existsSync(join(ROOT, 'lib', 'index.js')), 'lib/index.js 存在')
check(existsSync(join(ROOT, 'lib', 'client.js')), 'lib/client.js 存在')

const client = existsSync(join(ROOT, 'lib', 'client.js'))
  ? readFileSync(join(ROOT, 'lib', 'client.js'), 'utf8')
  : ''
check(client.includes('__ModuleLoader__.load'), 'lib/client.js 含 __ModuleLoader__.load 包裹')
check(client.includes(JSON.stringify(pkg.name)), `lib/client.js 含包名 id ${pkg.name}`)

// exports
check(Boolean(pkg.exports?.['./client']), 'package.json exports["./client"] 存在')

if (failures > 0) {
  console.error(`\n${failures} 项校验失败`)
  process.exit(1)
}
console.log('\n校验通过')

// Local-only browser QA harness. Never included by Vite or GitHub Pages.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import ts from 'typescript'
const root = resolve('dist'),
  port = Number(process.env.QA_PORT || 4185)
const source = await readFile('src/data/portals.ts', 'utf8')
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText
const seed = new Function(
  js.replace('export const initialPortals', 'const initialPortals') +
    ';return initialPortals',
)()
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.wav': 'audio/wav',
  '.svg': 'image/svg+xml',
}
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    const fixture =
      url.pathname === '/cascade.html'
        ? 'cascade'
        : url.pathname === '/finish.html'
          ? 'finish'
          : null
    const path = resolve(
      root,
      '.' +
        (url.pathname === '/' || fixture
          ? '/index.html'
          : decodeURIComponent(url.pathname)),
    )
    if (!path.startsWith(root + '/') && !path.startsWith(root + '\\')) {
      res.writeHead(403).end()
      return
    }
    let body = await readFile(path)
    if (fixture) {
      const portals = seed.map((p) => ({ ...p }))
      if (fixture === 'cascade')
        for (const p of portals) {
          p.status = 'open'
          p.energy = 99
          p.stability = 1
          p.collapseMinutes =
            p.difficulty === 6 ? Number(process.env.QA_COLLAPSE_SECONDS || 30) / 60 : 1
        }
      else
        for (const p of portals) {
          if (p.difficulty !== 3) {
            p.status = 'closed'
            p.energy = 0
            p.stability = 100
            p.collapseMinutes = 0
          }
        }
      const data = {
        version: 3,
        portals,
        events: [],
        phase: 'RUNNING',
        elapsedMs: 0,
        finalResonance: 0,
      }
      body = Buffer.from(
        body
          .toString()
          .replace(
            '<head>',
            '<head><script>if(!sessionStorage.getItem(' +
              JSON.stringify(fixture) +
              ')){localStorage.setItem("rift-warden-state-v3",' +
              JSON.stringify(JSON.stringify(data)) +
              ');localStorage.setItem("rift-warden-onboarding-seen","yes");sessionStorage.setItem(' +
              JSON.stringify(fixture) +
              ',"yes")}</script>',
          ),
      )
    }
    res
      .writeHead(200, {
        'Content-Type': types[extname(path)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      })
      .end(body)
  } catch {
    res.writeHead(404).end('Not found')
  }
}).listen(port, '127.0.0.1', () =>
  console.log(
    'QA only: http://127.0.0.1:' +
      port +
      ' — /cascade.html, /finish.html; production assets unchanged',
  ),
)

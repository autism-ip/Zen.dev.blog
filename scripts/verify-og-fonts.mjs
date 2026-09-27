/** Verify the deployable image functions contain their runtime font dependencies. */
import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('.next/server/app')
const traces = (await readdir(root, { recursive: true })).filter((file) =>
  file.endsWith('opengraph-image/route.js.nft.json')
)
assert(traces.length > 0, 'No image function traces found; run the production build first')
for (const trace of traces) {
  const tracePath = path.join(root, trace)
  const files = JSON.parse(await readFile(tracePath, 'utf8')).files.map((file) =>
    path.resolve(path.dirname(tracePath), file)
  )
  for (const font of ['Geist-Regular.otf', 'Geist-Medium.otf']) {
    const fontPath = path.resolve('src/assets/fonts', font)
    assert(files.includes(fontPath), `${trace}: missing runtime font ${font}`)
    await access(fontPath)
  }
}
console.log(`Verified runtime fonts in ${traces.length} image function traces`)

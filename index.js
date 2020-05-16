const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const archiver = require('archiver')
const emojis = require('emojibase-data/en/data.json')

const COPY_DIR = './static/'
const TMP_DIR = './tmp/'
const OUT_FILE = './emojis.alfredSnippets'

// Clean up
if (fs.existsSync(OUT_FILE)) {
  fs.unlinkSync(OUT_FILE)
}
if (fs.existsSync(TMP_DIR)) {
  fs.rmdirSync(TMP_DIR, { recursive: true })
}
fs.mkdirSync(TMP_DIR)

// ==== Generate JSON files ====
let num_emojis = 0
emojis.forEach(entry => {
  const uid = uuidv4()
  const filename = `${uid}_${entry.emoji}.json`
  const shortcodes = entry.shortcodes.map(x => `:${x}:`).join(' ')
  const snippet = {
    'alfredsnippet': {
      uid,
      'snippet': entry.emoji,
      'name': `${entry.emoji} ${shortcodes} (${entry.annotation})`,
      'keyword': `${shortcodes} (${entry.tags.join(' ')})`
    }
  }

  try {
    fs.writeFileSync(path.join(TMP_DIR, filename), JSON.stringify(snippet), {}, () => { console.log(`Wrote ${filename}`) })

    num_emojis++
  } catch (error) {
    console.error(`An error occured when trying to write the file for emoji ${entry.emoji} (${entry.annotation}). Maybe this emoji is not yet supported?`)
  }
})

// Copy over static files i.e. icon / attribution
const files = fs.readdirSync(COPY_DIR)
files.forEach(file => {
  const srcpath =  path.join(COPY_DIR, file)
  const dstpath =  path.join(TMP_DIR, file)
  fs.copyFileSync(srcpath, dstpath)
})

// ==== Write zip archive ====
const output = fs.createWriteStream(OUT_FILE)
const archive = archiver('zip')

output.on('close', function () {
  console.log(`Written ${OUT_FILE} with ${num_emojis} emojis and ${archive.pointer()} bytes.`)
})

archive.on('error', function (err) {
  throw err
})

archive.pipe(output)

archive.directory(TMP_DIR, false)
archive.finalize()

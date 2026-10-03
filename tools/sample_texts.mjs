// Prints the four text rows and their sizes for a sample time, for render_preview.py
import { fuzzy, fitTextSize, weekday } from '../utils/fuzzy.js'

const [lang, hour, minute, day, date] = process.argv.slice(2)
const rows = [32, 52, 52, 64] // maxSize per row, as in watchface/index.js
const texts = [`${weekday(Number(day), lang)}, ${date}`, ...fuzzy(Number(hour), Number(minute), lang)]
console.log(JSON.stringify(texts.map((text, i) => ({ text, size: fitTextSize(text, 350, rows[i]) }))))

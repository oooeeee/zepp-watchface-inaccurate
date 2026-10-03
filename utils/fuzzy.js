// "Fuzzy time" phrases in Russian and English. Pure logic, no Zepp OS imports,
// so it can be tested with plain Node.

// Index 0 = hour 1, index 11 = hour 12
const RU_GENITIVE = [
  'первого', 'второго', 'третьего', 'четвёртого', 'пятого', 'шестого',
  'седьмого', 'восьмого', 'девятого', 'десятого', 'одиннадцатого', 'двенадцатого'
]
const RU_CARDINAL = [
  'час', 'два', 'три', 'четыре', 'пять', 'шесть',
  'семь', 'восемь', 'девять', 'десять', 'одиннадцать', 'двенадцать'
]
const EN_HOURS = [
  'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'
]

// One row per 5-minute step: [line 1, line 2, line 3, use next hour].
// In line texts, {h} is replaced with the hour word from the row's table.
const PHRASES = {
  ru: [
    ['', 'ровно', RU_CARDINAL, false],
    ['', 'пять минут', RU_GENITIVE, true],
    ['', 'десять минут', RU_GENITIVE, true],
    ['', 'четверть', RU_GENITIVE, true],
    ['двадцать', 'минут', RU_GENITIVE, true],
    ['почти', 'половина', RU_GENITIVE, true],
    ['', 'половина', RU_GENITIVE, true],
    ['', 'без двадцати', RU_CARDINAL, true],
    ['', 'без двадцати', RU_CARDINAL, true],
    ['', 'без четверти', RU_CARDINAL, true],
    ['', 'без десяти', RU_CARDINAL, true],
    ['', 'без пяти', RU_CARDINAL, true]
  ].map(([l1, l2, words, next]) => [l1, l2, '{h}', words, next]),
  en: [
    ['', '{h}', "o'clock", false],
    ['', 'five past', '{h}', false],
    ['', 'ten past', '{h}', false],
    ['', 'quarter past', '{h}', false],
    ['', 'twenty past', '{h}', false],
    ['twenty-five', 'past', '{h}', false],
    ['', 'half past', '{h}', false],
    ['twenty-five', 'to', '{h}', true],
    ['', 'twenty to', '{h}', true],
    ['', 'quarter to', '{h}', true],
    ['', 'ten to', '{h}', true],
    ['', 'five to', '{h}', true]
  ].map(([l1, l2, l3, next]) => [l1, l2, l3, EN_HOURS, next])
}

// hour24: 0-23, minute: 0-59, lang: 'ru' | 'en' (anything else is English).
// Returns [line1, line2, line3]; line1 may be ''.
export function fuzzy(hour24, minute, lang) {
  const rows = PHRASES[lang] || PHRASES.en
  const [l1, l2, l3, words, next] = rows[Math.floor(minute / 5)]
  const hour12 = hour24 % 12 || 12
  const word = words[(next ? (hour12 % 12) + 1 : hour12) - 1]
  return [l1, l2, l3].map((line) => line.replace('{h}', word))
}

// Largest text size (<= maxSize) at which `text` should fit into `width` px.
// Uses an average glyph width of ~0.62 em, which is generous for Cyrillic in proportional fonts.
export const GLYPH_WIDTH_EM = 0.62

export function fitTextSize(text, width, maxSize) {
  if (!text) return maxSize
  return Math.min(maxSize, Math.floor(width / (text.length * GLYPH_WIDTH_EM)))
}

// Index 0 = Monday, matching Time.getDay() which returns 1-7 with 1 = Monday
const WEEKDAYS = {
  ru: ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
}

export function weekday(day, lang) {
  return (WEEKDAYS[lang] || WEEKDAYS.en)[day - 1]
}

// Width of the battery bar fill for a 0-100 percentage
export function batteryFillWidth(percent, width) {
  const p = Math.max(0, Math.min(100, percent))
  return Math.round((width * p) / 100)
}

// Below this charge level the battery bar turns red
export const LOW_BATTERY = 20

export function isLowBattery(percent) {
  return percent < LOW_BATTERY
}

// Run with: node --test test/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fuzzy, fitTextSize, weekday, batteryFillWidth, isLowBattery } from '../utils/fuzzy.js'

const examples = [
  [10, 15, '', 'четверть', 'одиннадцатого'],
  [1, 22, 'двадцать', 'минут', 'второго'],
  [1, 27, 'почти', 'половина', 'второго'],
  [10, 47, '', 'без четверти', 'одиннадцать'],
  [12, 32, '', 'половина', 'первого'],
  [12, 50, '', 'без десяти', 'час'],
  [1, 2, '', 'ровно', 'час'],
  [0, 0, '', 'ровно', 'двенадцать'],
  [12, 0, '', 'ровно', 'двенадцать'],
  [23, 59, '', 'без пяти', 'двенадцать'],
  [11, 30, '', 'половина', 'двенадцатого'],
  [13, 5, '', 'пять минут', 'второго']
]

for (const [h, m, ...expected] of examples) {
  test(`ru ${h}:${String(m).padStart(2, '0')}`, () => {
    assert.deepEqual(fuzzy(h, m, 'ru'), expected)
  })
}

const examplesEn = [
  [10, 15, '', 'quarter past', 'ten'],
  [1, 22, '', 'twenty past', 'one'],
  [1, 27, 'twenty-five', 'past', 'one'],
  [10, 37, 'twenty-five', 'to', 'eleven'],
  [10, 47, '', 'quarter to', 'eleven'],
  [12, 32, '', 'half past', 'twelve'],
  [12, 50, '', 'ten to', 'one'],
  [1, 2, '', 'one', "o'clock"],
  [0, 0, '', 'twelve', "o'clock"],
  [23, 59, '', 'five to', 'twelve']
]

for (const [h, m, ...expected] of examplesEn) {
  test(`en ${h}:${String(m).padStart(2, '0')}`, () => {
    assert.deepEqual(fuzzy(h, m, 'en'), expected)
  })
}

test('unknown languages fall back to English', () => {
  assert.deepEqual(fuzzy(10, 15, 'de'), fuzzy(10, 15, 'en'))
  assert.equal(weekday(1, 'de'), 'Monday')
})

test('every minute of the day has lines 2 and 3, in both languages', () => {
  for (const lang of ['ru', 'en']) {
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m++) {
        const lines = fuzzy(h, m, lang)
        assert.equal(lines.length, 3)
        assert.ok(lines[1], `${lang}: line 2 empty at ${h}:${m}`)
        assert.ok(lines[2], `${lang}: line 3 empty at ${h}:${m}`)
        assert.ok(!lines.join('').includes('{h}'), `${lang}: placeholder left at ${h}:${m}`)
        // Same result for every minute inside a 5-minute step
        assert.deepEqual(lines, fuzzy(h, m - (m % 5), lang))
      }
    }
  }
})

test('text sizes stay readable for the longest words', () => {
  assert.ok(fitTextSize('одиннадцатого', 350, 64) >= 40)
  assert.ok(fitTextSize('без двадцати', 350, 52) >= 40)
  assert.equal(fitTextSize('час', 350, 64), 64)
})

test('weekday names, 1 = Monday', () => {
  assert.equal(weekday(1, 'ru'), 'понедельник')
  assert.equal(weekday(3, 'ru'), 'среда')
  assert.equal(weekday(7, 'ru'), 'воскресенье')
})

test('battery fill width', () => {
  assert.equal(batteryFillWidth(0, 200), 0)
  assert.equal(batteryFillWidth(50, 200), 100)
  assert.equal(batteryFillWidth(100, 200), 200)
  assert.equal(batteryFillWidth(150, 200), 200)
})

test('low battery threshold', () => {
  assert.equal(isLowBattery(0), true)
  assert.equal(isLowBattery(19), true)
  assert.equal(isLowBattery(20), false)
  assert.equal(isLowBattery(100), false)
})

import { createWidget, widget, align, prop, text_style, show_level } from '@zos/ui'
import { Time, Battery } from '@zos/sensor'
import { getLanguage } from '@zos/settings'
import { fuzzy, fitTextSize, weekday, batteryFillWidth, isLowBattery } from '../utils/fuzzy'

// getLanguage() codes: https://docs.zepp.com/docs/v2/reference/related-resources/language-list/
const LANGUAGE_RU = 4

// Bip 6: 390x450
const SCREEN_W = 390
const MARGIN = 20
const TEXT_W = SCREEN_W - MARGIN * 2

// Text rows: date ("суббота, 3" / "Saturday, 3"), then fuzzy time with a fixed slot per line
// so the layout never jumps when line 1 is empty
const ROWS = [
  { y: 20, h: 44, maxSize: 32 },
  { y: 130, h: 76, maxSize: 52 },
  { y: 206, h: 76, maxSize: 52 },
  { y: 284, h: 100, maxSize: 64 }
]

// Battery: outlined bar with a fill inside, normal mode only
const BATTERY_BAR = { x: 150, y: 10, w: 390 - 150 - 150, h: 6, radius: 3, line_width: 1 }
const BATTERY_PAD = 1
const BATTERY_FILL = {
  x: BATTERY_BAR.x + BATTERY_PAD,
  y: BATTERY_BAR.y + BATTERY_PAD,
  w: BATTERY_BAR.w - BATTERY_PAD * 2,
  h: BATTERY_BAR.h - BATTERY_PAD * 2,
  radius: 4
}

const NORMAL = { time: 0xffffff, info: 0xb0b0b0, level: show_level.ONLY_NORMAL }
const BATTERY_OK = 0x33dd55
const BATTERY_LOW = 0xff3b30
// Zepp AOD design rules: gray must be above 153 (0x99) per channel
const AOD = { time: 0xa0a0a0, info: 0xa0a0a0, level: show_level.ONAL_AOD }

// Set to e.g. 'raw/Cheque-Regular.ttf' (file in assets/390x450-amazfit-bip-6/raw/)
// to use a custom font; undefined keeps the system font.
const FONT = undefined

function createText(x, y, w, h, size, color, alignH, level) {
  const options = {
    x,
    y,
    w,
    h,
    color,
    text_size: size,
    align_h: alignH,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
    text: '',
    show_level: level
  }
  if (FONT) options.font = FONT
  return createWidget(widget.TEXT, options)
}

// Text rows for a display mode (normal or AOD)
function createRows(palette) {
  return ROWS.map(({ y, h, maxSize }, i) =>
    createText(MARGIN, y, TEXT_W, h, maxSize, i === 0 ? palette.info : palette.time, align.CENTER_H, palette.level)
  )
}

function createBatteryBar() {
  const outline = createWidget(widget.STROKE_RECT, {
    ...BATTERY_BAR,
    color: BATTERY_OK,
    show_level: NORMAL.level
  })
  const fill = createWidget(widget.FILL_RECT, {
    ...BATTERY_FILL,
    w: 0,
    color: BATTERY_OK,
    show_level: NORMAL.level
  })
  return { outline, fill }
}

WatchFace({
  onInit() {
    this.time = new Time()
    this.battery = new Battery()
    this.rowSets = []
    this.batteryBar = null
    this.onBatteryChange = () => this.updateBattery()
  },

  build() {
    this.rowSets = [createRows(NORMAL), createRows(AOD)]
    this.batteryBar = createBatteryBar()
    this.updateTime()
    this.updateBattery()
    // The minute tick doesn't run while the face is paused (screen off, AOD,
    // other screens), so refresh as soon as the face is visible again
    createWidget(widget.WIDGET_DELEGATE, {
      resume_call: () => {
        this.updateTime()
        this.updateBattery()
      }
    })
    // Also covers the date rolling over at midnight
    this.time.onPerMinute(() => this.updateTime())
    this.battery.onChange(this.onBatteryChange)
  },

  updateTime() {
    if (!this.rowSets.length) return
    // Russian on a Russian watch, English otherwise
    const lang = getLanguage() === LANGUAGE_RU ? 'ru' : 'en'
    const texts = [
      `${weekday(this.time.getDay(), lang)}, ${this.time.getDate()}`,
      ...fuzzy(this.time.getHours(), this.time.getMinutes(), lang)
    ]
    this.rowSets.forEach((rows) => {
      rows.forEach((w, i) => {
        w.setProperty(prop.MORE, {
          text: texts[i],
          text_size: fitTextSize(texts[i], TEXT_W, ROWS[i].maxSize)
        })
      })
    })
  },

  updateBattery() {
    if (!this.batteryBar) return
    const percent = this.battery.getCurrent()
    const color = isLowBattery(percent) ? BATTERY_LOW : BATTERY_OK
    // Rect widgets need x, y, w and h together when updated via prop.MORE
    const { x, y, w, h } = BATTERY_BAR
    this.batteryBar.outline.setProperty(prop.MORE, { x, y, w, h, color })
    const f = BATTERY_FILL
    this.batteryBar.fill.setProperty(prop.MORE, {
      x: f.x,
      y: f.y,
      w: batteryFillWidth(percent, f.w),
      h: f.h,
      color
    })
  },

  onDestroy() {
    this.battery.offChange(this.onBatteryChange)
    // Time.onPerMinute has no matching off/unregister call in the API, so there is nothing to clean up
    this.rowSets = []
    this.batteryBar = null
  }
})

# AGENTS.md

Zepp OS watch face "Inaccurate time" (app ID 1129852): the time in words, rounded
down to 5 minutes, in Russian or English. See README.md for features and layout.

## Commands

```sh
node --test test/                      # unit tests (plain Node, no Zepp OS needed)
zeus build -t 390x450-amazfit-bip-6    # build the store package into dist/
zeus dev                               # simulator (run by the user, not by agents)
python3 tools/render_preview.py        # previews; needs Pillow and Node
```

Always run the tests and `zeus build` after changes. If zeus prints
"Unsupported targets have been removed", rerun once before changing anything: its
device check has been flaky.

## Structure

- `utils/fuzzy.js`: all logic (phrases per language, weekdays, text sizing,
  battery helpers). Keep it free of `@zos/*` imports so Node tests can load it.
- `watchface/index.js`: widgets and sensor wiring only.
- `tools/render_preview.py` copies `ROWS` and the battery bar geometry from
  `watchface/index.js`. Update both together, then regenerate the previews.

## Zepp OS rules learned the hard way

- **API version.** `runtime.apiVersion` is 2.1 because `Time.onPerMinute` needs
  2.1. Use only the `@zos/*` modules (`@zos/ui`, `@zos/sensor`, `@zos/settings`, ...);
  never the old `hmUI` / `hmSensor` globals. Docs: https://docs.zepp.com (v2 pages
  for API 2.x). Check the docs rather than guessing an API.
- **AOD.** `"lockscreen": 1` in `app.json` is what enables the watch face's own
  always-on display (the Chinese docs call it 息屏显示; the English docs
  mistranslate it as "lock screen"). With 0, the watch shows its default AOD.
- **Show levels.** Widgets use `show_level.ONLY_NORMAL` or `show_level.ONAL_AOD`.
  `ONAL_AOD` is Zepp's own spelling; don't "fix" it. AOD widgets are separate
  widgets in gray `0xa0a0a0`: AOD gray must be above 153 per channel.
- **No unregister for the minute tick.** `Time.onPerMinute` has no off/unregister
  call; `Battery.onChange` does (`offChange` in `onDestroy`).
- **Rectangles.** `FILL_RECT` / `STROKE_RECT` updates via `prop.MORE` must
  include x, y, w and h together. A `STROKE_RECT` with `line_width: 0` looks like
  a thin outline in the simulator but fills the whole rect on the watch, so keep
  `line_width >= 1`.
- **Language.** `getLanguage()` from `@zos/settings` returns a number; Russian
  is 4 (https://docs.zepp.com/docs/v2/reference/related-resources/language-list/).
  Anything that isn't Russian falls back to English.
- **Text.** The system font renders Cyrillic. Text size is estimated with
  `fitTextSize` (0.62 em per character), which is deliberately conservative.

## Devices and publishing

- One target, `390x450-amazfit-bip-6`, serves every supported 390×450 watch
  through its `platforms` list: Bip 6, Active 2 (Square), Active, Cheetah
  (Square) and GTS 4. Platform names and IDs come from zeus's device registry
  (`~/.zepp/.zeus_devices`). Don't add GTS 3 or other API 1.0 devices.
- The watch preview `assets/390x450-amazfit-bip-6/icon.png` must be 266×307
  (English, the default language). The store previews are `tools/preview-en.png`
  and `tools/preview-ru.png`.
- For a store update, bump `version.code` and `version.name` in `app.json` and
  rebuild. Never change `appId`: it must match the Zepp console.
- The store needs English and Russian names and descriptions, kept in
  `i18n` in `app.json` and in the console.

## Repo conventions

- `dist/` is build output and is not committed.
- Commits use this repo's local git identity; don't change it.
- Don't commit Zepp toolchain or SDK files; the Zepp developer agreement treats
  them as confidential.

ModernClient Native Y0 — JS 0.1.1

Fixes in 0.1.1:
- Mining or replacing a block below Y=0 no longer writes into the vanilla
  16-section chunk array with a negative index.
- Negative-Y client block changes are stored in ModernClient's separate Y0
  section storage.
- Added safe get/set light paths below Y=0.
- Prevents the vanilla 1.12 lighting engine from recalculating negative-Y
  positions; authoritative light comes from MarkyY0Bridge.
- Preserves ModernClient UI, mods, branding, assets, VoidSent server entry,
  and spear helper.

Required server plugin:
- MarkyY0Bridge 1.0.4

Installation:
1. Deploy every file from this ZIP into a fresh web directory.
2. Remove/replace the prior 0.1.0 files.
3. Hard-refresh with Ctrl+Shift+R or clear site data.
4. Join and run /markyy0 resync once.

This build is JavaScript, not WASM.

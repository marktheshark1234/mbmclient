# ModernClient WASM Compatibility Edition

This build was produced from the compiled ModernClient distribution supplied by the user.

## Added

- Complete ViaVersion PNG integrity audit.
- Dedicated 32×32 in-hand textures for wooden, stone, copper, iron, golden, and diamond spears.
- F7 client-side locator/compass bar.
- V-key spear-use helper. Hold V and release it to send a normal right-click use/release sequence, with the minimum spear charge time enforced.
- `window.ModernClientCompat` API for native hooks or server bridges to supply exact yaw and player markers.

## Controls

- `V`: spear use helper.
- `F7`: locator bar on/off.
- `F8`: help panel.
- `\`: calibrate the current view as North.

## Important limitations

The original Java/TeaVM source was not present in the supplied ZIP. The `wasm` game core is therefore the original compiled vendor binary. The compatibility layer and repacked assets are new, editable source, but this is **not a native 1.21.11 engine port**.

Real Lunge is server-authoritative. The V helper can make the old client issue the correct ordinary item-use gesture, but whether the 1.21.11 server applies Lunge still depends on the ViaVersion/ViaBackwards translation path and how the spear was represented to the 1.12 client.

The locator bar can render exact player dots only when `ModernClientCompat.updatePlayers(...)` receives player coordinates. Without a native game-core hook, it operates as a client-side compass.

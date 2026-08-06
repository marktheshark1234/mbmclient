ModernClient Native Y0 — JS 0.1.0

THIS IS A REAL MODIFICATION OF MODERNCLIENT'S GENERATED GAME CODE.
It is not Tuff Client and it is not a renamed/repackaged copy.

Implemented:
- Parses MarkyY0Bridge/Tuff-style Y0CH data appended to 1.12 chunk packets.
- Stores four extra 16-block sections per chunk for Y=-64 through Y=-1.
- Uses negative-section block states for rendering and collision lookups.
- Uses transmitted sky light and block light below Y=0.
- Extends ModernClient's render frustum from 16 to 20 vertical sections.
- Moves the four extra render sections to Y=-64, -48, -32 and -16.
- Expands client world/build-height and loaded-area checks down to Y=-64.
- Preserves the existing ModernClient UI, mods, assets, VoidSent server entry,
  prior overlay removals, and spear helper.

Required server setup:
- MarkyY0Bridge 1.0.3 on the Paper backend.
- ViaVersion, ViaBackwards and ViaRewind on the Paper backend.
- Do not put the Via plugins on Velocity for this setup.
- /markyy0 status should show protocol=340, injected=true and appended > 0.

Test procedure:
1. Deploy every file in this ZIP to a fresh web directory.
2. Hard-refresh the browser or clear the site's cached files.
3. Join the server.
4. Run /markyy0 resync.
5. Travel or teleport below Y=0.

Build status:
- JavaScript syntax validated with Node.js.
- The Y0 packet decoder was unit-tested with a synthetic chunk section.
- The decoder returned the expected block state and sky/block light.
- This build has not yet been live-tested on your actual browser/server pair.

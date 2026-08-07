ModernClient Native Y0 — JS 0.1.2

MATCHING SERVER PLUGIN
- MarkyY0Bridge 1.0.4 on the Paper backend.
- ViaVersion, ViaBackwards and ViaRewind on the Paper backend.
- Keep EaglercraftXServer on Velocity.
- Do not install TuffX/TuffXPlus alongside MarkyY0Bridge.

WHAT 0.1.2 FIXES
- Keeps the modified ModernClient UI, modules, assets, server entry and spear helper.
- Keeps the 0.1.1 negative-Y packet, section, lighting and mining protections.
- Fixes the join crash in RenderGlobal.renderEntities / AbstractCollection.isEmpty.
- Fixes the 0.1.0 mining crash caused by writing to a negative vanilla chunk-section index.
- Stores negative-Y block changes as encoded numeric state IDs.
- Never stores TeaVM Java IBlockState objects in raw JavaScript arrays.

INSTALLATION
1. Keep the existing classes.js and all existing assets in the mbmclient repository.
2. Upload classes-y0-0.1.2-loader.js to the repository root.
3. Replace index.html with the included index.html.
4. Replace NATIVE_Y0_README.txt if desired.
5. Let Vercel finish deploying.
6. Clear site data for mbmclient.vercel.app or use Ctrl+Shift+R.
7. Start Paper with MarkyY0Bridge 1.0.4.
8. Join and run /markyy0 resync once.

Do not use the old index.html, because it loads the broken 0.1.1 classes.js directly.

/*
 * ModernClient Compatibility Layer
 * Added features:
 *  - F7 locator/compass bar with an open marker API
 *  - V-key spear use helper (press/hold/release translated as right-click use)
 *  - non-invasive diagnostics for modern ViaVersion texture resolution
 *
 * This file intentionally does not modify or replace the proprietary/compiled
 * game core. It can be removed by deleting the script tag from index.html.
 */
(function () {
  "use strict";

  const VERSION = "0.1.0";
  const STORAGE_KEY = "modernclient.compat.settings.v1";
  const DEFAULTS = {
    locatorVisible: true,
    locatorOpacity: 0.88,
    mouseDegreesPerPixel: 0.15,
    yawOffset: 0,
    spearMinimumChargeMs: 425,
    showHelpOnFirstRun: true
  };

  function loadSettings() {
    try {
      return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    } catch (_error) {
      return Object.assign({}, DEFAULTS);
    }
  }

  const settings = loadSettings();
  const state = {
    yaw: Number(settings.yawOffset) || 0,
    self: null,
    players: [],
    charging: false,
    chargeStartedAt: 0,
    delayedReleaseTimer: 0,
    rightButtonDown: false,
    pointerLocked: false,
    visible: Boolean(settings.locatorVisible)
  };

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (_error) {
      // Storage may be blocked in embedded/sandboxed deployments.
    }
  }

  function normalizeDegrees(value) {
    value %= 360;
    return value < 0 ? value + 360 : value;
  }

  function signedAngle(value) {
    value = normalizeDegrees(value);
    return value > 180 ? value - 360 : value;
  }

  function isTypingTarget(target) {
    if (!target || !(target instanceof Element)) return false;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
  }

  function gameTarget() {
    return document.querySelector("canvas") || document.getElementById("game_frame") || document.body;
  }

  function dispatchMouse(type, button) {
    const target = gameTarget();
    const buttons = type === "mousedown" ? (button === 2 ? 2 : 1) : 0;
    const options = {
      bubbles: true,
      cancelable: true,
      view: window,
      button,
      buttons,
      clientX: Math.round(innerWidth / 2),
      clientY: Math.round(innerHeight / 2)
    };
    target.dispatchEvent(new MouseEvent(type, options));
    if (target !== window) window.dispatchEvent(new MouseEvent(type, options));
  }

  function pressUse() {
    if (state.rightButtonDown) return;
    state.rightButtonDown = true;
    dispatchMouse("mousedown", 2);
  }

  function releaseUse() {
    if (!state.rightButtonDown) return;
    state.rightButtonDown = false;
    dispatchMouse("mouseup", 2);
  }

  let root;
  let compassTrack;
  let chargeFill;
  let chargeLabel;
  let statusToast;
  let helpPanel;

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  }

  function installStyles() {
    const style = document.createElement("style");
    style.id = "modernclient-compat-style";
    style.textContent = `
      #modernclient-compat-root{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:Arial,Helvetica,sans-serif;color:#fff;text-shadow:0 1px 2px #000;user-select:none}
      #modernclient-locator{position:absolute;top:8px;left:50%;width:min(560px,76vw);height:42px;transform:translateX(-50%);opacity:${Number(settings.locatorOpacity)};transition:opacity .15s ease,transform .15s ease}
      #modernclient-locator.mc-hidden{opacity:0;transform:translate(-50%,-12px)}
      .mc-locator-frame{position:absolute;inset:0;border:1px solid rgba(255,255,255,.42);border-radius:6px;background:linear-gradient(to bottom,rgba(8,8,10,.82),rgba(0,0,0,.62));box-shadow:0 2px 12px rgba(0,0,0,.55);overflow:hidden}
      .mc-locator-center{position:absolute;left:50%;top:0;width:2px;height:100%;background:#fff;box-shadow:0 0 4px #fff;z-index:3}
      .mc-locator-center:after{content:"";position:absolute;left:-4px;bottom:1px;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #fff}
      .mc-compass-track{position:absolute;inset:0;overflow:hidden}
      .mc-tick{position:absolute;bottom:7px;width:1px;height:6px;background:rgba(255,255,255,.55);transform:translateX(-50%)}
      .mc-tick.major{height:11px;background:rgba(255,255,255,.88)}
      .mc-cardinal{position:absolute;top:4px;transform:translateX(-50%);font-size:12px;font-weight:700;line-height:1}
      .mc-cardinal.n{color:#ff7070}.mc-cardinal.s{color:#82b7ff}.mc-cardinal.e,.mc-cardinal.w{color:#f4f4f4}
      .mc-player-marker{position:absolute;top:19px;transform:translateX(-50%);z-index:2;white-space:nowrap;text-align:center}
      .mc-player-dot{width:8px;height:8px;margin:auto;border-radius:50%;border:1px solid rgba(255,255,255,.9);box-shadow:0 0 4px #000;background:var(--mc-marker,#72f59a)}
      .mc-player-name{display:none;margin-top:1px;padding:1px 3px;border-radius:3px;background:rgba(0,0,0,.72);font-size:9px}
      .mc-player-marker:hover .mc-player-name{display:block}
      #modernclient-charge{position:absolute;left:50%;bottom:72px;width:190px;height:23px;transform:translateX(-50%);opacity:0;transition:opacity .08s ease}
      #modernclient-charge.active{opacity:1}
      .mc-charge-frame{position:absolute;inset:0;border:1px solid rgba(255,255,255,.55);background:rgba(0,0,0,.74);border-radius:4px;overflow:hidden}
      .mc-charge-fill{position:absolute;left:2px;top:2px;bottom:2px;width:0;background:linear-gradient(90deg,#8dceff,#fff);border-radius:2px;transition:width .03s linear}
      .mc-charge-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;letter-spacing:.4px}
      #modernclient-toast{position:absolute;left:50%;top:58px;max-width:min(620px,88vw);transform:translateX(-50%);padding:6px 10px;border-radius:5px;background:rgba(0,0,0,.78);font-size:12px;opacity:0;transition:opacity .15s ease}
      #modernclient-toast.show{opacity:1}
      #modernclient-help{position:absolute;right:10px;top:58px;width:min(315px,82vw);padding:10px 12px;border:1px solid rgba(255,255,255,.35);border-radius:6px;background:rgba(0,0,0,.86);font-size:12px;line-height:1.45;opacity:0;transform:translateY(-5px);transition:opacity .12s ease,transform .12s ease}
      #modernclient-help.show{opacity:1;transform:translateY(0)}
      #modernclient-help b{color:#fff}.mc-muted{color:#bcbcbc}
      @media(max-width:600px){#modernclient-locator{top:5px;width:90vw}.mc-player-name{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function installUi() {
    if (document.getElementById("modernclient-compat-root")) return;
    installStyles();
    root = makeElement("div");
    root.id = "modernclient-compat-root";

    const locator = makeElement("div");
    locator.id = "modernclient-locator";
    if (!state.visible) locator.classList.add("mc-hidden");
    const frame = makeElement("div", "mc-locator-frame");
    compassTrack = makeElement("div", "mc-compass-track");
    frame.append(compassTrack, makeElement("div", "mc-locator-center"));
    locator.appendChild(frame);

    const charge = makeElement("div");
    charge.id = "modernclient-charge";
    const chargeFrame = makeElement("div", "mc-charge-frame");
    chargeFill = makeElement("div", "mc-charge-fill");
    chargeLabel = makeElement("div", "mc-charge-label", "SPEAR");
    chargeFrame.append(chargeFill, chargeLabel);
    charge.appendChild(chargeFrame);

    statusToast = makeElement("div");
    statusToast.id = "modernclient-toast";

    helpPanel = makeElement("div");
    helpPanel.id = "modernclient-help";
    helpPanel.innerHTML = [
      "<b>ModernClient Compatibility</b><br>",
      "<b>V</b> — hold/release spear use (minimum vanilla charge is enforced)<br>",
      "<b>F7</b> — locator bar on/off<br>",
      "<b>F8</b> — this help<br>",
      "<b>\\</b> — set current view as North<br>",
      "<span class=\"mc-muted\">Player dots appear when a native hook/server bridge supplies positions. The compass itself is client-only and may need recalibration after teleports.</span>"
    ].join("");

    root.append(locator, charge, statusToast, helpPanel);
    document.documentElement.appendChild(root);
    renderLocator();

    if (settings.showHelpOnFirstRun) {
      settings.showHelpOnFirstRun = false;
      saveSettings();
      setTimeout(() => helpPanel.classList.add("show"), 1200);
      setTimeout(() => helpPanel.classList.remove("show"), 9000);
    }
  }

  let toastTimer = 0;
  function toast(message, duration) {
    if (!statusToast) return;
    statusToast.textContent = message;
    statusToast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => statusToast.classList.remove("show"), duration || 1800);
  }

  function markerAngle(player) {
    if (Number.isFinite(player.bearing)) return normalizeDegrees(player.bearing);
    if (state.self && Number.isFinite(state.self.x) && Number.isFinite(state.self.z) && Number.isFinite(player.x) && Number.isFinite(player.z)) {
      const dx = player.x - state.self.x;
      const dz = player.z - state.self.z;
      // Minecraft: 0 = South, 90 = West. The display API uses 0 = North.
      return normalizeDegrees(Math.atan2(dx, -dz) * 180 / Math.PI);
    }
    return null;
  }

  function renderLocator() {
    if (!compassTrack) return;
    const yaw = normalizeDegrees(state.self && Number.isFinite(state.self.yaw) ? state.self.yaw : state.yaw);
    compassTrack.replaceChildren();
    const fieldOfView = 120;
    const half = fieldOfView / 2;

    for (let angle = 0; angle < 360; angle += 5) {
      const delta = signedAngle(angle - yaw);
      if (Math.abs(delta) > half + 3) continue;
      const left = 50 + (delta / fieldOfView) * 100;
      const isMajor = angle % 45 === 0;
      const tick = makeElement("div", "mc-tick" + (isMajor ? " major" : ""));
      tick.style.left = left + "%";
      compassTrack.appendChild(tick);
      if (angle % 90 === 0) {
        const label = angle === 0 ? "N" : angle === 90 ? "E" : angle === 180 ? "S" : "W";
        const cardinal = makeElement("div", "mc-cardinal " + label.toLowerCase(), label);
        cardinal.style.left = left + "%";
        compassTrack.appendChild(cardinal);
      }
    }

    for (const player of state.players) {
      const bearing = markerAngle(player);
      if (bearing == null) continue;
      const delta = signedAngle(bearing - yaw);
      if (Math.abs(delta) > half) continue;
      const left = 50 + (delta / fieldOfView) * 100;
      const marker = makeElement("div", "mc-player-marker");
      marker.style.left = left + "%";
      marker.style.setProperty("--mc-marker", player.color || "#72f59a");
      marker.append(makeElement("div", "mc-player-dot"), makeElement("div", "mc-player-name", player.name || "Player"));
      compassTrack.appendChild(marker);
    }
  }

  function updateCharge() {
    if (!chargeFill) return;
    if (!state.charging) {
      chargeFill.style.width = "0%";
      return;
    }
    const elapsed = performance.now() - state.chargeStartedAt;
    const ready = elapsed >= Number(settings.spearMinimumChargeMs);
    const percent = Math.min(100, elapsed / Number(settings.spearMinimumChargeMs) * 100);
    chargeFill.style.width = percent + "%";
    chargeLabel.textContent = ready ? "SPEAR READY — RELEASE V" : "CHARGING SPEAR";
    requestAnimationFrame(updateCharge);
  }

  function beginSpearUse() {
    clearTimeout(state.delayedReleaseTimer);
    state.charging = true;
    state.chargeStartedAt = performance.now();
    const charge = document.getElementById("modernclient-charge");
    if (charge) charge.classList.add("active");
    pressUse();
    updateCharge();
  }

  function finishSpearUse() {
    if (!state.charging) return;
    const elapsed = performance.now() - state.chargeStartedAt;
    const remaining = Math.max(0, Number(settings.spearMinimumChargeMs) - elapsed);
    const complete = () => {
      state.charging = false;
      releaseUse();
      const charge = document.getElementById("modernclient-charge");
      if (charge) charge.classList.remove("active");
      chargeFill.style.width = "0%";
    };
    if (remaining > 0) state.delayedReleaseTimer = setTimeout(complete, remaining);
    else complete();
  }

  function toggleLocator() {
    state.visible = !state.visible;
    settings.locatorVisible = state.visible;
    saveSettings();
    const locator = document.getElementById("modernclient-locator");
    if (locator) locator.classList.toggle("mc-hidden", !state.visible);
    toast("Locator bar " + (state.visible ? "enabled" : "disabled"));
  }

  function installInput() {
    document.addEventListener("pointerlockchange", () => {
      state.pointerLocked = Boolean(document.pointerLockElement);
    }, true);

    document.addEventListener("mousemove", event => {
      if (!document.pointerLockElement) return;
      state.yaw = normalizeDegrees(state.yaw + event.movementX * Number(settings.mouseDegreesPerPixel));
      renderLocator();
    }, true);

    window.addEventListener("keydown", event => {
      if (event.repeat || isTypingTarget(event.target)) return;
      if (event.code === "KeyV") {
        event.preventDefault();
        beginSpearUse();
      } else if (event.code === "F7") {
        event.preventDefault();
        toggleLocator();
      } else if (event.code === "F8") {
        event.preventDefault();
        helpPanel && helpPanel.classList.toggle("show");
      } else if (event.code === "Backslash") {
        event.preventDefault();
        state.yaw = 0;
        if (state.self) state.self.yaw = 0;
        renderLocator();
        toast("Locator calibrated: current view = North");
      }
    }, true);

    window.addEventListener("keyup", event => {
      if (event.code !== "KeyV" || isTypingTarget(event.target)) return;
      event.preventDefault();
      finishSpearUse();
    }, true);

    window.addEventListener("blur", () => {
      state.charging = false;
      clearTimeout(state.delayedReleaseTimer);
      releaseUse();
      const charge = document.getElementById("modernclient-charge");
      if (charge) charge.classList.remove("active");
    });
  }

  function installPublicApi() {
    const api = {
      version: VERSION,
      setYaw(yaw) {
        if (!Number.isFinite(Number(yaw))) return;
        state.yaw = normalizeDegrees(Number(yaw));
        if (state.self) state.self.yaw = state.yaw;
        renderLocator();
      },
      setSelf(self) {
        state.self = self && typeof self === "object" ? Object.assign({}, self) : null;
        if (state.self && Number.isFinite(Number(state.self.yaw))) state.self.yaw = normalizeDegrees(Number(state.self.yaw));
        renderLocator();
      },
      updatePlayers(players) {
        state.players = Array.isArray(players) ? players.slice(0, 128).map(player => Object.assign({}, player)) : [];
        renderLocator();
      },
      clearPlayers() {
        state.players = [];
        renderLocator();
      },
      setVisible(visible) {
        state.visible = Boolean(visible);
        settings.locatorVisible = state.visible;
        saveSettings();
        const locator = document.getElementById("modernclient-locator");
        if (locator) locator.classList.toggle("mc-hidden", !state.visible);
      },
      beginSpearUse,
      finishSpearUse,
      diagnostics() {
        return {
          version: VERSION,
          pointerLocked: state.pointerLocked,
          yaw: state.yaw,
          self: state.self,
          players: state.players.slice(),
          settings: Object.assign({}, settings),
          canvasFound: Boolean(document.querySelector("canvas"))
        };
      }
    };
    window.ModernClientCompat = api;

    window.addEventListener("modernclient:locator", event => {
      const detail = event.detail || {};
      if (detail.self) api.setSelf(detail.self);
      if (detail.players) api.updatePlayers(detail.players);
      if (Number.isFinite(Number(detail.yaw))) api.setYaw(Number(detail.yaw));
    });
  }

  function boot() {
    installUi();
    installInput();
    installPublicApi();
    console.info("[ModernClient Compat] loaded v" + VERSION);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();

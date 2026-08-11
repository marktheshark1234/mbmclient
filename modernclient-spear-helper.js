/*
 * ModernClient silent spear input helper
 *
 * No HUD, compass, popups, toast messages, or visible UI.
 * Hold V to emulate holding right-click; release V to release use.
 * A very short tap is held until the configured minimum charge time.
 */
(function () {
  "use strict";

  const MINIMUM_CHARGE_MS = 425;
  let charging = false;
  let startedAt = 0;
  let rightButtonDown = false;
  let releaseTimer = 0;

  function isTypingTarget(target) {
    if (!target || !(target instanceof Element)) return false;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
  }

  function targets() {
    const result = [];
    const canvas = document.querySelector("canvas");
    const frame = document.getElementById("game_frame");
    if (canvas) result.push(canvas);
    if (frame && frame !== canvas) result.push(frame);
    result.push(window);
    return result;
  }

  function dispatchMouse(type, button) {
    const buttons = type === "mousedown" ? (button === 2 ? 2 : 1) : 0;
    const options = {
      bubbles: true,
      cancelable: true,
      view: window,
      button,
      buttons,
      clientX: Math.round(window.innerWidth / 2),
      clientY: Math.round(window.innerHeight / 2)
    };

    for (const target of targets()) {
      try {
        target.dispatchEvent(new MouseEvent(type, options));
      } catch (_error) {
        // Ignore targets that reject synthetic mouse events.
      }
    }
  }

  function pressUse() {
    if (rightButtonDown) return;
    rightButtonDown = true;
    dispatchMouse("mousedown", 2);
  }

  function releaseUse() {
    if (!rightButtonDown) return;
    rightButtonDown = false;
    dispatchMouse("mouseup", 2);
  }

  function beginUse() {
    clearTimeout(releaseTimer);
    charging = true;
    startedAt = performance.now();
    pressUse();
  }

  function finishUse() {
    if (!charging) return;
    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(0, MINIMUM_CHARGE_MS - elapsed);

    const complete = function () {
      charging = false;
      releaseUse();
    };

    if (remaining > 0) releaseTimer = setTimeout(complete, remaining);
    else complete();
  }

  window.addEventListener("keydown", function (event) {
    if (event.repeat || event.code !== "KeyV" || isTypingTarget(event.target)) return;
    event.preventDefault();
    beginUse();
  }, true);

  window.addEventListener("keyup", function (event) {
    if (event.code !== "KeyV" || isTypingTarget(event.target)) return;
    event.preventDefault();
    finishUse();
  }, true);

  window.addEventListener("blur", function () {
    charging = false;
    clearTimeout(releaseTimer);
    releaseUse();
  });

  // Kept intentionally minimal for debugging without adding any visible UI.
  window.ModernClientSpearHelper = {
    beginUse,
    finishUse,
    isCharging: function () { return charging; }
  };
})();

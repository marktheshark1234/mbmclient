(function () {
  "use strict";

  function fail(message) {
    console.error("[ModernClient Y0 0.1.2] " + message);
    throw new Error(message);
  }

  function replaceExactlyOnce(source, label, before, after) {
    var first = source.indexOf(before);
    if (first < 0) {
      fail("Could not find patch target: " + label);
    }
    if (source.indexOf(before, first + before.length) >= 0) {
      fail("Patch target appears more than once: " + label);
    }
    return source.slice(0, first) + after + source.slice(first + before.length);
  }

  window.MCY0_CLASS_READY = fetch("classes.js?v=modernclient-native-y0-0.1.1-base", {
    cache: "no-store"
  }).then(function (response) {
    if (!response.ok) {
      fail("Could not download classes.js (HTTP " + response.status + ")");
    }
    return response.text();
  }).then(function (source) {
    source = replaceExactlyOnce(
      source,
      "engine version",
      "/* ModernClient Native Y0 engine 0.1.1 - generated-code integration */",
      "/* ModernClient Native Y0 engine 0.1.2 - generated-code integration */"
    );

    source = replaceExactlyOnce(
      source,
      "negative-Y block-state storage",
      "function MCY0_getState(cx,cz,x,y,z){\n\tvar r=MCY0_record(cx,cz,x,y,z),v;\n\tif(r===null)return null;\n\tif(r.q.o){v=r.q.o[r.i];if(v!==null&&v!==$rt_globals.undefined)return v;}\n\treturn r.q.s[r.i]|0;\n}\nfunction MCY0_setStateObj(cx,cz,x,y,z,state){\n\tvar r=MCY0_record(cx,cz,x,y,z);\n\tif(r===null)return 0;\n\tif(!r.q.o)r.q.o=new $rt_globals.Array(4096);\n\tr.q.o[r.i]=state;\n\treturn 1;\n}",
      "function MCY0_getState(cx,cz,x,y,z){\n\tvar r=MCY0_record(cx,cz,x,y,z);\n\treturn r===null?null:(r.q.s[r.i]|0);\n}\nfunction MCY0_setStateObj(cx,cz,x,y,z,state){\n\tvar r=MCY0_record(cx,cz,x,y,z),id;\n\tif(r===null)return 0;\n\t/* Store the encoded state ID, never a raw TeaVM Java object. */\n\tid=GK_(state);\n\tif(typeof id!==\"number\")return 1;\n\tr.q.s[r.i]=id|0;\n\treturn 1;\n}"
    );

    source = replaceExactlyOnce(
      source,
      "negative-Y state lookup",
      "if(e!==null)return typeof e===\"number\"?D4e(e):e;",
      "if(e!==null)return D4e(e);"
    );

    source += "\n//# sourceURL=classes-native-y0-0.1.2.js\n";

    return new Promise(function (resolve, reject) {
      var blob = new Blob([source], { type: "text/javascript" });
      var blobUrl = URL.createObjectURL(blob);
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.src = blobUrl;
      script.onload = function () {
        URL.revokeObjectURL(blobUrl);
        console.info("[ModernClient Y0 0.1.2] Patched game code loaded");
        resolve();
      };
      script.onerror = function () {
        URL.revokeObjectURL(blobUrl);
        reject(new Error("Patched classes.js failed to execute"));
      };
      document.head.appendChild(script);
    });
  });
})();

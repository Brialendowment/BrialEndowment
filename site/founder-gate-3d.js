// ============================================================
// FOUNDER GATE, 3D (window.BrialGate3D)
// A medieval palace at night and two light-bearing angels, drawn live with three.js.
// Loaded only when the Founder Portal sign-in opens. The painted 2D gate in
// admin.compiled.js stays as the fallback when WebGL is missing or this fails.
//   BrialGate3D.supported()            -> boolean
//   BrialGate3D.mount(host, { narrow }) -> { frameMs, setNarrow(n), destroy() }
// ============================================================
(function () {
  "use strict";

  function supported() {
    try {
      if (!window.THREE) return false;
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) { return false; }
  }

  function mount(host, opts) {
    var THREE = window.THREE;
    opts = opts || {};
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var rnd = (function () { var s = 20261113; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
    var disposables = [];
    var keep = function (o) { disposables.push(o); return o; };

    // ---------------------------------------------------------------- renderer
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    var canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none";
    host.appendChild(canvas);

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040a16);
    scene.fog = new THREE.FogExp2(0x0a1730, 0.0105);
    var camera = new THREE.PerspectiveCamera(46, 1, 0.5, 700);

    // ---------------------------------------------------------------- textures made in code
    function canvasTex(size, draw, repeat) {
      var c = document.createElement("canvas"); c.width = c.height = size;
      draw(c.getContext("2d"), size);
      var t = keep(new THREE.CanvasTexture(c));
      t.colorSpace = THREE.SRGBColorSpace;
      if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 4; }
      return t;
    }
    var glowTex = canvasTex(128, function (g, s) {
      var gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.08, "rgba(255,255,255,0.72)"); gr.addColorStop(0.2, "rgba(255,255,255,0.36)");
      gr.addColorStop(0.4, "rgba(255,255,255,0.14)"); gr.addColorStop(0.68, "rgba(255,255,255,0.04)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
    });
    var stoneTex = canvasTex(256, function (g, s) {
      g.fillStyle = "#8f9ab0"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 2600; i++) { var v = 120 + Math.floor(rnd() * 90); g.fillStyle = "rgba(" + v + "," + (v + 6) + "," + (v + 18) + ",0.22)"; g.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 3, 1 + rnd() * 2); }
      g.strokeStyle = "rgba(20,28,48,0.35)"; g.lineWidth = 1.2;
      for (var row = 0; row < 8; row++) {
        var y = row * s / 8; g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke();
        for (var col = 0; col < 5; col++) { var x = (col + (row % 2) * 0.5) * s / 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + s / 8); g.stroke(); }
      }
    }, [3, 2]);
    var tileTex = canvasTex(512, function (g, s) {
      g.fillStyle = "#31415f"; g.fillRect(0, 0, s, s);
      var n = 4, c = s / n;
      for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) {
        var v = 0.86 + rnd() * 0.28; g.fillStyle = "rgba(" + Math.round(52 * v) + "," + Math.round(68 * v) + "," + Math.round(102 * v) + ",1)";
        g.fillRect(a * c + 2, b * c + 2, c - 4, c - 4);
      }
      for (var i = 0; i < 1800; i++) { g.fillStyle = "rgba(190,205,235," + (rnd() * 0.06) + ")"; g.fillRect(rnd() * s, rnd() * s, 2, 2); }
    }, [44, 44]);

    // ---------------------------------------------------------------- materials
    var M = {
      wall: keep(new THREE.MeshStandardMaterial({ color: 0x566a92, roughness: 0.92, metalness: 0.02, map: stoneTex })),
      wallDark: keep(new THREE.MeshStandardMaterial({ color: 0x3e5078, roughness: 0.95, map: stoneTex })),
      roof: keep(new THREE.MeshStandardMaterial({ color: 0x223a68, roughness: 0.55, metalness: 0.25 })),
      gold: keep(new THREE.MeshStandardMaterial({ color: 0xe2c98e, roughness: 0.3, metalness: 0.9, emissive: 0x6b4d12, emissiveIntensity: 0.9 })),
      windowA: keep(new THREE.MeshBasicMaterial({ color: 0xffd58a })),   // tinted each frame in frame()
      windowB: keep(new THREE.MeshBasicMaterial({ color: 0xffbf66 })),
      gate: keep(new THREE.MeshBasicMaterial({ color: 0xffe6ad })),
      path: keep(new THREE.MeshStandardMaterial({ color: 0x6f80a6, roughness: 0.7, metalness: 0.05, map: stoneTex })),
      ground: keep(new THREE.MeshStandardMaterial({ color: 0x5c7098, roughness: 0.28, metalness: 0.4, map: tileTex, transparent: true, opacity: 0.62 })),
      tree: keep(new THREE.MeshStandardMaterial({ color: 0x0c1d33, roughness: 1, flatShading: true })),
      hedge: keep(new THREE.MeshStandardMaterial({ color: 0x10283a, roughness: 1 })),
      robe: keep(new THREE.MeshStandardMaterial({ color: 0xb4c8f0, roughness: 0.58, metalness: 0.03, emissive: 0x1d3468, emissiveIntensity: 0.3 })),
      skin: keep(new THREE.MeshStandardMaterial({ color: 0xcfdcf8, roughness: 0.5, emissive: 0x22386e, emissiveIntensity: 0.3 })),
      hair: keep(new THREE.MeshStandardMaterial({ color: 0xdfe4f2, roughness: 0.65, emissive: 0x33426c, emissiveIntensity: 0.28 })),
      feather: keep(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.03, emissive: 0x1c2f60, emissiveIntensity: 0.3, side: THREE.DoubleSide, vertexColors: true })),
      orb: keep(new THREE.MeshBasicMaterial({ color: 0xfff1c4 })),
      lamp: keep(new THREE.MeshBasicMaterial({ color: 0xffdfa0 })),
    };
    M.gate.color.setRGB(3.0, 2.5, 1.6); M.orb.color.setRGB(3.2, 2.7, 1.8); M.lamp.color.setRGB(2.8, 2.1, 1.1);
    var geos = {};
    var G = function (name, make) { return geos[name] || (geos[name] = keep(make())); };

    function mesh(geo, mat, x, y, z, cast) {
      var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = cast !== false; m.receiveShadow = true; return m;
    }
    function box(w, h, d, mat, x, y, z) { return mesh(keep(new THREE.BoxGeometry(w, h, d)), mat, x, y, z); }
    function glow(color, size, x, y, z, opacity) {
      var mat = keep(new THREE.SpriteMaterial({ map: glowTex, color: color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: opacity == null ? 1 : opacity, fog: false }));
      var s = new THREE.Sprite(mat); s.scale.set(size, size, 1); s.position.set(x, y, z); return s;
    }

    // ---------------------------------------------------------------- sky, stars, moon
    var sky = new THREE.Mesh(keep(new THREE.SphereGeometry(520, 32, 20)), keep(new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x02060f) }, mid: { value: new THREE.Color(0x0b1d42) }, low: { value: new THREE.Color(0x1d3f7a) } },
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = mix(low, mid, smoothstep(-0.02, 0.22, h)); c = mix(c, top, smoothstep(0.18, 0.75, h)); gl_FragColor = vec4(c, 1.0); }"
    })));
    scene.add(sky);

    var starLayers = [];
    [[1700, 1.5], [460, 2.4], [110, 3.6]].forEach(function (cfg, k) {
      var n = cfg[0], pos = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) {
        var u = rnd(), v = 0.03 + rnd() * 0.97, th = u * Math.PI * 2, y = v, r = Math.sqrt(1 - y * y);
        pos[i * 3] = Math.cos(th) * r * 480; pos[i * 3 + 1] = y * 480; pos[i * 3 + 2] = Math.sin(th) * r * 480;
      }
      var g = keep(new THREE.BufferGeometry()); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      var m = keep(new THREE.PointsMaterial({ color: k === 2 ? 0xfff2d0 : 0xdbe7ff, size: cfg[1], sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false, fog: false, map: glowTex, blending: THREE.AdditiveBlending }));
      var p = new THREE.Points(g, m); p.userData.base = cfg[1]; scene.add(p); starLayers.push(p);
    });
    scene.add(glow(0xbfd6ff, 150, -150, 150, -330, 0.5));
    scene.add(glow(0xf4f7ff, 34, -150, 150, -330, 1));

    // slow fan of light behind the palace
    var rays = (function () {
      var n = 22, pos = [];
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2 + rnd() * 0.12, w = 0.035 + rnd() * 0.05, R = 150;
        pos.push(0, 0, 0, Math.cos(a - w) * R, Math.sin(a - w) * R, 0, Math.cos(a + w) * R, Math.sin(a + w) * R, 0);
      }
      var g = keep(new THREE.BufferGeometry()); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      var m = new THREE.Mesh(g, keep(new THREE.MeshBasicMaterial({ color: 0x4f7fe0, transparent: true, opacity: 0.013, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })));
      m.position.set(0, 12, -64); return m;
    })();
    scene.add(rays);
    scene.add(glow(0x5f8fe8, 130, 0, 12, -62, 0.4));

    // ---------------------------------------------------------------- lights
    scene.add(new THREE.HemisphereLight(0x6f93d8, 0x0a1220, 0.7));
    var moon = new THREE.DirectionalLight(0xa9c4ff, 1.7);
    moon.position.set(-34, 46, 22); moon.target.position.set(0, 0, -14);
    moon.castShadow = true;
    moon.shadow.mapSize.set(opts.narrow ? 1024 : 2048, opts.narrow ? 1024 : 2048);
    moon.shadow.camera.left = -46; moon.shadow.camera.right = 46; moon.shadow.camera.top = 46; moon.shadow.camera.bottom = -30;
    moon.shadow.camera.near = 1; moon.shadow.camera.far = 150; moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.04;
    scene.add(moon); scene.add(moon.target);
    var GATE_LIGHT = 300;
    var gateLight = new THREE.PointLight(0xffc878, GATE_LIGHT, 80, 2); gateLight.position.set(0, 3.4, -30.5); scene.add(gateLight);

    // ---------------------------------------------------------------- the palace
    var windowShape = (function () { var s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0.5, 1); s.absarc(0, 1, 0.5, 0, Math.PI, false); s.lineTo(-0.5, 0); return s; })();
    var flickers = [];

    function buildPalace(isReflection) {
      var g = new THREE.Group();
      g.scale.setScalar(0.85);
      var Z = -47;
      var add = function (o) { if (isReflection) { o.castShadow = false; o.receiveShadow = false; } g.add(o); return o; };
      var merlons = [], wins = { a: [], b: [] };
      var battlement = function (x0, x1, y, z) { for (var x = x0 + 0.35; x <= x1 - 0.3; x += 1.1) merlons.push([x, y + 0.35, z]); };
      var rowOfWindows = function (x0, x1, n, y, z, w, h, kind) { for (var i = 0; i < n; i++) wins[kind || "a"].push([x0 + (x1 - x0) * (n === 1 ? 0.5 : i / (n - 1)), y, z, w, h]); };

      // main range, upper hall, gatehouse
      add(box(30, 10, 10, M.wall, 0, 5, Z));
      add(box(30.6, 0.35, 10.6, M.wallDark, 0, 10.15, Z));
      battlement(-15, 15, 10.3, Z + 5); battlement(-15, 15, 10.3, Z - 5);
      add(box(14, 7.5, 8.4, M.wall, 0, 13.75, Z - 0.4));
      add(box(14.6, 0.35, 9, M.wallDark, 0, 17.6, Z - 0.4));
      battlement(-7, 7, 17.75, Z + 3.8);
      var hallRoof = add(mesh(keep(new THREE.ConeGeometry(7.6, 6.5, 4)), M.roof, 0, 21, Z - 0.4)); hallRoof.rotation.y = Math.PI / 4; hallRoof.scale.set(1, 1, 0.62);
      add(mesh(G("finial", function () { return new THREE.SphereGeometry(0.32, 12, 10); }), M.gold, 0, 24.5, Z - 0.4));
      add(box(8, 14, 3.4, M.wall, 0, 7, Z + 6.2));
      add(box(8.6, 0.4, 4, M.wallDark, 0, 14.2, Z + 6.2));
      battlement(-4, 4, 14.4, Z + 7.9); battlement(-4, 4, 14.4, Z + 4.5);
      // the lit gate
      var arch = new THREE.Shape(); arch.moveTo(-1.9, 0); arch.lineTo(1.9, 0); arch.lineTo(1.9, 4.2); arch.absarc(0, 4.2, 1.9, 0, Math.PI, false); arch.lineTo(-1.9, 0);
      add(mesh(G("arch", function () { return new THREE.ShapeGeometry(arch, 20); }), M.gate, 0, 0.6, Z + 7.92, false));
      var frame = add(mesh(G("archFrame", function () { return new THREE.TorusGeometry(2.15, 0.2, 8, 24, Math.PI); }), M.gold, 0, 4.8, Z + 7.95, false));
      frame.scale.set(1, 1, 0.6);
      rowOfWindows(-2.4, 2.4, 3, 9.3, Z + 7.93, 0.8, 1.5, "b");
      rowOfWindows(-12.4, -5.4, 5, 2.2, Z + 5.03, 0.75, 1.5); rowOfWindows(5.4, 12.4, 5, 2.2, Z + 5.03, 0.75, 1.5);
      rowOfWindows(-12.4, -5.4, 5, 6.1, Z + 5.03, 0.75, 1.7, "b"); rowOfWindows(5.4, 12.4, 5, 6.1, Z + 5.03, 0.75, 1.7, "b");
      rowOfWindows(-5.2, 5.2, 5, 12, Z + 3.83, 1.0, 3.2);
      // steps up to the gate
      for (var s = 0; s < 5; s++) add(box(9 + s * 1.3, 0.24, 1.1, M.path, 0, 0.6 - s * 0.12 - 0.12, Z + 8.5 + s * 1.05));

      // round towers with conical roofs
      var tower = function (x, z, r, h, roofH, winRows) {
        add(mesh(keep(new THREE.CylinderGeometry(r, r * 1.06, h, 28)), M.wall, x, h / 2, z));
        add(mesh(keep(new THREE.CylinderGeometry(r * 1.16, r * 1.02, 0.7, 28)), M.wallDark, x, h + 0.2, z));
        for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2; merlons.push([x + Math.cos(a) * r * 1.08, h + 0.85, z + Math.sin(a) * r * 1.08]); }
        add(mesh(keep(new THREE.ConeGeometry(r * 1.12, roofH, 28)), M.roof, x, h + 0.6 + roofH / 2, z));
        add(mesh(G("finial", null), M.gold, x, h + 0.75 + roofH, z));
        add(mesh(keep(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6)), M.gold, x, h + 1.5 + roofH, z, false));
        for (var k = 0; k < winRows; k++) wins[k % 2 ? "b" : "a"].push([x, h * 0.34 + k * (h * 0.5 / Math.max(1, winRows - 1 || 1)), z + r * 1.01, 0.55, 1.15]);
      };
      tower(-15, Z + 5, 2.6, 16, 6.2, 3); tower(15, Z + 5, 2.6, 16, 6.2, 3);
      tower(-15, Z - 5, 2.4, 19, 6.5, 0); tower(15, Z - 5, 2.4, 19, 6.5, 0);
      tower(-4.9, Z + 7.6, 1.5, 18.5, 5.2, 4); tower(4.9, Z + 7.6, 1.5, 18.5, 5.2, 4);
      tower(-7, Z - 3, 1.7, 24, 7, 0); tower(7, Z - 3, 1.7, 24, 7, 0);
      // curtain walls and outer towers
      [-1, 1].forEach(function (sx) {
        add(box(15, 6.5, 2.2, M.wallDark, sx * 24.5, 3.25, Z + 3.4));
        battlement(sx * 24.5 - 7.5, sx * 24.5 + 7.5, 6.5, Z + 4.4);
        tower(sx * 33, Z + 3.6, 2.2, 12, 5, 2);
        rowOfWindows(sx * 20, sx * 29, 4, 2.6, Z + 4.52, 0.5, 1.0, "b");
      });

      var mer = new THREE.InstancedMesh(G("merlon", function () { return new THREE.BoxGeometry(0.55, 0.7, 0.55); }), M.wallDark, merlons.length);
      var o = new THREE.Object3D();
      merlons.forEach(function (p, i) { o.position.set(p[0], p[1], p[2]); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); mer.setMatrixAt(i, o.matrix); });
      mer.castShadow = !isReflection; add(mer);
      ["a", "b"].forEach(function (kind) {
        var list = wins[kind]; if (!list.length) return;
        var im = new THREE.InstancedMesh(G("window", function () { return new THREE.ShapeGeometry(windowShape, 10); }), kind === "a" ? M.windowA : M.windowB, list.length);
        list.forEach(function (w, i) { o.position.set(w[0], w[1], w[2]); o.rotation.set(0, 0, 0); o.scale.set(w[3], w[4] / 1.5, 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
        im.castShadow = false; im.receiveShadow = false; g.add(im);
      });
      g.add(glow(0xffb650, 15, 0, 3.4, Z + 9.2, isReflection ? 0.35 : 0.6));
      g.add(glow(0xffd590, 5, 0, 3.0, Z + 8.4, 0.7));
      return g;
    }
    G("finial", function () { return new THREE.SphereGeometry(0.32, 12, 10); });
    scene.add(buildPalace(false));
    var mirror = buildPalace(true); mirror.scale.y = -0.85; scene.add(mirror);
    flickers.push(M.windowA, M.windowB);

    // ---------------------------------------------------------------- ground, causeway, gardens
    var ground = mesh(keep(new THREE.PlaneGeometry(440, 440)), M.ground, 0, 0, -60, false); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    scene.add(box(7.4, 0.16, 58, M.path, 0, 0.08, -5));
    var spill = new THREE.Mesh(keep(new THREE.PlaneGeometry(9, 30)), keep(new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffb860, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })));
    spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.19, -24); scene.add(spill);
    var posts = [], lamps = [];
    for (var pz = 22; pz >= -32; pz -= 1.6) { posts.push([-3.9, pz], [3.9, pz]); }
    var postMesh = new THREE.InstancedMesh(keep(new THREE.CylinderGeometry(0.1, 0.13, 0.9, 8)), M.path, posts.length);
    var dummy = new THREE.Object3D();
    posts.forEach(function (p, i) { dummy.position.set(p[0], 0.6, p[1]); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); postMesh.setMatrixAt(i, dummy.matrix); });
    postMesh.castShadow = true; scene.add(postMesh);
    [-1, 1].forEach(function (sx) {
      scene.add(box(0.22, 0.16, 55, M.path, sx * 3.9, 1.1, -5));
      [-2, -11, -20, -29].forEach(function (lz) {
        scene.add(mesh(keep(new THREE.CylinderGeometry(0.07, 0.1, 3.1, 8)), M.wallDark, sx * 4.25, 1.55, lz));
        scene.add(mesh(G("lamp", function () { return new THREE.SphereGeometry(0.2, 14, 10); }), M.lamp, sx * 4.25, 3.25, lz, false));
        var gl = glow(0xffc46a, 2.3, sx * 4.25, 3.25, lz, 0.85); scene.add(gl); lamps.push(gl);
        var rf = glow(0xffc46a, 2.0, sx * 4.25, -3.2, lz, 0.2); scene.add(rf);
      });
    });
    var bushes = [];
    for (var bz = 1; bz >= -31; bz -= 1.25) { bushes.push([-5.3 - rnd() * 0.5, bz, 0.55 + rnd() * 0.3], [5.3 + rnd() * 0.5, bz, 0.55 + rnd() * 0.3]); }
    var bushMesh = new THREE.InstancedMesh(keep(new THREE.IcosahedronGeometry(1, 1)), M.hedge, bushes.length);
    bushes.forEach(function (b, i) { dummy.position.set(b[0], b[2] * 0.75, b[1]); dummy.rotation.set(0, rnd() * 6, 0); dummy.scale.set(b[2] * 1.25, b[2], b[2] * 1.25); dummy.updateMatrix(); bushMesh.setMatrixAt(i, dummy.matrix); });
    bushMesh.castShadow = true; bushMesh.receiveShadow = true; scene.add(bushMesh);
    // trees and far hills
    var trees = [];
    for (var ti = 0; ti < 150; ti++) {
      var side = rnd() < 0.5 ? -1 : 1, tx = side * (11 + Math.pow(rnd(), 0.7) * 75), tz = -6 - rnd() * 80;
      if (Math.abs(tx) < 36 && tz < -26) continue;
      if (Math.abs(tx) < 22 && tz > -14) continue;
      trees.push([tx, tz, 1.6 + rnd() * 3.4, 0.7 + rnd() * 0.7]);
    }
    var treeMesh = new THREE.InstancedMesh(keep(new THREE.ConeGeometry(1, 2.4, 7)), M.tree, trees.length);
    trees.forEach(function (t, i) { dummy.position.set(t[0], t[2] * 1.2, t[1]); dummy.rotation.set(0, rnd() * 6, 0); dummy.scale.set(t[2] * t[3] * 0.62, t[2], t[2] * t[3] * 0.62); dummy.updateMatrix(); treeMesh.setMatrixAt(i, dummy.matrix); });
    treeMesh.castShadow = true; scene.add(treeMesh);
    for (var hi = 0; hi < 9; hi++) {
      var hill = mesh(keep(new THREE.ConeGeometry(60 + rnd() * 50, 26 + rnd() * 30, 5)), M.tree, -260 + hi * 62 + rnd() * 20, 8, -190 - rnd() * 60, false);
      hill.receiveShadow = false; scene.add(hill);
    }

    // ---------------------------------------------------------------- the two angels
    var featherGeo = keep((function () {
      var seg = 7, pos = [], col = [], idx = [];
      for (var k = 0; k <= seg; k++) {
        var t = k / seg, w = k === seg ? 0 : 0.15 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + t * 0.94)), 0.7) * (1 - 0.35 * t);
        var zc = 0.04 * Math.sin(Math.PI * t);            // the shaft stands a little proud of the vanes
        pos.push(-w, t, 0, 0, t, zc, w, t, 0);
        var e = 0.5 + 0.22 * t;
        col.push(e, e, e, 1, 1, 1, e * 0.9, e * 0.9, e * 0.9);
        if (k < seg) { var v = k * 3; idx.push(v, v + 1, v + 3, v + 1, v + 4, v + 3, v + 1, v + 2, v + 4, v + 2, v + 5, v + 4); }
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals(); return g;
    })());
    var robeGeo = keep((function () {
      var pts = [[0, 0], [1.3, 0], [1.22, 0.22], [0.95, 1.1], [0.7, 2.2], [0.52, 3.0], [0.55, 3.45], [0.62, 3.85], [0.5, 4.14], [0.2, 4.34], [0, 4.4]]
        .map(function (p) { return new THREE.Vector2(p[0], p[1]); });
      var g = new THREE.LatheGeometry(new THREE.SplineCurve(pts).getPoints(36), 56);
      var pos = g.attributes.position;
      for (var i = 0; i < pos.count; i++) {      // folds of cloth, deepest at the hem
        var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(z, x), r = Math.sqrt(x * x + z * z);
        var k = Math.pow(Math.max(0, 1 - y / 3.3), 0.8);
        var f = 1 + k * (0.075 * Math.sin(a * 11 + y * 1.4) + 0.035 * Math.sin(a * 23 + y * 2.3));
        pos.setX(i, Math.cos(a) * r * f); pos.setZ(i, Math.sin(a) * r * f);
      }
      g.computeVertexNormals(); return g;
    })());
    var up = new THREE.Vector3(0, 1, 0);
    function limb(a, b, ra, rb, mat) {
      var d = new THREE.Vector3().subVectors(b, a), len = d.length();
      var m = mesh(keep(new THREE.CylinderGeometry(rb, ra, len, 14)), mat, 0, 0, 0);
      m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(up, d.normalize()); return m;
    }
    function buildWing(zOff, scale, tilt) {
      var grp = new THREE.Group(); grp.position.set(-0.32, 3.95, zOff); grp.rotation.z = tilt; grp.scale.setScalar(scale);
      var layers = [[30, 3.7, 0.0, 0.9], [24, 2.55, 0.05, 1.0], [18, 1.6, 0.1, 1.08], [12, 0.9, 0.15, 1.14]];
      var total = layers.reduce(function (n, l) { return n + l[0]; }, 0);
      var im = new THREE.InstancedMesh(featherGeo, M.feather, total);
      var o = new THREE.Object3D(), col = new THREE.Color(), idx = 0, sgn = zOff >= 0 ? 1 : -1;
      layers.forEach(function (L, li) {
        for (var i = 0; i < L[0]; i++) {
          var t = i / (L[0] - 1);
          var th = (-30 + t * 112) * Math.PI / 180;                 // from back-and-down round to nearly straight up
          var len = L[1] * (0.42 + 0.58 * Math.pow(Math.sin(Math.PI * (0.12 + 0.8 * t)), 0.8)) * (0.98 + rnd() * 0.04);
          var dx = -Math.cos(th), dy = Math.sin(th);
          var root = 0.25 + 0.55 * t;                               // roots spread along the wing's arm
          o.position.set(-Math.cos(th * 0.55) * root, Math.sin(th * 0.55) * root * 1.15, sgn * (L[2] + rnd() * 0.02));
          o.rotation.set(0, (rnd() - 0.5) * 0.22, Math.atan2(dy, dx) - Math.PI / 2);
          o.scale.set(1.75 + li * 0.3, len, 1);
          o.updateMatrix(); im.setMatrixAt(idx, o.matrix);
          var shade = L[3] * (0.84 + 0.16 * (1 - t)) * (0.88 + rnd() * 0.2);
          col.setRGB(0.66 * shade, 0.76 * shade, Math.min(1, 0.98 * shade)); im.setColorAt(idx, col);
          idx++;
        }
      });
      im.instanceColor.needsUpdate = true; im.castShadow = true; grp.add(im);
      return grp;
    }
    var angels = [];
    function buildAngel() {
      var a = new THREE.Group();
      a.add(mesh(keep(new THREE.CylinderGeometry(1.7, 1.9, 0.5, 40)), M.path, 0, 0.25, 0));
      var body = new THREE.Group(); body.position.y = 0.5; a.add(body);
      body.add(mesh(robeGeo, M.robe, 0, 0, 0));
      var sash = mesh(keep(new THREE.TorusGeometry(0.55, 0.045, 8, 40)), M.gold, 0, 3.02, 0, false); sash.rotation.x = Math.PI / 2; body.add(sash);
      body.add(mesh(keep(new THREE.CylinderGeometry(0.13, 0.17, 0.3, 14)), M.skin, 0.03, 4.42, 0));
      var head = mesh(keep(new THREE.SphereGeometry(0.37, 28, 22)), M.skin, 0.06, 4.84, 0); head.scale.set(0.95, 1.08, 0.9); body.add(head);
      var hair = mesh(keep(new THREE.SphereGeometry(0.4, 24, 18)), M.hair, -0.06, 4.9, 0); hair.scale.set(1, 1.05, 0.98); body.add(hair);
      var bun = mesh(keep(new THREE.SphereGeometry(0.3, 18, 14)), M.hair, -0.3, 4.55, 0); bun.scale.set(0.8, 1.5, 0.9); body.add(bun);
      var halo = mesh(keep(new THREE.TorusGeometry(0.46, 0.028, 8, 48)), M.gold, 0.02, 5.46, 0, false); halo.rotation.x = Math.PI / 2 - 0.18; body.add(halo);
      body.add(glow(0xffd98a, 2.2, 0.02, 5.46, 0, 0.5));
      [-1, 1].forEach(function (s) {
        var sh = new THREE.Vector3(0.06, 4.0, s * 0.5), el = new THREE.Vector3(0.78, 3.42, s * 0.44), hd = new THREE.Vector3(1.46, 3.84, s * 0.15);
        body.add(limb(sh, el, 0.19, 0.19, M.robe)); body.add(limb(el, hd, 0.19, 0.22, M.robe));
        body.add(mesh(G("joint", function () { return new THREE.SphereGeometry(0.2, 14, 10); }), M.robe, el.x, el.y, el.z));
        body.add(mesh(G("hand", function () { return new THREE.SphereGeometry(0.12, 14, 10); }), M.skin, 1.56, 3.88, s * 0.13));
      });
      var orb = mesh(keep(new THREE.SphereGeometry(0.21, 24, 18)), M.orb, 1.66, 4.06, 0, false); body.add(orb);
      var g1 = glow(0xffc864, 4.2, 1.66, 4.06, 0.05, 0.8), g2 = glow(0xfff0c8, 1.2, 1.66, 4.06, 0.1, 0.9); body.add(g1); body.add(g2);
      var light = new THREE.PointLight(0xffc670, 42, 24, 2); light.position.set(1.75, 4.2, 0.35); body.add(light);
      var wFar = buildWing(-0.34, 0.95, 0.16), wNear = buildWing(0.34, 1, 0); body.add(wFar); body.add(wNear);
      angels.push({ group: a, body: body, wings: [wNear, wFar], glows: [g1, g2], light: light, phase: angels.length * 1.7 });
      return a;
    }
    var left = buildAngel(), right = buildAngel();
    right.scale.x = -1;
    scene.add(left); scene.add(right);

    // drifting motes of light
    var motes = (function () {
      var n = 150, pos = new Float32Array(n * 3), seed = [];
      for (var i = 0; i < n; i++) { seed.push([(rnd() - 0.5) * 30, rnd() * 9, 12 - rnd() * 34, 0.25 + rnd() * 0.5, rnd() * 6.28]); }
      var g = keep(new THREE.BufferGeometry()); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      var m = keep(new THREE.PointsMaterial({ color: 0xffd98a, size: 0.16, map: glowTex, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
      var p = new THREE.Points(g, m); p.userData.seed = seed; return p;
    })();
    scene.add(motes);

    // ---------------------------------------------------------------- camera, layout, frame
    var st = { w: 1, h: 1, narrow: !!opts.narrow, baseZ: 18, run: true, raf: 0, ft: 0, t0: performance.now(), px: 0, py: 0, tx: 0, ty: 0, slow: 0 };
    var ANGEL_Z = 6;
    function layout() {
      var rect = host.getBoundingClientRect();
      st.w = Math.max(1, rect.width); st.h = Math.max(1, rect.height);
      var area = st.w * st.h, dpr = Math.min(window.devicePixelRatio || 1, area > 1.6e6 ? 1.25 : area > 8e5 ? 1.5 : 2);
      if (st.slow > 1) dpr = Math.min(dpr, 1);
      renderer.setPixelRatio(dpr); renderer.setSize(st.w, st.h, false);
      starLayers.forEach(function (p) { p.material.size = p.userData.base * dpr; });
      var aspect = st.w / st.h; camera.aspect = aspect;
      var ax = st.narrow ? 4.5 : Math.min(7.4, Math.max(5.2, aspect * 3.9)), sc = st.narrow ? 0.82 : 1;
      left.position.set(-ax, 0, ANGEL_Z); right.position.set(ax, 0, ANGEL_Z);
      left.scale.set(sc, sc, sc); right.scale.set(-sc, sc, sc);
      var half = ax + 3.1 * sc;
      st.baseZ = ANGEL_Z + Math.max(9.5, half / (Math.tan(camera.fov * Math.PI / 360) * aspect));
      camera.updateProjectionMatrix();
    }
    var target = new THREE.Vector3(0, 1.6, -30);
    function frame(now) {
      var t = (now - st.t0) / 1000;
      var intro = reduce ? 1 : Math.min(1, t / 3.4), e = 1 - Math.pow(1 - intro, 3);
      st.px += (st.tx - st.px) * 0.045; st.py += (st.ty - st.py) * 0.045;
      var sway = reduce ? 0 : Math.sin(t * 0.21) * 0.35;
      camera.position.set(st.px * 1.5 + sway, 4.5 + (1 - e) * 2.6 + st.py * 0.5 + (reduce ? 0 : Math.sin(t * 0.33) * 0.08), st.baseZ + (1 - e) * 11);
      camera.lookAt(target.x + st.px * 0.6, target.y - (1 - e) * 1.2, target.z);
      rays.rotation.z = t * 0.018;
      starLayers.forEach(function (p, i) { p.material.opacity = 0.62 + 0.3 * Math.sin(t * (0.5 + i * 0.37) + i * 2.1); });
      M.windowA.color.setRGB(1.7, 1.38 + 0.05 * Math.sin(t * 2.3), 0.86 + 0.06 * Math.sin(t * 3.1));
      M.windowB.color.setRGB(1.6, 1.16 + 0.05 * Math.sin(t * 1.7 + 1), 0.6 + 0.06 * Math.sin(t * 2.6 + 2));
      gateLight.intensity = GATE_LIGHT * (0.93 + 0.07 * Math.sin(t * 1.3));
      lamps.forEach(function (g, i) { g.material.opacity = 0.8 + 0.12 * Math.sin(t * 2.1 + i * 1.9); });
      angels.forEach(function (a) {
        var s = Math.sin(t * 0.8 + a.phase), p = 0.5 + 0.5 * Math.sin(t * 1.25 + a.phase);
        a.body.position.y = 0.5 + s * 0.035;
        a.wings[0].rotation.z = s * 0.045; a.wings[1].rotation.z = 0.16 + Math.sin(t * 0.8 + a.phase + 0.5) * 0.05;
        a.light.intensity = 36 + 16 * p;
        a.glows[0].material.opacity = 0.66 + 0.18 * p; var gs = 4 + 0.6 * p; a.glows[0].scale.set(gs, gs, 1);
      });
      var mp = motes.geometry.attributes.position, sd = motes.userData.seed;
      for (var i = 0; i < sd.length; i++) {
        var q = sd[i], y = (q[1] + t * q[3] * 0.35) % 9.5;
        mp.setXYZ(i, q[0] + Math.sin(t * 0.4 + q[4]) * 0.7, 0.3 + y, q[2] + Math.cos(t * 0.3 + q[4]) * 0.5);
      }
      mp.needsUpdate = true;
      renderer.render(scene, camera);
    }
    var frames = 0;
    function loop(now) {
      if (!st.run) return;
      var a = performance.now(); frame(now); st.ft = st.ft * 0.9 + (performance.now() - a) * 0.1;
      // a slow device gets a lighter picture: fewer pixels first, then no shadows
      if (++frames === 90 && st.ft > 24 && st.slow < 2) { st.slow++; frames = 0; if (st.slow === 2) { renderer.shadowMap.enabled = false; moon.castShadow = false; } layout(); }
      st.raf = requestAnimationFrame(loop);
    }
    var rt = 0;
    var onResize = function () { clearTimeout(rt); rt = setTimeout(function () { layout(); if (reduce || !st.run) frame(performance.now()); }, 120); };
    var onVis = function () { if (document.hidden) { st.run = false; cancelAnimationFrame(st.raf); } else if (!st.run && !reduce) { st.run = true; st.raf = requestAnimationFrame(loop); } };
    var onMove = function (ev) { st.tx = (ev.clientX / window.innerWidth - 0.5) * 2; st.ty = -(ev.clientY / window.innerHeight - 0.5) * 2; };
    var lost = false;
    var onLost = function (ev) { ev.preventDefault(); lost = true; st.run = false; cancelAnimationFrame(st.raf); if (opts.onFail) opts.onFail(); };
    canvas.addEventListener("webglcontextlost", onLost);
    window.addEventListener("resize", onResize); document.addEventListener("visibilitychange", onVis);
    if (!reduce) window.addEventListener("pointermove", onMove, { passive: true });
    layout();
    if (reduce) frame(performance.now()); else st.raf = requestAnimationFrame(loop);

    return {
      get frameMs() { return st.ft; },
      // draws one frame as it looks `seconds` after opening (used when checking the picture)
      renderAt: function (seconds) { frame(st.t0 + seconds * 1000); },
      setNarrow: function (n) { if (st.narrow !== !!n) { st.narrow = !!n; layout(); if (reduce) frame(performance.now()); } },
      destroy: function () {
        st.run = false; cancelAnimationFrame(st.raf); clearTimeout(rt);
        window.removeEventListener("resize", onResize); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("webglcontextlost", onLost);
        disposables.forEach(function (d) { try { d.dispose(); } catch (e) {} });
        try { renderer.dispose(); if (!lost) renderer.forceContextLoss(); } catch (e) {}
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  }

  window.BrialGate3D = { supported: supported, mount: mount };
})();

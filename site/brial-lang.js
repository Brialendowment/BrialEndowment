// ============================================================
// BRIAL LANG — EN/ID overlay. Exact-match text-node dictionary;
// React re-renders are re-translated by a MutationObserver.
// Founder-entered content (journals, names) is never touched.
// ============================================================
(function () {
  "use strict";
  var PAIRS = [
    ["A perpetual", "Dana abadi"], ["endowment.", "yang kekal."],
    ["A perpetual endowment.", "Dana abadi yang kekal."],
    ["The Mission", "Misi"], ["The Pillars", "Pilar"],
    ["More pillars will rise \u2014 the corpus grows, the giving widens.", "Pilar-pilar baru akan berdiri \u2014 pokok dana bertumbuh, kebaikan meluas."],
    ["perpetual endowment", "dana abadi"],
    ["The Brial Endowment is a ", "The Brial Endowment adalah "],
    [" \u2014 capital held in trust across generations. Its principal is never spent; its returns are given, forever, with zero administrative overhead and every movement recorded on a public ledger. It is, at heart, an investment in the next generation: scholarships paid directly to students today, and from the same enduring corpus, the pillars of tomorrow \u2014 houses of worship, libraries, groves, clean water, and the institutions a community needs to endure.", " \u2014 modal yang diamanahkan lintas generasi. Pokoknya tidak pernah dibelanjakan; hasilnya diberikan, selamanya, tanpa biaya administrasi dan setiap pergerakan tercatat di buku besar publik. Pada intinya, ini investasi bagi generasi berikutnya: beasiswa dibayar langsung kepada mahasiswa hari ini, dan dari pokok yang sama, pilar-pilar masa depan \u2014 masjid, pustaka, kebun, air bersih, dan lembaga yang dibutuhkan sebuah komunitas untuk bertahan."],
    ["Scholarships", "Beasiswa"], ["Houses of Worship", "Rumah Ibadah"], ["The Library", "Pustaka"], ["Food & Land", "Pangan & Lahan"], ["Clean Water", "Air Bersih"], ["Hospitals", "Rumah Sakit"], ["Schools", "Sekolah"], ["Livestock & Enterprise", "Ternak & Usaha"], ["Sustainable Infrastructure", "Prasarana Berkelanjutan"],
    ["Four-year degrees, fully funded \u2014 tuition paid directly, so a scholar answers to no one but their books.", "Kuliah empat tahun, didanai penuh \u2014 uang kuliah dibayar langsung, agar penerima hanya bertanggung jawab pada ilmunya."],
    ["Wells and water systems \u2014 the simplest gift that changes everything for a village, drawn fresh for generations.", "Sumur dan sistem air \u2014 pemberian paling sederhana yang mengubah segalanya bagi sebuah desa, mengalir segar lintas generasi."],
    ["Herds and small enterprise placed as productive capital \u2014 assets that multiply, feed a family, and fund the gift again.", "Ternak dan usaha kecil sebagai modal produktif \u2014 aset yang berkembang biak, memberi makan keluarga, dan mendanai kebaikan berikutnya."],
    ["Bridges, power and public works \u2014 the quiet foundations that let a community stand, trade, and endure on its own.", "Jembatan, listrik, dan fasilitas umum \u2014 fondasi sunyi yang membuat komunitas berdiri, berdagang, dan bertahan mandiri."],
    ["Apply for a scholarship \u2192", "Ajukan beasiswa \u2192"], ["Meet our scholars \u2192", "Kenali para penerima \u2192"], ["View the mosque project \u2192", "Lihat proyek masjid \u2192"], ["Enter the library \u2192", "Masuk ke pustaka \u2192"], ["Trees for life \u2192", "Pohon untuk kehidupan \u2192"], ["Follow the water \u2192", "Ikuti airnya \u2192"], ["Walk the wards \u2192", "Susuri bangsalnya \u2192"], ["Visit the classrooms \u2192", "Kunjungi kelasnya \u2192"], ["Meet the herds \u2192", "Kenali ternaknya \u2192"], ["Walk the works \u2192", "Susuri karyanya \u2192"],
    ["ACTIVE", "AKTIF"], ["COMING SOON", "SEGERA"],
    ["Transparency", "Transparansi"], ["The Vision", "Visi"], ["Treasury", "Kas"], ["Open Ledger", "Buku Besar"],
    ["Return to the Endowment", "\u2190 Kembali ke Endowment"], ["\u2190 Return to the Endowment", "\u2190 Kembali ke Endowment"],
    ["Learn more about our partner \u2197", "Kenali mitra kami \u2197"],
    ["Make a bequest", "Berikan wakaf"],
    ["Programme updates \u2197", "Kabar programme \u2197"],
    ["Share \u2197", "Bagikan \u2197"], ["Link copied \u2713", "Tautan tersalin \u2713"],
    ["\u00a7 Programme journal", "\u00a7 Jurnal programme"], ["\u00a7 How the programme works", "\u00a7 Cara programme berjalan"], ["\u00a7 Field notes", "\u00a7 Catatan lapangan"],
    ["Word from the groves.", "Kabar dari kebun."], ["Word from the site.", "Kabar dari lokasi."], ["Word from the wells.", "Kabar dari sumur."], ["Word from the wards.", "Kabar dari bangsal."], ["Word from the classrooms.", "Kabar dari ruang kelas."], ["Word from the paddocks.", "Kabar dari kandang."], ["Word from the works.", "Kabar dari lapangan."],
    ["The Open Ledger.", "Buku Besar Terbuka."],
    ["\u00a7 Proof of giving", "\u00a7 Bukti pemberian"],
    ["Every grant the endowment has made \u2014 dated, named, and totalled live from the public database. Nothing is withheld for overhead.", "Setiap hibah yang pernah disalurkan \u2014 bertanggal, bernama, dan dijumlahkan langsung dari basis data publik. Tidak ada yang dipotong untuk biaya operasional."],
    ["What is given is written; what is written is kept.", "Yang diberikan tercatat; yang tercatat terjaga."],
    ["Add to the ledger", "Tambahkan ke buku besar"],
    ["Meet the scholars \u2192", "Kenali para penerima \u2192"],
    ["Total distributed \u00b7 all pillars", "Total tersalurkan \u00b7 semua pilar"],
    ["Paid directly to scholars", "Dibayar langsung ke penerima"],
    ["Meet the people", "Kenali orang-orang"],
    ["who build with us.", "yang membangun bersama kami."], ["who bring it home.", "yang mengalirkannya pulang."], ["who heal with us.", "yang menyembuhkan bersama kami."], ["who learn with us.", "yang belajar bersama kami."], ["who tend the gift.", "yang merawat amanah itu."], ["who build to endure.", "yang membangun untuk bertahan."],
    ["Raised together", "Dibangun bersama"], ["In the soil today", "Tertanam hari ini"], ["Flowing today", "Mengalir hari ini"], ["Care today", "Melayani hari ini"], ["In session today", "Belajar hari ini"], ["Working today", "Bekerja hari ini"], ["Standing today", "Berdiri hari ini"]
  ];
  var EN2ID = new Map(), ID2EN = new Map();
  PAIRS.forEach(function (p) { EN2ID.set(p[0].trim(), p[1].trim()); ID2EN.set(p[1].trim(), p[0].trim()); });
  var mode = "en";
  try { mode = localStorage.getItem("brial-lang") || "en"; } catch (e) {}

  function translateNode(tn) {
    var raw = tn.nodeValue;
    if (!raw) return;
    var trimmed = raw.trim();
    if (!trimmed) return;
    var map = mode === "id" ? EN2ID : ID2EN;
    var out = map.get(trimmed);
    if (out !== undefined && out !== trimmed) {
      tn.nodeValue = raw.replace(trimmed, out);
    }
  }
  function walk(root) {
    if (!root) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) translateNode(n);
  }
  var applying = false, t = 0;
  function apply() {
    if (applying) return;
    applying = true;
    try { walk(document.getElementById("root")); } catch (e) {}
    applying = false;
  }
  var mo = new MutationObserver(function () {
    if (mode === "en") return;
    clearTimeout(t);
    t = setTimeout(apply, 120);
  });

  // ----- pill UI -----
  function makePill() {
    if (document.getElementById("brial-lang-pill")) return;
    var el = document.createElement("div");
    el.id = "brial-lang-pill";
    el.style.cssText = "position:fixed;left:18px;bottom:18px;z-index:9998;display:flex;background:rgba(10,22,40,0.92);border:1px solid rgba(201,169,97,0.35);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.14em;overflow:hidden";
    el.innerHTML = "<button data-l='en' style='all:unset;cursor:pointer;padding:8px 12px'>EN</button><button data-l='id' style='all:unset;cursor:pointer;padding:8px 12px'>ID</button>";
    document.body.appendChild(el);
    var paint = function () {
      el.querySelectorAll("button").forEach(function (b) {
        var on = b.dataset.l === mode;
        b.style.color = on ? "#131A33" : "rgba(232,228,220,0.65)";
        b.style.background = on ? "#C9A961" : "transparent";
      });
    };
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.dataset.l === mode) return;
      mode = b.dataset.l;
      try { localStorage.setItem("brial-lang", mode); } catch (err) {}
      paint();
      apply();
      // components with their own EN/ID copy (scholar portal) re-render on this
      try { window.dispatchEvent(new CustomEvent("brial:lang", { detail: mode })); } catch (err) {}
    });
    paint();
  }
  function boot() {
    makePill();
    var root = document.getElementById("root");
    if (root) mo.observe(root, { childList: true, subtree: true, characterData: true });
    if (mode === "id") setTimeout(apply, 300);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

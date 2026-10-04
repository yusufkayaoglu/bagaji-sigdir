import { asset } from "../assets.js";
export function createView(root, definitions) {
  root.innerHTML = `<main class="game loading" aria-label="Bagajı Sığdır">
<img class="scene" fetchpriority="high" decoding="async" src="${asset("scene-v2")}" alt="Sahilde bagajı açık turkuaz araba" draggable="false">
<header class="hud"><h1>HEPSİ SIĞAR MI?</h1><div class="progress"><div class="dots" aria-hidden="true">${"<i></i>".repeat(5)}</div><strong id="count">0 / 5</strong></div></header>
<div class="target" aria-hidden="true"><div class="target-outline"></div><span>BURAYA BIRAK</span></div>
${definitions.map((d) => `<div class="item-shadow" data-shadow="${d.id}"></div><button class="item ${d.id === "red" ? "suitcase" : ""}" data-item="${d.id}" aria-label="${d.name}. Bagaja sürükle veya Enter ile yerleştir." disabled><img src="${asset(d.image)}" alt="" draggable="false">${d.id === "flamingo" ? `<img class="flat-sprite" src="${asset("flamingo-flat-v1")}" alt="" draggable="false">` : ""}</button>`).join("")}
<button class="valve" aria-label="Flamingonun havasını indir" disabled><span aria-hidden="true">◉</span> HAVASINI İNDİR</button>
<div class="sparkles" aria-hidden="true"></div><div class="footer"><p class="instruction" role="status" aria-live="polite">Görseller yükleniyor…</p><button class="replay" hidden>Yeniden dene ↻</button><small class="stage-label">EŞYALARI BAGAJDA TOPLA</small></div>
<div class="load-error" hidden>Görseller yüklenemedi.<button onclick="location.reload()">Yeniden yükle</button></div></main>`;

  const find = (selector) => root.querySelector(selector);
  return {
    game: find(".game"),
    target: find(".target"),
    targetLabel: find(".target span"),
    instruction: find(".instruction"),
    replay: find(".replay"),
    valve: find(".valve"),
    count: find("#count"),
    title: find("h1"),
    stageLabel: find(".stage-label"),
    particles: find(".sparkles"),
    error: find(".load-error"),
    dots: [...root.querySelectorAll(".dots i")],
    images: [...root.querySelectorAll("img")],
    itemElements: new Map(
      definitions.map((d) => [
        d.id,
        {
          el: find("[data-item=" + d.id + "]"),
          shadow: find("[data-shadow=" + d.id + "]"),
        },
      ]),
    ),
  };
}
export function paintItem(item) {
  const { x, y, w, h } = item.position;
  Object.assign(item.el.style, {
    left: x + "%",
    top: y + "%",
    width: w + "%",
    height: h + "%",
  });
}
export function paintItemPosition(item) {
  item.el.style.left = item.position.x + "%";
  item.el.style.top = item.position.y + "%";
}
export function updateProgress(view, items) {
  const n = items.filter((i) => i.state === "placed").length;
  view.count.textContent = n + " / " + items.length;
  view.dots.forEach((dot, k) => dot.classList.toggle("filled", k < n));
  return n;
}

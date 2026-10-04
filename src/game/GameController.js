import { itemDefinitions } from "./data/items.js";
import {
  createView,
  paintItem,
  paintItemPosition,
  updateProgress,
} from "./ui/createView.js";
import { createAnimations } from "./effects/animations.js";
import { insideTrunk } from "./geometry.js";
import { DragController } from "./input/DragController.js";
/** Owns game state and composes input, view and animation modules. */
export function createGame(root) {
  const view = createView(root, itemDefinitions);
  const { game, target, instruction, replay, valve } = view;
  const { animateHome, animatePlacement, animateDeflation, sparkle } =
    createAnimations(view.particles);
  const items = itemDefinitions.map((d) => ({
    ...d,
    position: { ...d.home },
    state: "loading",
    ...view.itemElements.get(d.id),
  }));
  let generation = 0,
    deflated = false,
    busy = false,
    destroyed = false;
  const listeners = new AbortController();
  function home(item) {
    return deflated && item.deflatedHome ? item.deflatedHome : item.home;
  }
  function clean(item) {
    drag.release();
    item.el.classList.remove("held");
    game.classList.remove("dragging", "over-target", "too-large");
  }
  async function returnHome(item, message = "Eşyayı açık bagajın içine bırak") {
    if (item.state !== "dragging") return;
    const token = generation,
      start = { ...item.position };
    item.state = "returning";
    busy = true;
    clean(item);
    item.position = { ...home(item) };
    paintItem(item);
    try {
      await animateHome(item, start);
    } catch {
      return;
    }
    if (token !== generation) return;
    item.state = "idle";
    busy = false;
    item.shadow.classList.remove("away");
    instruction.textContent = message;
    valve.disabled = deflated;
  }
  async function place(item) {
    if (busy || !["idle", "dragging"].includes(item.state)) return;
    if (item.id === "flamingo" && !deflated) {
      instruction.textContent = "Flamingo çok büyük! Önce havasını indir";
      valve.classList.add("attention");
      if (item.state === "dragging")
        returnHome(item, "Flamingo çok büyük! Önce havasını indir");
      return;
    }
    const token = generation,
      start = { ...item.position };
    busy = true;
    item.state = "placing";
    clean(item);
    valve.disabled = true;
    item.shadow.classList.add("away");
    item.position = { ...item.slot };
    paintItem(item);
    item.el.classList.add("in-trunk");
    try {
      await animatePlacement(item, start);
    } catch {
      return;
    }
    if (token !== generation) return;
    item.state = "placed";
    item.el.disabled = true;
    item.el.setAttribute("aria-label", `${item.name} bagaja yerleşti`);
    busy = false;
    valve.disabled = deflated;
    replay.hidden = false;
    const n = updateProgress(view, items);
    instruction.textContent =
      n === items.length
        ? "Hepsi sığdı! Tatile hazırız."
        : n === items.length - 1 && !deflated
          ? "Bir tek flamingo kaldı. Havasını indir!"
          : "Tam yerine oturdu!";
    if (n === items.length - 1 && !deflated) valve.classList.add("attention");
    if (n === items.length) {
      game.classList.add("complete");
      view.title.textContent = "HEPSİ SIĞDI!";
      view.stageLabel.textContent = "BAGAJ HAZIR · İYİ TATİLLER";
    }
    sparkle(item, n === items.length);
  }

  const drag = new DragController(game, items, {
    canStart: (item) => !busy && item.state === "idle",
    onStart: (item) => {
      item.state = "dragging";
      item.el.classList.add("held");
      item.shadow.classList.add("away");
      game.classList.add("dragging", "started");
      valve.disabled = true;
      Object.assign(target.style, {
        left: item.slot.x - item.slot.w / 2 + "%",
        top: item.slot.y - item.slot.h / 2 + "%",
        width: item.slot.w + "%",
        height: item.slot.h + "%",
      });
      view.targetLabel.textContent =
        item.id === "flamingo" && !deflated ? "ÖNCE HAVASINI İNDİR" : "BURAYA";
      instruction.textContent =
        item.id === "flamingo" && !deflated
          ? "Flamingo çok büyük! Önce havasını indir"
          : "Bagajın içine bırak";
    },
    onMove: (item) => {
      paintItemPosition(item);
      game.classList.toggle("over-target", insideTrunk(item.position));
      game.classList.toggle("too-large", item.id === "flamingo" && !deflated);
    },
    onDrop: (item) =>
      insideTrunk(item.position) ? place(item) : returnHome(item),
    onCancel: (item) => returnHome(item),
    onKeyboardPlace: place,
  });
  for (const item of items) {
    paintItem(item);
    Object.assign(item.shadow.style, {
      left: item.home.x + "%",
      top: item.home.y + item.home.h * 0.43 + "%",
      width: item.home.w * 0.8 + "%",
    });
  }
  async function deflateFlamingo() {
    const item = items.find((i) => i.id === "flamingo");
    if (deflated || busy || drag.active || item.state !== "idle") return;
    const token = generation;
    busy = true;
    valve.disabled = true;
    valve.classList.remove("attention");
    item.state = "deflating";
    instruction.textContent = "Pşşş… şimdi sığacak!";
    item.el.classList.add("deflating");
    const old = { ...item.position };
    deflated = true;
    item.position = { ...home(item) };
    paintItem(item);
    try {
      await animateDeflation(item, old);
    } catch {
      return;
    }
    if (token !== generation) return;
    item.el.classList.remove("deflating");
    item.el.classList.add("deflated");
    item.state = "idle";
    busy = false;
    valve.hidden = true;
    instruction.textContent = "Şimdi flamingoyu bagaja sürükle";
  }
  function reset() {
    generation++;
    drag.release();
    for (const item of items) {
      item.animation?.cancel();
      item.state = "idle";
      item.position = { ...item.home };
      item.el.classList.remove("held", "in-trunk", "deflated", "deflating");
      item.el.disabled = false;
      item.el.setAttribute(
        "aria-label",
        `${item.name}. Bagaja sürükle veya Enter ile yerleştir.`,
      );
      item.shadow.classList.remove("away");
      paintItem(item);
    }
    busy = false;
    deflated = false;
    game.classList.remove(
      "dragging",
      "over-target",
      "too-large",
      "complete",
      "started",
    );
    valve.hidden = false;
    valve.disabled = false;
    valve.classList.remove("attention");
    replay.hidden = true;
    view.title.textContent = "HEPSİ SIĞAR MI?";
    view.stageLabel.textContent = "EŞYALARI BAGAJDA TOPLA";
    instruction.textContent = "Eşyaları bagaja sürükle";
    view.particles.replaceChildren();
    updateProgress(view, items);
  }
  valve.addEventListener("click", deflateFlamingo, {
    signal: listeners.signal,
  });
  replay.addEventListener("click", reset, { signal: listeners.signal });
  Promise.all(view.images.map((image) => image.decode()))
    .then(() => {
      if (destroyed) return;
      game.classList.remove("loading");
      items.forEach((item) => {
        item.state = "idle";
        item.el.disabled = false;
      });
      valve.disabled = false;
      instruction.textContent = "Eşyaları bagaja sürükle";
    })
    .catch(() => {
      if (!destroyed) view.error.hidden = false;
    });
  return {
    destroy() {
      destroyed = true;
      generation++;
      drag.destroy();
      listeners.abort();
      items.forEach((item) => item.animation?.cancel());
      root.replaceChildren();
    },
  };
}

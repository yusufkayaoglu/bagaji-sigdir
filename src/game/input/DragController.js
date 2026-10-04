import { clamp, pointerPosition } from "../geometry.js";
/** Owns pointer capture and listeners; delegates game rules to the controller. */
export class DragController {
  active = null;
  pointer = null;
  pendingFrame = null;
  bounds = null;
  offset = null;
  listeners = new AbortController();
  constructor(surface, items, callbacks) {
    this.surface = surface;
    this.callbacks = callbacks;
    const options = { signal: this.listeners.signal };
    for (const item of items) {
      item.el.addEventListener(
        "pointerdown",
        (event) => this.start(item, event),
        options,
      );
      item.el.addEventListener(
        "pointermove",
        (event) => this.move(item, event),
        options,
      );
      item.el.addEventListener(
        "pointerup",
        (event) => this.end(item, event),
        options,
      );
      item.el.addEventListener(
        "pointercancel",
        () => {
          if (this.active === item) this.cancel();
        },
        options,
      );
      item.el.addEventListener(
        "lostpointercapture",
        () => {
          if (this.active === item) this.cancel();
        },
        options,
      );
      item.el.addEventListener(
        "keydown",
        (event) => {
          if (event.key === "Escape") this.cancel();
          if (["Enter", " "].includes(event.key)) {
            event.preventDefault();
            if (!this.active) callbacks.onKeyboardPlace(item);
          }
        },
        options,
      );
    }
    window.addEventListener("blur", () => this.cancel(), options);
    window.addEventListener("resize", () => this.cancel(), options);
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) this.cancel();
      },
      options,
    );
  }
  start(item, event) {
    if (
      this.active ||
      !event.isPrimary ||
      event.button !== 0 ||
      !this.callbacks.canStart(item)
    )
      return;
    event.preventDefault();
    this.active = item;
    this.pointer = event.pointerId;
    // Measure once per gesture, before style writes.
    this.bounds = this.surface.getBoundingClientRect();
    const p = pointerPosition(event, this.bounds);
    this.offset = { x: p.x - item.position.x, y: p.y - item.position.y };
    item.el.setPointerCapture(this.pointer);
    this.callbacks.onStart(item);
  }
  updatePosition(item, event) {
    const p = pointerPosition(event, this.bounds);
    item.position.x = clamp(p.x - this.offset.x, 6, 94);
    item.position.y = clamp(p.y - this.offset.y, 16, 85);
  }
  move(item, event) {
    if (this.active !== item || event.pointerId !== this.pointer) return;
    this.updatePosition(item, event);
    if (this.pendingFrame === null)
      this.pendingFrame = requestAnimationFrame(() => {
        this.pendingFrame = null;
        if (this.active === item) this.callbacks.onMove(item);
      });
  }
  end(item, event) {
    if (this.active !== item || event.pointerId !== this.pointer) return;
    this.updatePosition(item, event);
    this.flush(item);
    this.callbacks.onDrop(item);
  }
  flush(item) {
    if (this.pendingFrame !== null) cancelAnimationFrame(this.pendingFrame);
    this.pendingFrame = null;
    this.callbacks.onMove(item);
  }
  cancel() {
    if (this.active) this.callbacks.onCancel(this.active);
  }
  release() {
    const item = this.active,
      id = this.pointer;
    this.active = null;
    this.pointer = null;
    if (this.pendingFrame !== null) cancelAnimationFrame(this.pendingFrame);
    this.pendingFrame = null;
    // Clear active state before release fires lostpointercapture.
    if (item && id !== null && item.el.hasPointerCapture(id))
      item.el.releasePointerCapture(id);
  }
  destroy() {
    this.release();
    this.listeners.abort();
  }
}

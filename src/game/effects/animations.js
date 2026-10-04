function frame(p, transform = "translate(-50%,-50%)") {
  return {
    left: `${p.x}%`,
    top: `${p.y}%`,
    width: `${p.w}%`,
    height: `${p.h}%`,
    transform,
  };
}

export function createAnimations(layerElement) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function animate(item, frames, duration) {
    const animation = item.el.animate(frames, {
      duration: reduced.matches ? 0 : duration,
      easing: "cubic-bezier(.22,.8,.25,1)",
    });
    item.animation = animation;
    return animation.finished;
  }

  function sparkle(item, complete = false) {
    const layer = layerElement;
    layer.replaceChildren();
    layer.style.left = `${item.slot.x}%`;
    layer.style.top = `${item.slot.y}%`;
    if (reduced.matches) return;
    for (let i = 0; i < (complete ? 28 : 12); i++) {
      const star = document.createElement("i"),
        angle = (i / 12) * Math.PI * 2;
      star.style.setProperty(
        "--dx",
        `${Math.cos(angle) * (complete ? 130 : 65)}px`,
      );
      star.style.setProperty(
        "--dy",
        `${Math.sin(angle) * (complete ? 130 : 65)}px`,
      );
      star.style.setProperty("--delay", `${(i % 3) * 30}ms`);
      layer.append(star);
    }
  }

  function animateHome(item, start) {
    return animate(
      item,
      [
        frame(start, "translate(-50%,-50%) scale(1.08) rotate(-3deg)"),
        frame(item.position),
      ],
      330,
    );
  }
  function animatePlacement(item, start) {
    const end = frame(item.slot);
    return animate(
      item,
      [
        frame(start, "translate(-50%,-50%) scale(1.08) rotate(-3deg)"),
        {
          ...end,
          transform: "translate(-50%,-50%) scale(1.06,.94)",
          offset: 0.68,
        },
        {
          ...end,
          transform: "translate(-50%,-54%) scale(.98,1.04)",
          offset: 0.84,
        },
        end,
      ],
      580,
    );
  }
  function animateDeflation(item, old) {
    return animate(
      item,
      [
        frame(old),
        {
          ...frame({ ...old, y: old.y + 1 }),
          transform: "translate(-50%,-50%) rotate(-7deg)",
          offset: 0.25,
        },
        {
          ...frame({ ...old, w: old.w * 0.9, h: old.h * 0.7, y: old.y + 2 }),
          transform: "translate(-50%,-50%) rotate(6deg)",
          offset: 0.5,
        },
        frame(item.position),
      ],
      950,
    );
  }
  return { animateHome, animatePlacement, animateDeflation, sparkle };
}

const revealItems = document.querySelectorAll("[data-reveal]");

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.14 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const conditionTabs = document.querySelectorAll("[data-condition]");
const conditionPanels = document.querySelectorAll("[data-condition-panel]");

function activateCondition(conditionId) {
  conditionTabs.forEach((tab) => {
    const isActive = tab.dataset.condition === conditionId;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  conditionPanels.forEach((panel) => {
    const isActive = panel.dataset.conditionPanel === conditionId;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
}

conditionTabs.forEach((tab) => {
  tab.addEventListener("click", () => activateCondition(tab.dataset.condition));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    const tabs = [...conditionTabs];
    const currentIndex = tabs.indexOf(tab);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;

    tabs[nextIndex].focus();
    activateCondition(tabs[nextIndex].dataset.condition);
  });
});

const wellnessTabs = document.querySelectorAll("[data-wellness]");
const wellnessPanels = document.querySelectorAll("[data-wellness-panel]");

function activateWellness(wellnessId) {
  wellnessTabs.forEach((tab) => {
    const isActive = tab.dataset.wellness === wellnessId;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  wellnessPanels.forEach((panel) => {
    const isActive = panel.dataset.wellnessPanel === wellnessId;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
}

wellnessTabs.forEach((tab) => {
  tab.addEventListener("click", () => activateWellness(tab.dataset.wellness));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    const tabs = [...wellnessTabs];
    const currentIndex = tabs.indexOf(tab);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;

    tabs[nextIndex].focus();
    activateWellness(tabs[nextIndex].dataset.wellness);
  });
});

const canvas = document.getElementById("nourishCanvas");
const context = canvas.getContext("2d");

const palette = {
  pine: "#2f4427",
  deep: "#192514",
  moss: "#6e8061",
  sage: "#a8b39f",
  rose: "#b97967",
  linen: "#f4eedb"
};

const labels = [
  { title: "Assess", note: "goals" },
  { title: "Align", note: "routine" },
  { title: "Support", note: "calls" },
  { title: "Sustain", note: "habits" }
];

const pointer = {
  x: 0.5,
  y: 0.5,
  active: false
};

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawLeaf(ctx, x, y, size, angle, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.9, -size * 0.55, size * 1.75, -size * 0.3, size * 2, 0);
  ctx.bezierCurveTo(size * 1.25, size * 0.62, size * 0.35, size * 0.52, 0, 0);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.18, 0);
  ctx.lineTo(size * 1.65, 0);
  ctx.strokeStyle = "rgba(25, 37, 20, 0.28)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawPath(ctx, width, height, time) {
  const pad = Math.min(width, height) * 0.15;
  const start = { x: pad, y: height * 0.72 };
  const cp1 = { x: width * 0.22, y: height * 0.12 };
  const cp2 = { x: width * 0.75, y: height * 0.9 };
  const end = { x: width - pad, y: height * 0.28 };

  const drift = pointer.active ? (pointer.x - 0.5) * 38 : Math.sin(time * 0.0005) * 12;

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.bezierCurveTo(cp1.x + drift, cp1.y, cp2.x - drift, cp2.y, end.x, end.y);
  ctx.strokeStyle = "rgba(47, 68, 39, 0.36)";
  ctx.lineWidth = 2;
  ctx.stroke();

  return { start, cp1, cp2, end, drift };
}

function cubicPoint(start, cp1, cp2, end, t) {
  const mt = 1 - t;
  const x =
    mt * mt * mt * start.x +
    3 * mt * mt * t * cp1.x +
    3 * mt * t * t * cp2.x +
    t * t * t * end.x;
  const y =
    mt * mt * mt * start.y +
    3 * mt * mt * t * cp1.y +
    3 * mt * t * t * cp2.y +
    t * t * t * end.y;
  return { x, y };
}

function draw(time = 0) {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  context.clearRect(0, 0, width, height);

  context.fillStyle = "rgba(255, 253, 245, 0.65)";
  context.fillRect(0, 0, width, height);

  for (let i = 0; i < 9; i += 1) {
    const x = ((i * 113) % width) + Math.sin(time * 0.0004 + i) * 8;
    const y = ((i * 79) % height) + Math.cos(time * 0.0005 + i) * 8;
    context.beginPath();
    context.arc(x, y, 28 + i * 2, 0, Math.PI * 2);
    context.strokeStyle = "rgba(47, 68, 39, 0.06)";
    context.lineWidth = 1;
    context.stroke();
  }

  const path = drawPath(context, width, height, time);
  const nodeT = [0.08, 0.34, 0.64, 0.92];

  nodeT.forEach((t, index) => {
    const point = cubicPoint(
      path.start,
      { x: path.cp1.x + path.drift, y: path.cp1.y },
      { x: path.cp2.x - path.drift, y: path.cp2.y },
      path.end,
      t
    );

    const distance = Math.hypot(point.x / width - pointer.x, point.y / height - pointer.y);
    const isHot = pointer.active && distance < 0.23;
    const pulse = isHot ? 8 : Math.sin(time * 0.002 + index) * 2;
    const radius = 30 + pulse;

    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fillStyle = isHot ? "rgba(183, 121, 103, 0.2)" : "rgba(168, 179, 159, 0.22)";
    context.fill();
    context.strokeStyle = isHot ? palette.rose : palette.pine;
    context.lineWidth = isHot ? 2.4 : 1.4;
    context.stroke();

    drawLeaf(
      context,
      point.x - 9,
      point.y - radius - 4,
      isHot ? 18 : 14,
      -0.55 + index * 0.18,
      isHot ? "rgba(183, 121, 103, 0.78)" : "rgba(47, 68, 39, 0.7)"
    );

    context.fillStyle = palette.deep;
    context.font = "600 15px Inter, Arial, sans-serif";
    context.textAlign = "center";
    context.fillText(labels[index].title, point.x, point.y + 5);
    context.fillStyle = palette.moss;
    context.font = "600 11px Inter, Arial, sans-serif";
    context.fillText(labels[index].note.toUpperCase(), point.x, point.y + 22);
  });

  context.fillStyle = "rgba(25, 37, 20, 0.86)";
  context.font = "600 13px Inter, Arial, sans-serif";
  context.textAlign = "left";
  context.fillText("EM Nutrition pathway", 24, 34);

  requestAnimationFrame(draw);
}

canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = (event.clientX - rect.left) / rect.width;
  pointer.y = (event.clientY - rect.top) / rect.height;
  pointer.active = true;
});

canvas.addEventListener("pointerleave", () => {
  pointer.active = false;
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
requestAnimationFrame(draw);

(() => {
  "use strict";
  const palettes = { standard: "Classic", pocket: "Pocket", dark: "Dark" };
  const chooser = document.querySelector(".palette-control");
  const links = [...document.querySelectorAll("[data-screen]")];
  const descriptions = new Map(links.map(link => [link, link.querySelector("img").alt.replace(/^Classic Green /, "")]));
  const dialog = document.getElementById("screen-preview");
  const bootLink = links.find(link => link.dataset.screen === "boot");
  const bootToggle = document.querySelector("[data-boot-toggle]");
  let bootVariant = "gmrs", bootPaused = matchMedia("(prefers-reduced-motion: reduce)").matches, bootTimer;
  let palette = "standard", screenIndex = 0;
  const screenPath = screen => `assets/screens/${palette}-${screen}${screen === "boot" && bootVariant === "ham" ? "-ham" : ""}-4x.png`;
  const announce = message => { document.querySelector("[data-announcement]").textContent = message; };

  function updatePreview() {
    const link = links[screenIndex], title = link.dataset.title;
    document.getElementById("preview-title").textContent = title;
    document.querySelector("[data-preview-palette]").textContent = palettes[palette];
    const image = document.querySelector("[data-preview-image]");
    image.src = screenPath(link.dataset.screen);
    image.alt = link.querySelector("img").alt;
    document.querySelector("[data-preview-index]").textContent = `${screenIndex + 1} / ${links.length}`;
    const download = document.querySelector("[data-preview-download]");
    download.href = image.src;
    download.download = `${link.dataset.screen === "boot" ? bootVariant : "gmrs"}-boy-${palette}-${link.dataset.screen}.png`;
  }

  function updateBoot() {
    const brand = bootVariant === "ham" ? "HAM Boy" : "GMRS Boy";
    bootLink.dataset.bootVariant = bootVariant;
    bootLink.dataset.title = `Startup / ${brand}`;
    bootLink.setAttribute("aria-label", `Enlarge ${brand} startup screen`);
    bootLink.href = screenPath("boot");
    const image = bootLink.querySelector("img");
    image.src = screenPath("boot");
    image.alt = `${palettes[palette]} startup screen with the ${brand} logo`;
    if (dialog.open && links[screenIndex] === bootLink) updatePreview();
  }

  function setBootRotation() {
    clearInterval(bootTimer);
    bootToggle.hidden = false;
    const label = bootPaused ? "Resume logo rotation" : "Pause logo rotation";
    bootToggle.setAttribute("aria-label", label);
    bootToggle.title = label;
    bootToggle.querySelector('[data-icon="pause"]').toggleAttribute("hidden", bootPaused);
    bootToggle.querySelector('[data-icon="play"]').toggleAttribute("hidden", !bootPaused);
    if (!bootPaused) bootTimer = setInterval(() => {
      if (document.hidden || dialog.open) return;
      bootVariant = bootVariant === "gmrs" ? "ham" : "gmrs";
      updateBoot();
    }, 2000);
  }

  function setPalette(value, save = true) {
    if (!Object.hasOwn(palettes, value)) return;
    palette = value;
    document.body.dataset.palette = value;
    for (const button of chooser.querySelectorAll("button")) button.setAttribute("aria-pressed", String(button.dataset.palette === value));
    document.querySelector("[data-palette-label]").textContent = palettes[value].toUpperCase();
    for (const link of links) {
      const image = link.querySelector("img");
      link.href = screenPath(link.dataset.screen);
      image.src = screenPath(link.dataset.screen);
      image.alt = `${palettes[value]} ${descriptions.get(link)}`;
    }
    updateBoot();
    updatePreview();
    if (save) {
      try { localStorage.setItem("gmrs-boy-palette", value); } catch {}
      announce(`${palettes[value]} previews selected.`);
    }
  }

  chooser.hidden = false;
  chooser.addEventListener("click", event => {
    const button = event.target.closest("button[data-palette]");
    if (button) setPalette(button.dataset.palette);
  });
  try { setPalette(localStorage.getItem("gmrs-boy-palette") || "standard", false); } catch { setPalette("standard", false); }
  setBootRotation();
  bootToggle.addEventListener("click", () => { bootPaused = !bootPaused; setBootRotation(); });
  for (const [index, link] of links.entries()) link.addEventListener("click", event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof dialog.showModal !== "function") return;
    event.preventDefault();
    screenIndex = index;
    updatePreview();
    dialog.showModal();
    document.body.classList.add("preview-open");
  });
  const move = step => { screenIndex = (screenIndex + step + links.length) % links.length; updatePreview(); };
  document.querySelector("[data-previous]").addEventListener("click", () => move(-1));
  document.querySelector("[data-next]").addEventListener("click", () => move(1));
  document.querySelector("[data-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => document.body.classList.remove("preview-open"));
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); }
  });
})();

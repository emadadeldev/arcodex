(() => {
  "use strict";

  const LIKE_API = "https://arcodex.emadadeldev.workers.dev/likes";
  const $ = (id) => document.getElementById(id);

  const errorBox = $("game-error");
  const errorMessage = $("game-error-message");
  const content = $("game-content");

  const defer = window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : (callback) => setTimeout(callback, 0);

  function showError(message) {
    if (content) content.hidden = true;
    if (errorBox) errorBox.hidden = false;
    if (errorMessage) errorMessage.textContent = message;
  }

  function showContent() {
    if (errorBox) errorBox.hidden = true;
    if (content) content.hidden = false;
  }

  function getSlug() {
    const search = location.search;

    if (search.startsWith("?=")) {
      try {
        return decodeURIComponent(search.slice(2).split("&")[0] || "").trim();
      } catch {
        return "";
      }
    }

    const params = new URLSearchParams(search);

    return (params.get("slug") || params.get("game") || "").trim();
  }

  const initialSlug = getSlug();

  if (initialSlug && location.pathname.endsWith("/game.html")) {
    const cleanPath = location.pathname.replace(/game\.html$/, "game");

    history.replaceState(
      null,
      "",
      `${cleanPath}?=${encodeURIComponent(initialSlug)}${location.hash}`,
    );
  }

  function safeURL(value) {
    if (typeof value !== "string" || !value.trim()) {
      return "";
    }

    try {
      const url = new URL(value.trim(), location.href);

      if (!["http:", "https:"].includes(url.protocol)) {
        return "";
      }

      return url.href;
    } catch {
      return "";
    }
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value ?? "";
  }

  function parseMarkdown(markdown) {
    const lines = markdown.replace(/^\uFEFF/, "").split(/\r?\n/);

    if (!lines.length || lines[0].trim() !== "---") {
      throw new Error("ملف Markdown لازم يبدأ بسطر ---");
    }

    const endIndex = lines.findIndex(
      (line, index) => index > 0 && line.trim() === "---",
    );

    if (endIndex === -1) {
      throw new Error("بيانات YAML ناقصها سطر --- للإغلاق");
    }

    if (!window.jsyaml) {
      throw new Error("مكتبة YAML لم يتم تحميلها.");
    }

    let data;

    try {
      data = window.jsyaml.load(lines.slice(1, endIndex).join("\n"));
    } catch (error) {
      throw new Error("خطأ في بيانات YAML: " + error.message);
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("بيانات اللعبة فارغة أو غير صحيحة.");
    }

    return {
      data,
      body: lines.slice(endIndex + 1).join("\n"),
    };
  }

  function renderMarkdown(markdown) {
    if (!markdown.trim()) return "";

    let html;

    if (window.marked) {
      html = window.marked.parse(markdown);
    } else {
      const p = document.createElement("p");
      p.textContent = markdown;
      return p.outerHTML;
    }

    return window.DOMPurify
      ? window.DOMPurify.sanitize(html)
      : (() => {
          const template = document.createElement("template");
          template.content.textContent = markdown;
          return template.innerHTML.replace(/\n/g, "<br>");
        })();
  }

  function renderPlatforms(data) {
    const container = $("game-platforms");
    if (!container) return;

    const platforms = Array.isArray(data.port)
      ? data.port
      : Array.isArray(data.platforms)
        ? data.platforms
        : [];

    const fragment = document.createDocumentFragment();

    platforms.forEach((platform) => {
      const tag = document.createElement("span");
      tag.textContent = String(platform);
      fragment.appendChild(tag);
    });

    container.replaceChildren(fragment);
  }

  const ICONS = {
    github:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.69-3.88-1.54-3.88-1.54-.53-1.36-1.28-1.72-1.28-1.72-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.67 1.24 3.32.95.1-.74.4-1.24.73-1.52-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.35.78 1.04.78 2.1v3.11c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26L22.827 21.75h-6.617l-5.18-6.773-5.93 6.773H1.79l7.73-8.835L1.173 2.25H7.96l4.682 6.188 5.602-6.188Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/></svg>',
    discord:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.317 4.37A19.79 19.79 0 0 0 15.432 2.855a.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.49 0 12.3 12.3 0 0 0-.617-1.249.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.674 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.92 19.92 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.18 13.18 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.794 8.18 1.794 12.061 0a.074.074 0 0 1 .078.009c.12.1.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.226.648-1.873.892a.077.077 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.077.077 0 0 0 .084.029 19.834 19.834 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.032-.027Z"/></svg>',
  };

  function renderSocialLinks(game) {
    const container = document.querySelector(".social-links");
    if (!container) return;

    const fragment = document.createDocumentFragment();
    const links = game.links;

    if (links && typeof links === "object") {
      Object.entries(links).forEach(([name, value]) => {
        const url = safeURL(value);
        if (!url || !ICONS[name]) return;

        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.title = name.toUpperCase();
        link.setAttribute("aria-label", name);
        link.innerHTML = ICONS[name];

        fragment.appendChild(link);
      });
    }

    container.replaceChildren(fragment);
  }

  function renderContributors(contributors) {
    const container = $("game-contributors");
    if (!container) return;

    if (!Array.isArray(contributors) || !contributors.length) {
      container.textContent = "لم تتم إضافة أسماء المساهمين بعد.";
      return;
    }

    const fragment = document.createDocumentFragment();

    contributors.forEach((person) => {
      if (!person || typeof person !== "object") return;

      const item = document.createElement("div");
      item.className = "contributor";

      const name = document.createElement("span");
      name.className = "contributor-name";

      const icon = document.createElement("span");
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "👤";

      name.append(icon, document.createTextNode(person.name || "مساهم"));

      const role = document.createElement("span");
      role.className = "contributor-role";
      role.textContent = person.role || "";

      const url = safeURL(person.url || person.link);

      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.style.display = "inline-flex";
        link.style.alignItems = "center";
        link.style.gap = "10px";
        link.append(name, role);
        item.appendChild(link);
      } else {
        item.append(name, role);
      }

      fragment.appendChild(item);
    });

    container.replaceChildren(fragment);
  }

  function renderScreenshots(game) {
    const container = $("screenshots");
    if (!container) return;

    const screenshots = game.screenshots || {};
    const images = Array.isArray(screenshots.images) ? screenshots.images : [];
    const trailer = safeURL(screenshots.trailer || "");

    const fragment = document.createDocumentFragment();

    images.forEach((imageValue, index) => {
      const imageURL = safeURL(imageValue);
      if (!imageURL) return;

      const screenshot = document.createElement("div");
      screenshot.className = "screenshot";

      if (index === 0 && trailer) {
        const trailerLink = document.createElement("a");
        trailerLink.className = "trailer-button";
        trailerLink.href = trailer;
        trailerLink.target = "_blank";
        trailerLink.rel = "noopener noreferrer";
        trailerLink.setAttribute("aria-label", "تشغيل التريلر");

        const play = document.createElement("span");
        play.className = "btn-play-trailer";
        trailerLink.appendChild(play);
        screenshot.appendChild(trailerLink);
      }

      const link = document.createElement("a");
      link.className = "screenshot-image";
      link.href = imageURL;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const image = document.createElement("img");
      image.src = imageURL;
      image.alt = game.title || "";
      image.loading = "lazy";
      image.decoding = "async";

      link.appendChild(image);
      screenshot.appendChild(link);
      fragment.appendChild(screenshot);
    });

    container.replaceChildren(fragment);
  }

  async function loadLikes(slug) {
    const count = $("like-count");
    if (!count) return;

    try {
      const response = await fetch(
        `${LIKE_API}?slug=${encodeURIComponent(slug)}`,
        { cache: "no-store" },
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      count.textContent = data.likes ?? 0;
    } catch (error) {
      console.warn("LOAD LIKES:", error);
      count.textContent = "0";
    }
  }

  function setupLikeButton(slug) {
    const button = $("like-button");
    const count = $("like-count");

    if (!button || !count) return;

    button.onclick = async () => {
      if (button.disabled) return;

      button.disabled = true;

      try {
        const response = await fetch(LIKE_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        count.textContent = data.likes ?? 0;
        button.classList.add("liked");
        button.setAttribute("aria-pressed", "true");
      } catch (error) {
        console.error("LIKE API:", error);
      } finally {
        button.disabled = false;
      }
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => loadLikes(slug), { timeout: 1200 });
    } else {
      setTimeout(() => loadLikes(slug), 150);
    }
  }

  function setupActions(data, slug) {
    const downloadButton = $("download-button");
    const downloadURL = safeURL(data.downloadlink || "");

    if (downloadButton) {
      downloadButton.hidden = !downloadURL;
      downloadButton.onclick = () => {
        if (downloadURL) {
          window.open(downloadURL, "_blank", "noopener,noreferrer");
        }
      };
    }

    const shareButton = $("share-button");

    if (shareButton) {
      shareButton.onclick = async () => {
        const shareData = {
          title: data.title || slug,
          text: `تعريب ${data.title || slug} - ARCODEX`,
          url: location.href,
        };

        try {
          if (navigator.share) {
            await navigator.share(shareData);
          } else if (navigator.clipboard && isSecureContext) {
            await navigator.clipboard.writeText(location.href);
            alert("تم نسخ رابط اللعبة!");
          } else {
            window.prompt("انسخ رابط اللعبة:", location.href);
          }
        } catch (error) {
          if (error.name !== "AbortError") {
            window.prompt("انسخ رابط اللعبة:", location.href);
          }
        }
      };
    }

    setupLikeButton(slug);
  }

  function setCover(data, title) {
    const image = $("game-cover");
    if (!image) return "";

    const fallback = safeURL("assets/logo.png");
    const cover = safeURL(
      data.cover || data.image || data.poster || "assets/logo.png",
    );

    image.alt = title;
    image.loading = "eager";
    image.decoding = "async";
    image.fetchPriority = "high";

    image.onerror = () => {
      image.onerror = null;
      if (fallback && image.src !== fallback) image.src = fallback;
    };

    image.src = cover || fallback;

    return cover || fallback;
  }

  async function loadGame() {
    const slug = getSlug();

    if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
      showError("تعذر تحديد اللعبة المطلوبة.");
      return;
    }

    try {
      const response = await fetch(`games/${encodeURIComponent(slug)}.md`, {
        cache: "default",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(
          `تعذر تحميل games/${slug}.md (HTTP ${response.status})`,
        );
      }

      const markdown = await response.text();
      const { data, body } = parseMarkdown(markdown);

      const title = data.title || slug;
      const developer = data.developer || "";

      document.title = `${title} | ARCODEX`;

      setText("game-title", title);
      setText("game-developer", developer);

      setCover(data, title);

      const description = $("game-description");
      if (description) {
        description.innerHTML = renderMarkdown(body);
      }

      const rawProgress = Number.parseFloat(
        data.complate ?? data.complete ?? 0,
      );

      const progress = Number.isFinite(rawProgress)
        ? Math.max(0, Math.min(100, rawProgress))
        : 0;

      const progressBar = $("game-progress");
      if (progressBar) progressBar.value = progress;

      setText("game-progress-text", `${progress}%`);

      renderPlatforms(data);
      renderSocialLinks(data);
      renderContributors(data.contributors);

      showContent();

      const schema = $("game-schema");

      if (schema) {
        schema.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoGame",
          name: title,
          description: body
            .replace(/[#*_`>\[\]]/g, "")
            .trim()
            .slice(0, 500),
          image: safeURL(
            data.cover || data.image || data.poster || "assets/logo.png",
          ),
          inLanguage: "ar",
          author: developer || undefined,
          url: location.href,
        });
      }

      defer(() => renderScreenshots(data));

      setupActions(data, slug);
    } catch (error) {
      console.error("ARCODEX:", error);
      showError(error.message || "حدث خطأ أثناء تحميل بيانات اللعبة.");
    }
  }

  document.addEventListener("DOMContentLoaded", loadGame, {
    once: true,
  });
})();

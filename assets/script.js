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
  github: "github.svg",
  x: "x-twitter.svg",
  discord: "discord.svg",
};

function renderSocialLinks(game) {
  const container = document.querySelector(".social-links");
  if (!container) return;

  const fragment = document.createDocumentFragment();
  const links = game.links;

  if (links && typeof links === "object") {
    Object.entries(links).forEach(([name, value]) => {
      const url = safeURL(value);
      const iconFile = ICONS[name];

      if (!url || !iconFile) return;

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.title = name.toUpperCase();
      link.setAttribute("aria-label", name);

      const icon = document.createElement("img");
      icon.src = `assets/icons/${iconFile}`;
      icon.alt = "";
      icon.width = 24;
      icon.height = 24;
      icon.loading = "lazy";
      icon.decoding = "async";

      link.appendChild(icon);
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

(() => {
  "use strict";

  const LIKE_API = "https://arcodex.emadadeldev.workers.dev/likes";
  const $ = (id) => document.getElementById(id);

  const loading = $("game-loading");
  const errorBox = $("game-error");
  const errorMessage = $("game-error-message");
  const content = $("game-content");

  function showError(message) {
    loading.hidden = true;
    content.hidden = true;
    errorBox.hidden = false;
    errorMessage.textContent = message;
  }

  function getSlug() {
    const search = window.location.search;

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

  function safeURL(value) {
    if (typeof value !== "string" || !value.trim()) return "";

    const raw = value.trim();

    try {
      const basePath = new URL("./", window.location.href);
      const url = new URL(raw, basePath);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return "";
      }

      return url.href;
    } catch {
      return "";
    }
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

    const yamlText = lines.slice(1, endIndex).join("\n");
    const body = lines.slice(endIndex + 1).join("\n");

    if (!window.jsyaml) {
      throw new Error("مكتبة YAML لم يتم تحميلها. تأكد من اتصال الإنترنت.");
    }

    let data;

    try {
      data = window.jsyaml.load(yamlText);
    } catch (error) {
      throw new Error("خطأ في بيانات YAML: " + error.message);
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("بيانات اللعبة فارغة أو غير صحيحة.");
    }

    return { data, body };
  }

  function renderMarkdown(markdown) {
    if (!markdown.trim()) return "";

    const html = window.marked
      ? window.marked.parse(markdown)
      : "<p>" + markdown.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</p>";

    return window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
  }

  function renderPlatforms(data) {
    const platforms = Array.isArray(data.port)
      ? data.port
      : Array.isArray(data.platforms)
        ? data.platforms
        : [];

    $("game-platforms").replaceChildren();

    platforms.forEach((platform) => {
      const tag = document.createElement("span");
      tag.textContent = platform;
      $("game-platforms").appendChild(tag);
    });
  }

  function renderSocialLinks(game) {
    const container = document.querySelector(".social-links");

    container.replaceChildren();

    if (!game.links || typeof game.links !== "object") {
      return;
    }

    const icons = {
      github: `

        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >

          <path
            d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.69-3.88-1.54-3.88-1.54-.53-1.36-1.28-1.72-1.28-1.72-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.67 1.24 3.32.95.1-.74.4-1.24.73-1.52-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.35.78 1.04.78 2.1v3.11c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z"
          />

        </svg>

      `,

      x: `

        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >

          <path
            d="M18.244 2.25h3.308l-7.227 8.26L22.827 21.75h-6.617l-5.18-6.773-5.93 6.773H1.79l7.73-8.835L1.173 2.25H7.96l4.682 6.188 5.602-6.188Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"
          />

        </svg>

      `,

      discord: `

        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >

          <path
            d="M20.317 4.37A19.79 19.79 0 0 0 15.432 2.855a.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.49 0 12.3 12.3 0 0 0-.617-1.249.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.674 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.92 19.92 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.18 13.18 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.794 8.18 1.794 12.061 0a.074.074 0 0 1 .078.009c.12.1.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.226.648-1.873.892a.077.077 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.077.077 0 0 0 .084.029 19.834 19.834 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.032-.027ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.418 2.157-2.418 1.21 0 2.175 1.095 2.157 2.418 0 1.334-.956 2.419-2.157 2.419Zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419-2.157-1.333.956-2.418 2.157-2.418 2.157 0 2.175 1.095 2.175 2.418 0 1.334-.956 2.419-2.157 2.419Z"
          />

        </svg>

      `,
    };

    for (const [name, url] of Object.entries(game.links)) {
      if (!url || !icons[name]) {
        continue;
      }

      const link = document.createElement("a");

      link.href = url;

      link.target = "_blank";

      link.rel = "noopener noreferrer";

      link.title = name.toUpperCase();

      link.setAttribute("aria-label", name);

      link.innerHTML = icons[name];

      container.appendChild(link);
    }
  }

  function renderContributors(contributors) {
    const container = $("game-contributors");
    container.replaceChildren();

    if (!Array.isArray(contributors) || contributors.length === 0) {
      container.textContent = "لم تتم إضافة أسماء المساهمين بعد.";
      return;
    }

    const userIcon = `
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5z"/>
                </svg>
            `;

    contributors.forEach((person) => {
      if (!person || typeof person !== "object") return;

      const item = document.createElement("div");
      item.className = "contributor";

      const name = document.createElement("span");
      name.className = "contributor-name";

      name.innerHTML = userIcon;

      const nameText = document.createTextNode(person.name || "مساهم");
      name.appendChild(nameText);

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

      container.appendChild(item);
    });
  }

  function renderScreenshots(game) {
    const container = document.querySelector("#screenshots");

    container.replaceChildren();

    if (!game.screenshots || typeof game.screenshots !== "object") {
      return;
    }

    const images = Array.isArray(game.screenshots.images)
      ? game.screenshots.images
      : [];

    const trailer = game.screenshots.trailer || "";

    if (!images.length && !trailer) {
      return;
    }

    images.forEach((imageUrl, index) => {
      if (!imageUrl || typeof imageUrl !== "string") {
        return;
      }

      const screenshot = document.createElement("div");

      screenshot.className = "screenshot";

      if (index === 0 && trailer) {
        const trailerLink = document.createElement("a");

        trailerLink.className = "trailer-button";

        trailerLink.href = trailer;

        trailerLink.target = "_blank";

        trailerLink.rel = "noopener noreferrer";

        trailerLink.setAttribute("aria-label", "تشغيل التريلر");

        trailerLink.innerHTML = `

            <span
              class="btn-play-trailer"
            ></span>

          `;

        screenshot.appendChild(trailerLink);
      }

      const link = document.createElement("a");

      link.className = "screenshot-image";

      link.href = imageUrl;

      link.target = "_blank";

      link.rel = "noopener noreferrer";

      const image = document.createElement("img");

      image.src = imageUrl;

      image.alt = game.title || "";

      image.loading = "lazy";

      image.decoding = "async";

      link.appendChild(image);

      screenshot.appendChild(link);

      container.appendChild(screenshot);
    });
  }

  async function loadLikes(slug) {
    const likeCount = $("like-count");

    if (!likeCount) return;

    try {
      const response = await fetch(
        `${LIKE_API}?slug=${encodeURIComponent(slug)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      likeCount.textContent = data.likes ?? 0;
    } catch (error) {
      console.error("LOAD LIKES:", error);
      likeCount.textContent = "0";
    }
  }

  function setupLikeButton(slug) {
    const likeButton = $("like-button");
    const likeCount = $("like-count");

    if (!likeButton || !likeCount) return;

    likeButton.onclick = async () => {
      if (likeButton.disabled) return;

      likeButton.disabled = true;

      try {
        const response = await fetch(LIKE_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slug: slug,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        likeCount.textContent = data.likes ?? 0;

        likeButton.classList.add("liked");
        likeButton.setAttribute("aria-pressed", "true");
      } catch (error) {
        console.error("LIKE API:", error);
      } finally {
        likeButton.disabled = false;
      }
    };

    loadLikes(slug);
  }

  function setupActions(data, slug) {
    const downloadButton = $("download-button");
    const downloadURL = safeURL(data.downloadlink || "");

    downloadButton.hidden = !downloadURL;

    downloadButton.onclick = () => {
      if (downloadURL) {
        window.open(downloadURL, "_blank", "noopener,noreferrer");
      }
    };

    $("share-button").onclick = async () => {
      const shareData = {
        title: data.title || slug,
        text: `تعريب ${data.title || slug} - ARCODEX`,
        url: window.location.href,
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(window.location.href);

          alert("تم نسخ رابط اللعبة!");
        } else {
          window.prompt("انسخ رابط اللعبة:", window.location.href);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          window.prompt("انسخ رابط اللعبة:", window.location.href);
        }
      }
    };

    setupLikeButton(slug);
  }

  async function loadGame() {
    const slug = getSlug();

    if (!slug) {
      showError("حدث خطاء ما");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      showError("حدث خطاء ما");
      return;
    }

    try {
      const response = await fetch(`games/${encodeURIComponent(slug)}.md`, {
        cache: "no-cache",
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

      $("game-title").textContent = title;
      $("game-developer").textContent = developer;

      const coverValue =
        data.cover || data.image || data.poster || "assets/logo.png";

      const coverURL = safeURL(coverValue);
      const coverImage = $("game-cover");
      const fallbackURL = safeURL("assets/logo.png");

      coverImage.alt = title;

      coverImage.onerror = () => {
        coverImage.onerror = null;

        if (fallbackURL) {
          coverImage.src = fallbackURL;
        }
      };

      coverImage.src = coverURL || fallbackURL;

      $("game-description").innerHTML = renderMarkdown(body);

      const rawProgress = Number.parseFloat(
        data.complate ?? data.complete ?? 0,
      );

      const progress = Number.isFinite(rawProgress)
        ? Math.max(0, Math.min(100, rawProgress))
        : 0;

      $("game-progress").value = progress;
      $("game-progress-text").textContent = `${progress}%`;

      renderPlatforms(data);
      renderSocialLinks(data);
      renderContributors(data.contributors);
      renderScreenshots(data);

      setupActions(data, slug);

      $("game-schema").textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "VideoGame",
        name: title,
        description: body
          .replace(/[#*_`>\[\]]/g, "")
          .trim()
          .slice(0, 500),
        image: coverURL || fallbackURL,
        inLanguage: "ar",
        author: developer || undefined,
        url: window.location.href,
      });

      loading.hidden = true;
      errorBox.hidden = true;
      content.hidden = false;
    } catch (error) {
      console.error("ARCODEX:", error);

      showError(error.message || "حدث خطأ أثناء تحميل بيانات اللعبة.");
    }
  }

  loadGame();
})();

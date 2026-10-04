(() => {
  /*
   * =====================================================
   * CONFIG
   * =====================================================
   */

  const LIKE_API = "https://arcodex.emadadeldev.workers.dev/likes";

  const SITE_URL = "https://emadadeldev.github.io/arcodex";

  const DEFAULT_IMAGE = `${SITE_URL}/assets/logo.png`;

  /*
   * =====================================================
   * URL
   * =====================================================
   */

  const slug = window.location.search.startsWith("?=")
    ? window.location.search.substring(2)
    : null;

  /*
   * No game specified
   */

  if (!slug) {
    showError();

    return;
  }

  /*
   * =====================================================
   * LOAD DATABASE
   * =====================================================
   */

  async function loadGame() {
    try {
      const response = await fetch("api/database.json", {
        cache: "force-cache",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const games = await response.json();

      if (!Array.isArray(games)) {
        throw new Error("Invalid database");
      }

      const game = games.find((item) => item.slug === slug);

      if (!game) {
        showError();

        return;
      }

      renderGame(game);
    } catch (error) {
      console.error("GAME API:", error);

      showError();
    }
  }

  /*
   * =====================================================
   * RENDER GAME
   * =====================================================
   */

  function renderGame(game) {
    updateSEO(game);

    /*
     * TITLE
     */

    document.querySelector(".game-heading h1").textContent = game.title || "";

    /*
     * DEVELOPER
     */

    document.querySelector(".developer").textContent = game.developer || "";

    /*
     * PLATFORMS
     */

    const genres = document.querySelector(".genres");

    genres.replaceChildren();

    if (Array.isArray(game.port)) {
      const fragment = document.createDocumentFragment();

      for (const port of game.port) {
        const span = document.createElement("span");

        span.textContent = port;

        fragment.appendChild(span);
      }

      genres.appendChild(fragment);
    }

    /*
     * COVER
     */

    const poster = document.querySelector(".poster img");

    poster.src = game.cover || "";

    poster.alt = game.title || "";

    /*
     * BACKGROUND
     */

    setGameBackground(game.cover);

    /*
     * DESCRIPTION
     */

    const description = document.querySelector(".description");

    description.textContent = game.Description || "";

    /*
     * =====================================================
     * PROGRESS
     * =====================================================
     */
    const progressBar = document.querySelector(".progbar");

    if (progressBar) {
      const progress = Number(game.complate);

      if (
        game.complate === "" ||
        !Number.isFinite(progress) ||
        progress >= 100
      ) {
        progressBar.style.display = "none";
      } else {
        progressBar.style.display = "";
        progressBar.value = Math.min(100, Math.max(0, progress));
      }
    }

    /*
     * SOCIAL LINKS
     */

    renderSocialLinks(game);

    /*
     * SCREENSHOTS
     */

    renderScreenshots(game);

    /*
     * DOWNLOAD
     */

    const downloadButton = document.querySelector(".download-button");

    if (game.downloadble === true && game.downloadlink) {
      downloadButton.style.display = "inline-flex";

      downloadButton.onclick = () => {
        window.location.href = game.downloadlink;
      };
    } else {
      downloadButton.style.display = "none";
    }

    /*
     * SHARE
     */

    setupShareButton(game);

    /*
     * LIKE
     */

    setupLikeButton(game);
  }

  /*
   * =====================================================
   * GAME BACKGROUND
   * =====================================================
   */

  function setGameBackground(imageUrl) {
    const background = document.querySelector(".game-background-image");

    if (!background || !imageUrl) {
      return;
    }

    const image = new Image();

    image.onload = () => {
      background.style.backgroundImage = `url("${imageUrl}")`;

      requestAnimationFrame(() => {
        background.classList.add("visible");
      });
    };

    image.onerror = () => {
      background.classList.remove("visible");
    };

    image.src = imageUrl;
  }

  /*
   * =====================================================
   * SEO
   * =====================================================
   */

  function updateSEO(game) {
    const gameTitle = game.title || "ARCODEX";

    const developer = game.developer || "";

    const gameDescription = cleanDescription(
      game.Description || `تعريب لعبة ${gameTitle} باللغة العربية على ARCODEX.`,
    );

    const keywords = [
      gameTitle,
      developer,
      `تعريب ${gameTitle}`,
      `ترجمة ${gameTitle}`,
      `${gameTitle} عربي`,
      "تعريبات",
      "تعريب ألعاب",
      "ترجمة ألعاب",
      "ARCODEX",
    ]
      .filter(Boolean)
      .join(", ");

    const gameUrl = `${SITE_URL}/game.html?=${encodeURIComponent(game.slug)}`;

    let gameImage = DEFAULT_IMAGE;

    if (game.cover) {
      try {
        gameImage = new URL(game.cover, window.location.href).href;
      } catch (error) {
        console.error("SEO IMAGE:", error);
      }
    }

    document.title = `${gameTitle} - ARCODEX`;

    setMeta('meta[name="description"]', gameDescription);

    setMeta('meta[name="keywords"]', keywords);

    setLink('link[rel="canonical"]', gameUrl);

    setMeta('meta[property="og:title"]', `${gameTitle} - ARCODEX`);

    setMeta('meta[property="og:description"]', gameDescription);

    setMeta('meta[property="og:url"]', gameUrl);

    setMeta('meta[property="og:image"]', gameImage);

    setMeta('meta[property="og:image:alt"]', gameTitle);

    setMeta('meta[name="twitter:title"]', `${gameTitle} - ARCODEX`);

    setMeta('meta[name="twitter:description"]', gameDescription);

    setMeta('meta[name="twitter:image"]', gameImage);

    setMeta('meta[name="twitter:image:alt"]', gameTitle);

    updateStructuredData({
      title: gameTitle,

      description: gameDescription,

      url: gameUrl,

      image: gameImage,

      developer: developer,

      platform: Array.isArray(game.port) ? game.port : [],
    });
  }

  /*
   * =====================================================
   * SET META
   * =====================================================
   */

  function setMeta(selector, value) {
    const element = document.querySelector(selector);

    if (!element) {
      return;
    }

    element.setAttribute("content", value);
  }

  /*
   * =====================================================
   * SET LINK
   * =====================================================
   */

  function setLink(selector, value) {
    const element = document.querySelector(selector);

    if (!element) {
      return;
    }

    element.setAttribute("href", value);
  }

  /*
   * =====================================================
   * CLEAN DESCRIPTION
   * =====================================================
   */

  function cleanDescription(text) {
    return String(text).replace(/\s+/g, " ").trim().slice(0, 300);
  }

  /*
   * =====================================================
   * STRUCTURED DATA
   * =====================================================
   */

  function updateStructuredData(data) {
    const schema = document.querySelector("#game-schema");

    if (!schema) {
      return;
    }

    const json = {
      "@context": "https://schema.org",

      "@type": "VideoGame",

      name: data.title,

      description: data.description,

      url: data.url,

      image: data.image,

      inLanguage: "ar",
    };

    if (data.developer) {
      json.author = {
        "@type": "Organization",

        name: data.developer,
      };
    }

    if (Array.isArray(data.platform) && data.platform.length) {
      json.gamePlatform = data.platform;
    }

    schema.textContent = JSON.stringify(json);
  }

  /*
   * =====================================================
   * SHARE
   * =====================================================
   */

  function setupShareButton(game) {
    const shareButton = document.querySelector(".magnet-button");

    shareButton.onclick = async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: game.title,

            text: game.Description || "",

            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);

          shareButton.textContent = "تم نسخ الرابط";

          setTimeout(() => {
            shareButton.textContent = "مشاركة";
          }, 2000);
        }
      } catch (error) {
        console.error("Share:", error);
      }
    };
  }

  /*
   * =====================================================
   * LIKE
   * =====================================================
   */

  function setupLikeButton(game) {
    const likeButton = document.querySelector(".like-button");

    const likeCount = likeButton.querySelector(".like-count");

    const likeText = likeButton.querySelector(".like-text");

    loadLikes(game, likeCount);

    likeButton.onclick = async () => {
      if (likeButton.disabled) {
        return;
      }

      likeButton.disabled = true;

      try {
        const response = await fetch(LIKE_API, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            slug: game.slug,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        likeCount.textContent = data.likes ?? 0;

        likeButton.classList.add("liked");

        likeText.textContent = "أعجبني";
      } catch (error) {
        console.error("LIKE API:", error);
      } finally {
        likeButton.disabled = false;
      }
    };
  }

  /*
   * =====================================================
   * LOAD LIKES
   * =====================================================
   */

  async function loadLikes(game, likeCount) {
    try {
      const response = await fetch(
        `${LIKE_API}?slug=${encodeURIComponent(game.slug)}`,
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

  /*
   * =====================================================
   * SOCIAL LINKS
   * =====================================================
   */

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
                        d="M20.317 4.37A19.79 19.79 0 0 0 15.432 2.855a.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.49 0 12.3 12.3 0 0 0-.617-1.249.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.674 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.92 19.92 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.18 13.18 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.794 8.18 1.794 12.061 0a.074.074 0 0 1 .078.009c.12.1.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.226.648-1.873.892a.077.077 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.077.077 0 0 0 .084.029 19.834 19.834 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.032-.027ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.418 2.157-2.418 1.21 0 2.175 1.095 2.157 2.418 0 1.334-.956 2.419-2.157 2.419Zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.418 2.157-2.418 1.21 0 2.175 1.095 2.157 2.418 0 1.334-.956 2.419-2.157 2.419Z"
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

  /*
   * =====================================================
   * SCREENSHOTS
   * =====================================================
   */

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

  /*
   * =====================================================
   * ERROR
   * =====================================================
   */

  function showError() {
    const container = document.querySelector(".game-container");

    if (!container) {
      return;
    }

    container.innerHTML = `

            <div class="api-error">

                اللعبة غير موجودة.

            </div>

        `;
  }

  loadGame();
})();

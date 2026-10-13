(() => {
  "use strict";

  const LIKE_API = "https://arcodex.emadadeldev.workers.dev/likes";

  const $ = (id) => document.getElementById(id);

  async function loadLikes(slug) {
    const count = $("like-count");
    if (!count) return;

    try {
      const response = await fetch(
        `${LIKE_API}?slug=${encodeURIComponent(slug)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

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
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ slug })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

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
      window.requestIdleCallback(
        () => loadLikes(slug),
        { timeout: 1200 }
      );
    } else {
      setTimeout(() => loadLikes(slug), 150);
    }
  }

  function getSlug() {
    const search = location.search;

    if (search.startsWith("?=")) {
      try {
        return decodeURIComponent(
          search.slice(2).split("&")[0] || ""
        ).trim();
      } catch {
        return "";
      }
    }

    const params = new URLSearchParams(search);

    return (
      params.get("slug") ||
      params.get("game") ||
      ""
    ).trim();
  }

  function initLikes() {
    const slug = getSlug();

    if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return;
    }

    setupLikeButton(slug);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLikes, {
      once: true
    });
  } else {
    initLikes();
  }
})();
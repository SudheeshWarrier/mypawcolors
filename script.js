const CONTACT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSf406LHg5ET0dIJkin0vmb-ToxUFGEOFJF9dN6x_kq0fuVsLg/viewform?embedded=true";

const state = {
  catalog: [],
  students: [],
  hobby: [],
  all: [],
  activeCatalogFilter: "all",
  heroArtwork: null,
  searchQuery: "",
  searchFabOpen: false,
  activeModalId: null,
  navOpen: false,
  moreMenuOpen: false
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function subsequenceScore(text, query) {
  if (!text || !query) {
    return 0;
  }

  let textIndex = 0;
  let queryIndex = 0;
  let streak = 0;
  let score = 0;

  while (textIndex < text.length && queryIndex < query.length) {
    if (text[textIndex] === query[queryIndex]) {
      streak += 1;
      score += 1 + streak;
      queryIndex += 1;
    } else {
      streak = 0;
    }
    textIndex += 1;
  }

  return queryIndex === query.length ? score : 0;
}

function normalizeArtwork(record, section, index) {
  const status = String(record?.status || "").toLowerCase() === "sold" ? "sold" : "available";
  const image = record?.image || "my-paw-colors-logo.jpg";

  return {
    id: record?.id ?? `${section}-${index}`,
    section,
    title: record?.title || "Untitled",
    artist: record?.artist || "My Paw Colors Studio",
    category: record?.category || "General",
    image,
    price: record?.price || "On Request",
    status,
    medium: record?.specifications?.medium || "Mixed media",
    size: record?.specifications?.size || "",
    year: record?.specifications?.year || "",
    frame: record?.specifications?.frame || "",
    description: record?.description || "",
    hero: Boolean(record?.hero),
    searchText: normalizeText([
      record?.title,
      record?.artist,
      record?.category,
      record?.price,
      record?.status,
      record?.description,
      record?.specifications?.medium,
      record?.specifications?.size,
      record?.specifications?.year,
      record?.specifications?.frame,
      section
    ].join(" "))
  };
}

async function fetchCollection(fileName, section) {
  try {
    const response = await fetch(fileName);
    if (!response.ok) {
      throw new Error(`Unable to load ${fileName}`);
    }

    const raw = await response.json();
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw
      .filter((item) => item?.image)
      .map((item, index) => normalizeArtwork(item, section, index));
  } catch (error) {
    console.error(error);
    return [];
  }
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function preloadTopHeroImages(artworks, limit = 4) {
  const preloadCandidates = shuffle(artworks).slice(0, limit);
  preloadCandidates.forEach((artwork) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = artwork.image;
    document.head.appendChild(link);
  });
}

function pickHeroArtwork() {
  const heroPool = [...state.catalog, ...state.hobby].filter((item) => item.image);
  if (heroPool.length === 0) {
    return {
      id: "hero-fallback",
      title: "My Paw Colors",
      image: "my-paw-colors-logo.jpg",
      artist: "My Paw Colors Studio",
      category: "Studio",
      price: "Art Studio",
      section: "catalog",
      medium: "Mixed media",
      size: "",
      year: "",
      frame: "",
      status: "available",
      description: ""
    };
  }

  preloadTopHeroImages(heroPool);
  return shuffle(heroPool)[0];
}

function getCatalogCategories() {
  const categories = new Set(state.catalog.map((item) => item.category));
  return ["all", ...categories];
}

function getFilteredCatalog() {
  if (state.activeCatalogFilter === "all") {
    return state.catalog;
  }
  return state.catalog.filter((item) => item.category === state.activeCatalogFilter);
}

function getSectionLabel(section) {
  switch (section) {
    case "catalog":
      return "Catalog";
    case "students":
      return "Students";
    case "hobby":
      return "Hobby";
    default:
      return "Artwork";
  }
}

function getArtworkById(id) {
  return state.all.find((item) => String(item.id) === String(id)) || null;
}

function scoreArtworkMatch(artwork, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const fields = {
    title: normalizeText(artwork.title),
    category: normalizeText(artwork.category),
    artist: normalizeText(artwork.artist),
    medium: normalizeText(artwork.medium),
    section: normalizeText(getSectionLabel(artwork.section)),
    misc: normalizeText([artwork.size, artwork.year, artwork.price, artwork.description].join(" "))
  };

  let score = 0;

  if (fields.title === normalizedQuery) {
    score += 140;
  }
  if (fields.category === normalizedQuery) {
    score += 90;
  }
  if (fields.artist === normalizedQuery) {
    score += 70;
  }
  if (artwork.searchText.includes(normalizedQuery)) {
    score += 60;
  }

  queryTokens.forEach((token) => {
    if (fields.title.includes(token)) {
      score += 34;
    }
    if (fields.category.includes(token)) {
      score += 22;
    }
    if (fields.artist.includes(token)) {
      score += 18;
    }
    if (fields.medium.includes(token)) {
      score += 14;
    }
    if (fields.section.includes(token)) {
      score += 10;
    }
    if (fields.misc.includes(token)) {
      score += 6;
    }

    score += subsequenceScore(fields.title, token) * 2;
    score += subsequenceScore(fields.category, token);
    score += subsequenceScore(fields.artist, token);
  });

  return score;
}

function getSearchResults() {
  if (!state.searchQuery.trim()) {
    return [];
  }

  return state.all
    .map((artwork) => ({ artwork, score: scoreArtworkMatch(artwork, state.searchQuery) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.artwork.title.localeCompare(right.artwork.title))
    .map((entry) => entry.artwork);
}

function sectionHead(kicker, title, subtitle) {
  return `
    <header class="section-head reveal">
      <div class="section-head__kicker">${escapeHtml(kicker)}</div>
      <h2>${escapeHtml(title)}</h2>
      ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
    </header>
  `;
}

function renderCard(artwork) {
  return `
    <button class="art-card reveal" type="button" data-artwork-id="${escapeHtml(artwork.id)}" aria-label="View details for ${escapeHtml(artwork.title)}">
      <img src="${escapeHtml(artwork.image)}" alt="${escapeHtml(artwork.title)} by ${escapeHtml(artwork.artist)}" loading="lazy" decoding="async">
      <span class="sr-only">${escapeHtml(artwork.title)} by ${escapeHtml(artwork.artist)}</span>
    </button>
  `;
}

function renderMasonry(items, mode = "collection") {
  if (!items.length) {
    if (mode === "search") {
      return '<div class="empty-state">No match yet. Try a new keyword.</div>';
    }
    return '<div class="empty-state">Coming soon. New artworks will appear here soon.</div>';
  }

  return `<div class="masonry">${items.map((item) => renderCard(item)).join("")}</div>`;
}

function renderSearchSection() {
  const results = getSearchResults();
  const hasQuery = Boolean(state.searchQuery.trim());
  const inputValue = escapeHtml(state.searchQuery);

  return `
    <section id="search" class="section section-search" data-section-tone="search" data-nav-target="search">
      ${sectionHead("Explore", "Find Art", "")}
      <div class="search-panel reveal">
        <label class="search-bar" for="globalSearchInput">
          <input id="globalSearchInput" type="search" placeholder="Try birds, petals, pastel, student, 2024..." value="${inputValue}" autocomplete="off">
          <button class="search-clear ${hasQuery ? "visible" : ""}" type="button" id="clearSearchButton" aria-label="Clear search">Clear</button>
        </label>
      </div>
      <div id="searchResults">${hasQuery ? renderMasonry(results, "search") : ""}</div>
    </section>
  `;
}

function renderCatalogSection() {
  const categories = getCatalogCategories();
  const cards = renderMasonry(getFilteredCatalog());

  return `
    <section id="catalog" class="section" data-section-tone="catalog" data-nav-target="catalog">
      ${sectionHead("Collection", "Curated Gallery", "Original pieces. Ready for your space.")}
      <div class="collection-tools reveal" role="tablist" aria-label="Catalog category filters">
        ${categories
          .map((category) => {
            const activeClass = category === state.activeCatalogFilter ? "active" : "";
            const label = category === "all" ? "All" : category;
            return `<button class="filter-chip ${activeClass}" data-filter="${escapeHtml(category)}" role="tab" aria-selected="${category === state.activeCatalogFilter}">${escapeHtml(label)}</button>`;
          })
          .join("")}
      </div>
      <div id="catalogGrid">${cards}</div>
    </section>
  `;
}

function renderStudentsSection() {
  return `
    <section id="students" class="section" data-section-tone="students" data-nav-target="students">
      ${sectionHead("Community", "Student Spotlight", "Fresh work from guided studio classes.")}
      ${renderMasonry(state.students)}
    </section>
  `;
}

function renderHobbySection() {
  return `
    <section id="hobby" class="section" data-section-tone="hobby" data-nav-target="hobby">
      ${sectionHead("Practice", "Studio Studies", "Practice pieces made for learning.")}
      <div class="legal-notice reveal">
        <p><strong>Educational Use:</strong> These are study works for practice. They are inspired by master artists. They are <strong>not for sale</strong> and not for commercial use. Rights remain with the original artists or estates.</p>
      </div>
      ${renderMasonry(state.hobby)}
    </section>
  `;
}

function renderClassesSection() {
  return `
    <section id="classes" class="section" data-section-tone="classes" data-nav-target="classes">
      ${sectionHead("Learning", "Studio Workshops", "Learn with clear guidance and real practice.")}
      <div class="card-grid">
        <article class="info-card reveal">
          <h3>Virtual Studio</h3>
          <p>Learn from home. Stay connected to live studio energy.</p>
          <ul>
            <li>Live interactive classes</li>
            <li>Group or one-on-one format</li>
            <li>Personal feedback each session</li>
            <li>Flexible timing options</li>
            <li>Available across US, Canada, Australia, Singapore, Malaysia, and India</li>
          </ul>
        </article>
        <article class="info-card reveal">
          <h3>Physical Studio</h3>
          <p>Hands-on sessions with close mentoring and focused attention.</p>
          <ul>
            <li>Hands-on mentoring</li>
            <li>Premium studio materials</li>
            <li>Private one-on-one classes</li>
            <li>Great for beginners and advanced learners</li>
            <li>Kalyani Nagar, Pune, Maharashtra, India</li>
          </ul>
        </article>
      </div>
    </section>
  `;
}

function renderAboutSection() {
  return `
    <section id="about" class="section" data-section-tone="about" data-nav-target="about">
      ${sectionHead("Story", "Our Story", "A small studio. A big love for art.")}
      <div class="about-layout">
        <figure class="about-frame reveal">
          <img src="my-paw-colors-logo.jpg" alt="My Paw Colors story image" loading="lazy">
        </figure>
        <div class="chapter-list">
          <article class="chapter reveal">
            <strong>01  THE VISION</strong>
            <p>My Paw Colors began as a simple dream. Build a warm space for creative expression.</p>
          </article>
          <article class="chapter reveal">
            <strong>02  THE COLLECTION</strong>
            <p>Our collection blends classic and contemporary styles. Every piece tells a clear, personal story.</p>
          </article>
          <article class="chapter reveal">
            <strong>03  THE COMMUNITY</strong>
            <p>We teach, mentor, and grow together. Every artist level is welcome here.</p>
          </article>
        </div>
      </div>
    </section>
  `;
}

function renderContactSection() {
  return `
    <section id="contact" class="section" data-section-tone="contact" data-nav-target="contact">
      ${sectionHead("Connect", "Connect With Us", "Ask about commissions, classes, or collaborations.")}
      <div class="contact-frame reveal">
        <iframe src="${CONTACT_FORM_URL}" title="Contact form"></iframe>
      </div>
    </section>
  `;
}

function renderArtworkModal() {
  return `
    <div class="art-modal" id="artModal" aria-hidden="true">
      <div class="art-modal__backdrop" data-close-modal></div>
      <div class="art-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="artModalTitle">
        <div class="art-modal__toolbar" aria-label="Artwork actions">
          <button class="art-modal__icon-button" type="button" id="shareModalButton" aria-label="Share artwork link" data-modal-action="share">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 8a3 3 0 1 0-2.816-4H15a3 3 0 0 0 .138 1.074l-6.372 3.186a3 3 0 0 0-2.81-1.917 3 3 0 1 0 2.746 4.186l6.512 3.256A3 3 0 0 0 15 15a3 3 0 1 0 .184 1.019L8.672 12.76A3 3 0 0 0 9 11c0-.304-.045-.598-.128-.876l6.266-3.133A3 3 0 0 0 18 8Z" fill="currentColor"/>
            </svg>
          </button>
          <button class="art-modal__icon-button" type="button" id="fullscreenModalButton" aria-label="View image in fullscreen" data-modal-action="fullscreen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="art-modal__icon-button art-modal__icon-button--close" type="button" id="closeModalButton" aria-label="Close artwork details" data-modal-action="close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <line x1="2.5" y1="2.5" x2="15.5" y2="15.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="15.5" y1="2.5" x2="2.5" y2="15.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div id="artModalContent"></div>
      </div>
    </div>
  `;
}

function renderFloatingSearch() {
  return `
    <div class="search-fab ${state.searchFabOpen ? "is-open" : ""}" id="searchFab">
      <div class="search-fab__panel" id="searchFabPanel">
        <label class="search-fab__field" for="floatingSearchInput">
          <input id="floatingSearchInput" type="search" placeholder="Find a piece..." value="${escapeHtml(state.searchQuery)}" autocomplete="off">
        </label>
        <div class="search-fab__actions">
          <button class="search-fab__action" type="button" id="floatingSearchGo">Search</button>
          <button class="search-fab__action search-fab__action--ghost" type="button" id="floatingSearchClose">Close</button>
        </div>
      </div>
      <button class="search-fab__toggle" type="button" id="floatingSearchToggle" aria-expanded="${state.searchFabOpen}" aria-controls="searchFabPanel" aria-label="Open smart search">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
          <path d="M20 20L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  `;
}

function renderLayout() {
  const hero = state.heroArtwork;
  const app = document.getElementById("app");
  if (!app) {
    return;
  }

  const moreExpanded = state.moreMenuOpen ? "true" : "false";
  const navExpanded = state.navOpen ? "true" : "false";

  app.innerHTML = `
    <header class="topbar">
      <div class="topbar__inner">
        <a class="brand" href="#hero" aria-label="Go to home section">
          <img src="my-paw-colors-logo.jpg" alt="My Paw Colors logo">
          <span>My Paw Colors</span>
        </a>
        <button class="nav-toggle" type="button" id="navToggleButton" aria-expanded="${navExpanded}" aria-controls="primaryNav">Menu</button>
        <nav class="site-nav ${state.navOpen ? "is-open" : ""}" id="primaryNav" aria-label="Primary navigation">
          <div class="nav-list">
            <a class="nav-link nav-link--top" data-nav-link="catalog" href="#catalog">Gallery</a>
            <a class="nav-link nav-link--top" data-nav-link="students" href="#students">Student Art</a>
            <a class="nav-link nav-link--top" data-nav-link="hobby" href="#hobby">Studies</a>
            <a class="nav-link nav-link--top" data-nav-link="contact" href="#contact">Contact</a>
            <div class="nav-group ${state.moreMenuOpen ? "is-open" : ""}">
              <button class="nav-link nav-link--button nav-link--top" type="button" id="moreMenuButton" aria-expanded="${moreExpanded}" aria-controls="moreMenuPanel">More</button>
              <div class="submenu" id="moreMenuPanel">
                <a class="nav-link nav-link--sub" data-nav-link="classes" href="#classes">Studio Workshops</a>
                <a class="nav-link nav-link--sub" data-nav-link="about" href="#about">Our Story</a>
              </div>
            </div>
            <span class="nav-slider" id="navSlider" aria-hidden="true"></span>
          </div>
        </nav>
      </div>
    </header>

    <main>
      <section id="hero" class="section" data-section-tone="hero" data-nav-target="hero">
        <div class="hero">
          <div class="hero-copy reveal">
            <div class="section-head__kicker">Art Studio</div>
            <h1>
              <span>My Paw</span>
              <span>Colors</span>
            </h1>
            <p>Original art. Student creations. Practice studies. Learn with us.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="#catalog">Explore Catalog</a>
            </div>
            <div class="hero-meta">
              <div><strong>${state.catalog.length}</strong><span>Gallery pieces</span></div>
              <div><strong>${state.students.length}</strong><span>Student works</span></div>
              <div><strong>${state.hobby.length}</strong><span>Study works</span></div>
            </div>
          </div>
          <figure class="hero-media reveal ${hero ? "is-clickable" : ""}" ${hero ? `data-artwork-id="${escapeHtml(hero.id)}" tabindex="0" role="button" aria-label="View details for ${escapeHtml(hero.title)}"` : ""}>
            <img src="${escapeHtml(hero.image)}" alt="${escapeHtml(hero.title)} by ${escapeHtml(hero.artist)}" fetchpriority="high" loading="eager" decoding="async">
            <figcaption class="hero-media__caption">
              <strong>${escapeHtml(hero.title)}</strong><br>
              ${escapeHtml(hero.artist)}  ${escapeHtml(hero.category)}
            </figcaption>
          </figure>
        </div>
      </section>

      ${renderSearchSection()}
      ${renderCatalogSection()}
      ${renderStudentsSection()}
      ${renderHobbySection()}
      ${renderContactSection()}
      ${renderClassesSection()}
      ${renderAboutSection()}
    </main>

    <footer class="site-footer" aria-label="Site footer">
      <div class="site-footer__brand">My Paw Colors</div>
      <div class="site-footer__links" aria-label="Social links">
        <a class="footer-link" href="https://www.instagram.com/mypawcolors" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
            <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
          </svg>
          <span>@mypawcolors</span>
        </a>
        <a class="footer-link" href="https://www.facebook.com/mypawcolors" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v4h4v-4h3.1l.9-4H13V9c0-.6.4-1 1-1Z" fill="currentColor"/>
          </svg>
          <span>/mypawcolors</span>
        </a>
        <a class="footer-link" href="mailto:hello@mypawcolors.com" aria-label="Email">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="m4 7 8 6 8-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>Email</span>
        </a>
      </div>
      <div class="site-footer__copy">Copyright 2026 My Paw Colors</div>
    </footer>

    ${renderFloatingSearch()}
    ${renderArtworkModal()}
  `;

  syncModal();
  app.setAttribute("aria-busy", "false");
}

function renderModalBody(artwork) {
  const detailRows = [
    ["Section", getSectionLabel(artwork.section)],
    ["Category", artwork.category],
    ["Artist", artwork.artist],
    ["Medium", artwork.medium],
    ["Size", artwork.size],
    ["Year", artwork.year],
    ["Frame", artwork.frame],
    ["Price", artwork.section === "catalog" ? artwork.price : "Not for sale"],
    ["Status", artwork.section === "catalog" ? (artwork.status === "sold" ? "Sold" : "Available") : "Display only"]
  ].filter(([, value]) => value);
  const wideLabels = new Set(["Artist", "Medium"]);

  return `
    <div class="art-modal__grid">
      <figure class="art-modal__media">
        <img src="${escapeHtml(artwork.image)}" alt="${escapeHtml(artwork.title)} by ${escapeHtml(artwork.artist)}">
      </figure>
      <div class="art-modal__details">
        <div class="art-modal__details-top">
          <div class="section-head__kicker">${escapeHtml(getSectionLabel(artwork.section))}</div>
        </div>
        <h2 id="artModalTitle">${escapeHtml(artwork.title)}</h2>
        <p class="art-modal__summary">${escapeHtml(artwork.description || "A quick view of medium, size, and details.")}</p>
        <dl class="detail-list">
          ${detailRows
            .map(([label, value]) => {
              const itemClass = wideLabels.has(label) ? "detail-item detail-item--wide" : "detail-item";
              return `<div class="${itemClass}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
            })
            .join("")}
        </dl>
      </div>
    </div>
  `;
}

function getArtworkIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("art");
  return id ? String(id) : null;
}

function setArtworkIdInUrl(artworkId) {
  const url = new URL(window.location.href);
  url.searchParams.set("art", String(artworkId));
  history.replaceState(null, "", url);
}

function clearArtworkIdFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("art");
  history.replaceState(null, "", url);
}

function buildArtworkDeepLink(artwork) {
  const url = new URL(window.location.href);
  url.searchParams.set("art", String(artwork.id));
  return url.toString();
}

async function shareArtwork(artwork) {
  if (!artwork) {
    return;
  }

  const shareUrl = buildArtworkDeepLink(artwork);
  const shareText = `Take a look at "${artwork.title}" from My Paw Colors`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: artwork.title,
        text: shareText,
        url: shareUrl
      });
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      const shareButton = document.getElementById("shareModalButton");
      if (shareButton) {
        const previousLabel = shareButton.getAttribute("aria-label") || "Share artwork link";
        shareButton.setAttribute("aria-label", "Link copied");
        window.setTimeout(() => {
          shareButton.setAttribute("aria-label", previousLabel);
        }, 1600);
      }
      return;
    } catch (error) {
      console.warn("Clipboard write failed", error);
    }
  }

  const whatsappText = encodeURIComponent(`${shareText} ${shareUrl}`);
  window.open(`https://wa.me/?text=${whatsappText}`, "_blank", "noopener,noreferrer");
}

function viewFullscreenArtwork() {
  const modalImage = document.querySelector(".art-modal__media img");
  if (!modalImage) {
    return;
  }

  const fullscreenTarget = modalImage;
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {
      window.open(modalImage.src, "_blank", "noopener,noreferrer");
    });
    return;
  }

  if (fullscreenTarget.requestFullscreen) {
    fullscreenTarget.requestFullscreen().catch(() => {
      window.open(modalImage.src, "_blank", "noopener,noreferrer");
    });
    return;
  }

  if (fullscreenTarget.webkitRequestFullscreen) {
    fullscreenTarget.webkitRequestFullscreen();
    return;
  }

  window.open(modalImage.src, "_blank", "noopener,noreferrer");
}

function syncModal() {
  const modal = document.getElementById("artModal");
  const content = document.getElementById("artModalContent");
  if (!modal || !content) {
    return;
  }

  const artwork = state.activeModalId ? getArtworkById(state.activeModalId) : null;
  const isOpen = Boolean(artwork);

  modal.classList.toggle("is-open", isOpen);
  modal.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("modal-open", isOpen);
  content.innerHTML = artwork ? renderModalBody(artwork) : "";
}

function updateSearchResults() {
  const resultsContainer = document.getElementById("searchResults");
  const clearButton = document.getElementById("clearSearchButton");
  if (!resultsContainer || !clearButton) {
    return;
  }

  const results = getSearchResults();
  const hasQuery = Boolean(state.searchQuery.trim());

  clearButton.classList.toggle("visible", hasQuery);
  resultsContainer.innerHTML = hasQuery ? renderMasonry(results) : "";
  initRevealObserver();
  wireArtworkInteractions();
}

function getSliderAnchor(referenceLink) {
  if (!referenceLink) {
    const activeSubmenuLink = document.querySelector(".submenu .nav-link.active");
    if (activeSubmenuLink) {
      return document.getElementById("moreMenuButton");
    }
    return document.querySelector(".nav-list > .nav-link.active, .nav-group > .nav-link.active");
  }

  if (referenceLink.closest(".submenu")) {
    return document.getElementById("moreMenuButton");
  }

  if (referenceLink.matches(".nav-list > .nav-link") || referenceLink.matches(".nav-group > .nav-link")) {
    return referenceLink;
  }

  return document.querySelector(".nav-list > .nav-link.active, .nav-group > .nav-link.active");
}

function updateNavSlider(referenceLink) {
  const slider = document.getElementById("navSlider");
  const navList = document.querySelector(".nav-list");
  if (!slider || !navList || window.matchMedia("(max-width: 720px)").matches) {
    if (slider) {
      slider.style.width = "0px";
    }
    return;
  }

  const activeLink = getSliderAnchor(referenceLink);
  if (!activeLink) {
    slider.style.width = "0px";
    return;
  }

  const navListRect = navList.getBoundingClientRect();
  const activeItemRect = activeLink.getBoundingClientRect();
  const left = activeItemRect.left - navListRect.left;
  const width = activeLink.offsetWidth;
  const maxLeft = Math.max(0, navList.clientWidth - width);

  slider.style.width = `${width}px`;
  slider.style.left = `${Math.min(left, maxLeft)}px`;
}

function updateCatalogGrid() {
  const catalogGrid = document.getElementById("catalogGrid");
  if (!catalogGrid) {
    return;
  }

  catalogGrid.innerHTML = renderMasonry(getFilteredCatalog());
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    const active = chip.getAttribute("data-filter") === state.activeCatalogFilter;
    chip.classList.toggle("active", active);
    chip.setAttribute("aria-selected", String(active));
  });
  initRevealObserver();
  wireArtworkInteractions();
}

function setMoreMenuOpen(open) {
  state.moreMenuOpen = open;
  const navGroup = document.querySelector(".nav-group");
  const button = document.getElementById("moreMenuButton");
  if (navGroup) {
    navGroup.classList.toggle("is-open", open);
  }
  if (button) {
    button.setAttribute("aria-expanded", String(open));
  }
}

function setNavOpen(open) {
  state.navOpen = open;
  const nav = document.getElementById("primaryNav");
  const button = document.getElementById("navToggleButton");
  if (nav) {
    nav.classList.toggle("is-open", open);
  }
  if (button) {
    button.setAttribute("aria-expanded", String(open));
  }
}

function openModal(artworkId) {
  state.activeModalId = artworkId;
  setArtworkIdInUrl(artworkId);
  syncModal();
}

function closeModal() {
  state.activeModalId = null;
  clearArtworkIdFromUrl();
  syncModal();
}

function wireCatalogFilters() {
  document.querySelectorAll(".filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCatalogFilter = button.getAttribute("data-filter") || "all";
      updateCatalogGrid();
    });
  });
}

function wireSearch() {
  const input = document.getElementById("globalSearchInput");
  const clearButton = document.getElementById("clearSearchButton");
  if (!input || !clearButton) {
    return;
  }

  input.addEventListener("input", () => {
    state.searchQuery = input.value;
    updateSearchResults();
  });

  clearButton.addEventListener("click", () => {
    state.searchQuery = "";
    input.value = "";
    updateSearchResults();
    input.focus();
  });
}

function setSearchFabOpen(open) {
  state.searchFabOpen = open;
  const fab = document.getElementById("searchFab");
  const toggle = document.getElementById("floatingSearchToggle");
  if (fab) {
    fab.classList.toggle("is-open", open);
  }
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(open));
  }
}

function syncSearchInputs() {
  const globalInput = document.getElementById("globalSearchInput");
  const floatingInput = document.getElementById("floatingSearchInput");
  if (globalInput && globalInput.value !== state.searchQuery) {
    globalInput.value = state.searchQuery;
  }
  if (floatingInput && floatingInput.value !== state.searchQuery) {
    floatingInput.value = state.searchQuery;
  }
}

function goToSearchSection() {
  const searchSection = document.getElementById("search");
  if (searchSection) {
    searchSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  window.setTimeout(() => {
    const input = document.getElementById("globalSearchInput");
    input?.focus();
  }, 260);
}

function wireFloatingSearch() {
  const toggle = document.getElementById("floatingSearchToggle");
  const close = document.getElementById("floatingSearchClose");
  const go = document.getElementById("floatingSearchGo");
  const input = document.getElementById("floatingSearchInput");
  if (!toggle || !close || !go || !input) {
    return;
  }

  const runSearch = () => {
    state.searchQuery = input.value;
    syncSearchInputs();
    updateSearchResults();
  };

  toggle.addEventListener("click", () => {
    const next = !state.searchFabOpen;
    setSearchFabOpen(next);
    if (next) {
      input.focus();
      input.select();
    }
  });

  close.addEventListener("click", () => {
    setSearchFabOpen(false);
  });

  input.addEventListener("input", runSearch);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
      goToSearchSection();
      setSearchFabOpen(false);
    }
  });

  go.addEventListener("click", () => {
    runSearch();
    goToSearchSection();
    setSearchFabOpen(false);
  });
}

function wireSmoothNav() {
  const links = document.querySelectorAll('.nav-link[href^="#"], .btn[href^="#"], .brand[href^="#"]');
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId) {
        return;
      }
      const target = document.querySelector(targetId);
      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setNavOpen(false);
      if (targetId !== "#classes" && targetId !== "#about") {
        setMoreMenuOpen(false);
      }
    });
  });
}

function wireNavigationMenus() {
  const navToggleButton = document.getElementById("navToggleButton");
  const moreMenuButton = document.getElementById("moreMenuButton");
  const navLinks = document.querySelectorAll(".nav-link");

  if (navToggleButton) {
    navToggleButton.addEventListener("click", () => {
      setNavOpen(!state.navOpen);
    });
  }

  if (moreMenuButton) {
    moreMenuButton.addEventListener("click", () => {
      setMoreMenuOpen(!state.moreMenuOpen);
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => updateNavSlider(link));
    link.addEventListener("focus", () => updateNavSlider(link));
  });

  const navList = document.querySelector(".nav-list");
  if (navList) {
    navList.addEventListener("mouseleave", () => updateNavSlider());
  }

  window.addEventListener("resize", () => updateNavSlider());
}

function wireArtworkInteractions() {
  document.querySelectorAll("[data-artwork-id]").forEach((trigger) => {
    if (trigger.dataset.bound === "true") {
      return;
    }

    trigger.dataset.bound = "true";
    trigger.addEventListener("click", () => {
      const artworkId = trigger.getAttribute("data-artwork-id");
      if (artworkId) {
        openModal(artworkId);
      }
    });

    if (trigger.classList.contains("hero-media")) {
      trigger.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          const artworkId = trigger.getAttribute("data-artwork-id");
          if (artworkId) {
            openModal(artworkId);
          }
        }
      });
    }
  });
}

function wireModal() {
  const modal = document.getElementById("artModal");
  const closeButton = document.getElementById("closeModalButton");
  if (!modal || !closeButton) {
    return;
  }

  closeButton.addEventListener("click", closeModal);
  modal.querySelectorAll("[data-close-modal]").forEach((element) => {
    element.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-modal-action]");
    if (!actionButton) {
      return;
    }

    const action = actionButton.getAttribute("data-modal-action");
    if (action === "share") {
      shareArtwork(getArtworkById(state.activeModalId));
    } else if (action === "fullscreen") {
      viewFullscreenArtwork();
    } else if (action === "close") {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.activeModalId) {
      closeModal();
    }
  });
}

function initSectionObserver() {
  const sections = Array.from(document.querySelectorAll("main .section"));
  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
  const navGroup = document.querySelector(".nav-group");
  if (!sections.length) {
    return;
  }

  const setActiveSection = (id) => {
    document.body.className = `section-${id}`;

    navLinks.forEach((link) => {
      const active = link.getAttribute("data-nav-link") === id;
      link.classList.toggle("active", active);
    });

    if (navGroup) {
      navGroup.classList.toggle("is-active", id === "classes" || id === "about");
    }

    updateNavSlider();
  };

  const getCurrentSectionId = () => {
    const viewportPivot = window.innerHeight * (window.matchMedia("(max-width: 720px)").matches ? 0.28 : 0.32);
    let firstAbovePivot = null;

    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      const sectionId = section.getAttribute("data-nav-target") || section.id;

      if (rect.top <= viewportPivot && rect.bottom > viewportPivot) {
        return sectionId;
      }

      if (rect.top <= viewportPivot) {
        firstAbovePivot = sectionId;
      }
    }

    if (firstAbovePivot) {
      return firstAbovePivot;
    }

    return sections[0].getAttribute("data-nav-target") || sections[0].id;
  };

  let ticking = false;
  const onScrollOrResize = () => {
    if (ticking) {
      return;
    }
    ticking = true;

    window.requestAnimationFrame(() => {
      setActiveSection(getCurrentSectionId());
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  onScrollOrResize();
}

function initRevealObserver() {
  const revealItems = document.querySelectorAll(".reveal:not(.in-view)");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function wireDocumentDismissals() {
  document.addEventListener("click", (event) => {
    const navGroup = document.querySelector(".nav-group");
    if (state.moreMenuOpen && navGroup && !navGroup.contains(event.target)) {
      setMoreMenuOpen(false);
    }

    const searchFab = document.getElementById("searchFab");
    if (state.searchFabOpen && searchFab && !searchFab.contains(event.target)) {
      setSearchFabOpen(false);
    }
  });
}

function attachInteractions() {
  wireCatalogFilters();
  wireSearch();
  wireFloatingSearch();
  wireSmoothNav();
  wireNavigationMenus();
  wireArtworkInteractions();
  wireModal();
  wireDocumentDismissals();
  initSectionObserver();
  initRevealObserver();
  updateNavSlider();
}

async function bootstrap() {
  const [catalog, students, hobby] = await Promise.all([
    fetchCollection("catalog.json", "catalog"),
    fetchCollection("students.json", "students"),
    fetchCollection("hobby.json", "hobby")
  ]);

  state.catalog = catalog;
  state.students = students;
  state.hobby = hobby;
  state.all = [...catalog, ...students, ...hobby];
  state.heroArtwork = pickHeroArtwork();
  state.moreMenuOpen = false;
  state.navOpen = false;
  const deepLinkedId = getArtworkIdFromUrl();
  state.activeModalId = deepLinkedId && getArtworkById(deepLinkedId) ? deepLinkedId : null;

  if (deepLinkedId && !state.activeModalId) {
    clearArtworkIdFromUrl();
  }

  renderLayout();
  attachInteractions();
}

document.addEventListener("DOMContentLoaded", bootstrap);

let projects = window.portfolioProjects || (typeof portfolioProjects === "undefined" ? [] : portfolioProjects);
let orderedProjects = [];
let featuredProjectIds = window.homepageFeaturedProjectIds || [];
let featuredProjects = [];
const homepageContent = window.homepageContent || null;
const assetCacheKey = "20260612-refresh";
const contactIconCacheKey = Date.now().toString(36);

const refreshProjectState = () => {
  orderedProjects = [...projects].sort((a, b) => Number(a.number) - Number(b.number));
  featuredProjects = featuredProjectIds
    .map((id) => projects.find((project) => project.id === id))
    .filter(Boolean);
};

const normalizeListValue = (item) => {
  if (typeof item === "string") {
    return item;
  }

  if (!item || typeof item !== "object") {
    return "";
  }

  return item.item || item.path || item.value || item.id || item.group || "";
};

const normalizeProject = (project) => ({
  ...project,
  number: String(project.number || ""),
  media: Array.isArray(project.media) ? project.media.map(normalizeListValue).filter(Boolean) : [],
  fadeGroups: Array.isArray(project.fadeGroups) ? project.fadeGroups.map(normalizeListValue).filter(Boolean) : []
});

const loadPortfolioContent = async () => {
  refreshProjectState();

  try {
    const response = await fetch(versionedAsset("content/projects.json"), { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const content = await response.json();
    if (!Array.isArray(content.projects)) {
      return;
    }

    projects = content.projects.map(normalizeProject);
    featuredProjectIds = Array.isArray(content.featuredProjectIds)
      ? content.featuredProjectIds.map(normalizeListValue).filter(Boolean)
      : featuredProjectIds;
    window.portfolioProjects = projects;
    window.homepageFeaturedProjectIds = featuredProjectIds;
    refreshProjectState();
  } catch (error) {
    refreshProjectState();
  }
};

const escapeHTML = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const setLocalizedText = (element, value) => {
  if (!element || !value) {
    return;
  }

  element.dataset.zh = value.zh || "";
  element.dataset.en = value.en || value.zh || "";
  element.textContent = value.zh || "";
};

const versionedAsset = (src) => {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  return `${src}${src.includes("?") ? "&" : "?"}v=${assetCacheKey}`;
};

const contactIcon = (type) => {
  const customIcon = `<img src="首页联系图标/${type}.svg?v=${contactIconCacheKey}" alt="" loading="lazy" onerror="this.remove()" />`;
  const icons = {
    email: `
      ${customIcon}
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="13" rx="4"></rect>
        <path d="M5.5 8l6.5 5 6.5-5"></path>
      </svg>
    `,
    phone: `
      ${customIcon}
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.2 4.8l2 4.2-2.1 1.5c1.1 2.2 2.8 3.9 5.1 5l1.5-2.1 4.4 1.9c.6.3.9.9.7 1.5-.4 1.6-1.9 2.7-3.6 2.7-6.2-.2-11.2-5.2-11.5-11.4C4.6 6.4 5.7 5 7.3 4.6c.4-.1.7 0 .9.2z"></path>
      </svg>
    `,
    wechat: `
      ${customIcon}
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10.3 17.5c-3.5 0-6.3-2.2-6.3-5s2.8-5 6.3-5 6.3 2.2 6.3 5-2.8 5-6.3 5z"></path>
        <path d="M14.2 11.3c3.2.2 5.8 2.2 5.8 4.7 0 2.6-2.7 4.7-6 4.7-1 0-2-.2-2.8-.6l-2.3.9.7-1.8"></path>
        <path d="M8.2 11h.1M12.1 11h.1M13.5 15.4h.1M16.9 15.4h.1"></path>
      </svg>
    `
  };

  return icons[type] || "";
};

const contactItem = ({ type, label, value, href, copy }) => {
  const tag = href || copy ? "a" : "span";
  const hrefAttr = href ? ` href="${escapeHTML(href)}"` : copy ? ` href="#"` : "";
  const copyAttrs = copy
    ? ` data-copy-email="${escapeHTML(value)}" data-copy-success-zh="${escapeHTML(copy.zh)}" data-copy-success-en="${escapeHTML(copy.en)}"`
    : "";
  const copyClass = copy ? " copy-email-link" : "";

  return `
    <${tag} class="contact-item${copyClass}"${hrefAttr}${copyAttrs}>
      <span class="contact-icon contact-icon-${type}" aria-hidden="true">${contactIcon(type)}</span>
      <span class="contact-text">
        <span class="contact-label" data-zh="${escapeHTML(label.zh)}" data-en="${escapeHTML(label.en)}">${escapeHTML(label.zh)}</span>
        <span class="contact-value">${escapeHTML(value)}</span>
      </span>
    </${tag}>
  `;
};

const renderTagRows = (rows = []) =>
  rows
    .map((row) => {
      const items = row.items.map((item) => `<b>${escapeHTML(item)}</b>`).join("");
      const className = ["tag-row", row.className || ""].filter(Boolean).join(" ");
      return `
        <div class="${className}">
          <span>${items}</span>
          <span aria-hidden="true">${items}</span>
        </div>
      `;
    })
    .join("");

const applyHomepageContent = () => {
  if (!homepageContent || !document.querySelector("#top")) {
    return;
  }

  if (homepageContent.pageTitle) {
    document.title = homepageContent.pageTitle;
  }

  if (homepageContent.description) {
    document.querySelector('meta[name="description"]')?.setAttribute("content", homepageContent.description);
  }

  setLocalizedText(document.querySelector(".brand-mark span"), homepageContent.navigation?.home);
  setLocalizedText(document.querySelector('.nav-links a[href="works.html"]'), homepageContent.navigation?.works);
  setLocalizedText(document.querySelector('.nav-links a[href="about.html"]'), homepageContent.navigation?.resume);

  const wordmark = document.querySelector(".hero-title img");
  if (wordmark && homepageContent.hero?.wordmarkAlt) {
    wordmark.alt = homepageContent.hero.wordmarkAlt;
  }

  const heroLede = document.querySelector(".hero-lede");
  if (heroLede && homepageContent.hero?.descriptionLines) {
    heroLede.innerHTML = homepageContent.hero.descriptionLines
      .map((line) => `<span>${escapeHTML(line)}</span>`)
      .join("");
  }

  setLocalizedText(document.querySelector(".section-toolbar h2"), homepageContent.featuredWorks?.title);
  setLocalizedText(document.querySelector(".view-all-link"), homepageContent.featuredWorks?.allWorks);

  const tagLink = document.querySelector(".tag-stream-link");
  if (tagLink && homepageContent.tags) {
    tagLink.innerHTML = renderTagRows(homepageContent.tags);
  }

  setLocalizedText(document.querySelector(".contact .kicker"), homepageContent.contact?.kicker);
  setLocalizedText(document.querySelector("#contact-title"), homepageContent.contact?.title);

  const contactLinks = document.querySelector(".contact-links");
  if (contactLinks && homepageContent.contact) {
    const { email, phone, wechat } = homepageContent.contact;
    contactLinks.innerHTML = [
      contactItem({ type: "email", label: email.label, value: email.value, copy: email.copySuccess }),
      contactItem({ type: "phone", label: phone.label, value: phone.value }),
      contactItem({ type: "wechat", label: wechat.label, value: wechat.value, href: wechat.href })
    ].join("");
  }
};

const getPreferredLanguage = () => {
  const stored = localStorage.getItem("portfolio-language");
  if (stored === "en" || stored === "zh") {
    return stored;
  }

  return document.documentElement.lang.startsWith("zh") ? "zh" : "en";
};

const setLanguage = (language) => {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  localStorage.setItem("portfolio-language", language);

  document.querySelectorAll("[data-zh][data-en]").forEach((element) => {
    element.textContent = element.dataset[language];
  });

  document.querySelectorAll("[data-lang-option]").forEach((element) => {
    element.classList.toggle("is-active", element.dataset.langOption === language);
  });
};

const mediaType = (src) => {
  const extension = src.split(".").pop().toLowerCase();
  return ["mp4", "mov", "webm"].includes(extension) ? "video" : "image";
};

const mediaElement = (src, alt = "") => {
  if (mediaType(src) === "video") {
    return `<video src="${versionedAsset(src)}" controls playsinline preload="metadata" aria-label="${alt}"></video>`;
  }

  return `<img src="${versionedAsset(src)}" alt="${alt}" loading="lazy" />`;
};

const homepageCoverPath = (project, extension = "jpg") => versionedAsset(`首页作品封面/${project.id}.${extension}`);

const homepageCoverElement = (project) => `
  <img
    src="${homepageCoverPath(project, "jpg")}"
    data-cover-step="jpg"
    data-cover-base="首页作品封面/${project.id}"
    data-cover-fallback="${versionedAsset(project.cover)}"
    alt="${project.title} project preview"
    loading="lazy"
  />
`;

const sequenceInfo = (src, fallbackIndex) => {
  const file = src.split("/").pop().replace(/\.[^.]+$/, "");
  const match = file.match(/^(.*?)(\d+)(?:-(\d+))?$/);

  if (!match) {
    return {
      key: file,
      order: fallbackIndex + 1,
      subOrder: 0,
      label: String(fallbackIndex + 1).padStart(3, "0")
    };
  }

  const order = Number(match[2]);
  const subOrder = match[3] ? Number(match[3]) : 0;

  return {
    key: `${match[1]}${match[2]}`,
    order,
    subOrder,
    label: match[2].padStart(3, "0")
  };
};

const groupedMediaRows = (media) => {
  const groups = new Map();

  media.forEach((src, index) => {
    const info = sequenceInfo(src, index);
    if (!groups.has(info.key)) {
      groups.set(info.key, {
        label: info.label,
        order: info.order,
        items: []
      });
    }

    groups.get(info.key).items.push({ src, subOrder: info.subOrder });
  });

  return [...groups.values()]
    .sort((a, b) => a.order - b.order)
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => a.subOrder - b.subOrder)
    }));
};

const projectCard = (project, options = {}) => {
  const duplicateAttributes = options.duplicate ? ` aria-hidden="true"` : "";
  const duplicateId = options.duplicate ? `-loop-${options.index}` : "";
  const duplicateTabIndex = options.duplicate ? ` tabindex="-1"` : "";

  return `
  <article class="project-card" data-category="${project.category}" id="project-${project.id}${duplicateId}"${duplicateAttributes}>
    <a href="project.html?id=${project.id}"${duplicateTabIndex}>
      ${homepageCoverElement(project)}
      <span class="project-meta" data-zh="${project.zh.meta} / ${project.year}" data-en="${project.en.meta} / ${project.year}">
        ${project.zh.meta} / ${project.year}
      </span>
      <h3>${project.title}</h3>
    </a>
  </article>
`;
};

const allWorksCard = (project) => `
  <article class="project-card works-card" data-category="${project.category}" id="project-${project.id}">
    <a href="project.html?id=${project.id}">
      <div class="works-card-cover">
        ${homepageCoverElement(project)}
      </div>
      <div class="works-card-info">
        <span class="works-card-number">${project.number}</span>
        <h2>${project.title}</h2>
        <span class="project-meta" data-zh="${project.zh.meta} / ${project.year}" data-en="${project.en.meta} / ${project.year}">
          ${project.zh.meta} / ${project.year}
        </span>
        <p data-zh="${project.zh.summary}" data-en="${project.en.summary}">${project.zh.summary}</p>
        <b data-zh="查看作品" data-en="View Project">查看作品</b>
      </div>
    </a>
  </article>
`;

const renderProjectGrid = () => {
  const grid = document.querySelector("#project-grid");
  if (!grid) {
    return;
  }

  const projectsToShow = featuredProjects.length ? featuredProjects : orderedProjects.slice(0, 4);
  const loopProjects = projectsToShow.map((project, index) => projectCard(project, { duplicate: true, index }));
  grid.innerHTML = [...projectsToShow.map((project) => projectCard(project)), ...loopProjects].join("");
};

const renderAllProjectGrid = () => {
  const grid = document.querySelector("#all-project-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = orderedProjects.map(allWorksCard).join("");
};

const renderProjectIndex = () => {
  const index = document.querySelector("#index-list");
  if (!index) {
    return;
  }

  index.innerHTML = orderedProjects
    .map(
      (project) => `
        <a class="index-row" href="project.html?id=${project.id}" data-preview="${project.cover}">
          <span>${project.number}</span>
          <strong>${project.title}</strong>
          <em data-zh="${project.zh.summary}" data-en="${project.en.summary}">${project.zh.summary}</em>
          <b>${project.year}</b>
        </a>
      `
    )
    .join("");
};

const renderProjectPage = () => {
  const page = document.querySelector("#project-page");
  if (!page) {
    return;
  }

  const id = new URLSearchParams(window.location.search).get("id") || projects[0]?.id;
  const project = projects.find((item) => item.id === id);

  if (!project) {
    page.classList.add("project-empty");
    page.innerHTML = `
      <a class="back-link" href="index.html#work" data-zh="返回作品" data-en="Back to work">返回作品</a>
      <section class="project-body">
        <h2 data-zh="没有找到这个项目。" data-en="Project not found.">没有找到这个项目。</h2>
        <p data-zh="请回到首页重新选择一个作品。" data-en="Please return to the homepage and choose another project.">请回到首页重新选择一个作品。</p>
      </section>
    `;
    return;
  }

  document.title = `${project.title} | LX Studio`;
  const zh = project.zh;
  const en = project.en;

  document.querySelector("#project-meta").dataset.zh = `${zh.meta} / ${project.year}`;
  document.querySelector("#project-meta").dataset.en = `${en.meta} / ${project.year}`;
  document.querySelector("#project-meta").textContent = `${zh.meta} / ${project.year}`;
  document.querySelector("#project-title").textContent = project.title;

  const summary = document.querySelector("#project-summary");
  summary.dataset.zh = zh.summary;
  summary.dataset.en = en.summary;
  summary.textContent = zh.summary;

  const scope = document.querySelector("#project-scope");
  scope.dataset.zh = zh.scope;
  scope.dataset.en = en.scope;
  scope.textContent = zh.scope;

  const role = document.querySelector("#project-role");
  role.dataset.zh = zh.role;
  role.dataset.en = en.role;
  role.textContent = zh.role;

  document.querySelector("#project-gallery").innerHTML = groupedMediaRows(project.media)
    .map((group) => {
      const isFadeGroup = project.fadeGroups?.includes(group.label);
      const rowClasses = [
        "project-media-row",
        group.items.length > 1 ? "is-paired" : "",
        isFadeGroup ? "is-fade" : ""
      ]
        .filter(Boolean)
        .join(" ");

      return `
        <section class="${rowClasses}" style="--media-count: ${group.items.length}" aria-label="${project.title} ${group.label}">
          <div class="project-media-items">
            ${group.items.map((item) => mediaElement(item.src, `${project.title} ${group.label}`)).join("")}
          </div>
        </section>
      `;
    })
    .join("");

  const orderedIndex = orderedProjects.findIndex((item) => item.id === project.id);
  const next = orderedProjects[(orderedIndex + 1) % orderedProjects.length];
  const nextLink = document.querySelector("#next-project");
  nextLink.href = `project.html?id=${next.id}`;
  nextLink.querySelector("strong").textContent = next.title;
};

const setupFilters = () => {
  const filterButtons = document.querySelectorAll(".filter-button");
  const projectCards = document.querySelectorAll(".project-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });

      projectCards.forEach((card) => {
        const visible = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !visible);
      });
    });
  });
};

const setupLanguageToggle = () => {
  document.querySelectorAll(".language-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const current = localStorage.getItem("portfolio-language") || getPreferredLanguage();
      setLanguage(current === "zh" ? "en" : "zh");
    });
  });
};

const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
};

const setupCopyEmail = () => {
  document.querySelectorAll("[data-copy-email]").forEach((link) => {
    link.addEventListener("click", async (event) => {
      event.preventDefault();

      await copyText(link.dataset.copyEmail);
      const language = localStorage.getItem("portfolio-language") || getPreferredLanguage();
      link.dataset.copyMessage = link.dataset[`copySuccess${language === "zh" ? "Zh" : "En"}`];
      link.classList.add("is-copied");

      window.clearTimeout(link.copyResetTimer);
      link.copyResetTimer = window.setTimeout(() => {
        link.classList.remove("is-copied");
      }, 1400);
    });
  });
};

const setupHeroInteractions = () => {
  const hero = document.querySelector(".hero");
  if (!hero) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointer = window.matchMedia("(pointer: coarse)");

  if (!reducedMotion.matches && !coarsePointer.matches) {
    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      hero.style.setProperty("--hero-pan-x", `${x * -26}px`);
      hero.style.setProperty("--hero-pan-y", `${y * -18}px`);
    });

    hero.addEventListener("pointerleave", () => {
      hero.style.setProperty("--hero-pan-x", "0px");
      hero.style.setProperty("--hero-pan-y", "0px");
    });
  }
};

const setupMobileHeroVideo = () => {
  const video = document.querySelector(".hero-mobile-video");
  if (!video) {
    return;
  }

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("x5-playsinline", "");
  video.setAttribute("x5-video-player-type", "h5");
  video.setAttribute("x5-video-player-fullscreen", "false");

  const playVideo = () => {
    if (window.matchMedia("(min-width: 769px)").matches) {
      return;
    }

    if (video.paused && video.readyState < 2) {
      video.load();
    }

    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {});
    }
  };

  video.addEventListener("loadeddata", playVideo, { once: true });
  window.addEventListener("pageshow", playVideo);
  document.addEventListener("WeixinJSBridgeReady", playVideo, false);
  document.addEventListener("touchstart", playVideo, { once: true, passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      playVideo();
    }
  });

  playVideo();
};

const setupCoverFallbacks = () => {
  document.querySelectorAll("[data-cover-base]").forEach((image) => {
    image.addEventListener("error", () => {
      const step = image.dataset.coverStep;
      const base = image.dataset.coverBase;

      if (step === "jpg") {
        image.dataset.coverStep = "png";
        image.src = versionedAsset(`${base}.png`);
        return;
      }

      if (step === "png") {
        image.dataset.coverStep = "gif";
        image.src = versionedAsset(`${base}.gif`);
        return;
      }

      if (step === "gif") {
        image.dataset.coverStep = "fallback";
        image.src = image.dataset.coverFallback;
      }
    });
  });
};

const initPortfolio = async () => {
  await loadPortfolioContent();
  applyHomepageContent();
  renderProjectGrid();
  renderAllProjectGrid();
  renderProjectIndex();
  renderProjectPage();
  setupFilters();
  setupLanguageToggle();
  setupCopyEmail();
  setupHeroInteractions();
  setupMobileHeroVideo();
  setupCoverFallbacks();
  setLanguage(getPreferredLanguage());
};

initPortfolio();

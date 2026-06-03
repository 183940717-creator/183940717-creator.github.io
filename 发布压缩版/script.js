const projects = window.portfolioProjects || (typeof portfolioProjects === "undefined" ? [] : portfolioProjects);
const orderedProjects = [...projects].sort((a, b) => Number(a.number) - Number(b.number));
const featuredProjectIds = window.homepageFeaturedProjectIds || [];
const featuredProjects = featuredProjectIds
  .map((id) => projects.find((project) => project.id === id))
  .filter(Boolean);

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
    return `<video src="${src}" controls playsinline preload="metadata" aria-label="${alt}"></video>`;
  }

  return `<img src="${src}" alt="${alt}" loading="lazy" />`;
};

const homepageCoverPath = (project, extension = "jpg") => `首页作品封面/${project.id}.${extension}`;

const homepageCoverElement = (project) => `
  <img
    src="${homepageCoverPath(project, "jpg")}"
    data-cover-step="jpg"
    data-cover-base="首页作品封面/${project.id}"
    data-cover-fallback="${project.cover}"
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
          <span class="project-media-number">${group.label}</span>
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

const setupCoverFallbacks = () => {
  document.querySelectorAll("[data-cover-base]").forEach((image) => {
    image.addEventListener("error", () => {
      const step = image.dataset.coverStep;
      const base = image.dataset.coverBase;

      if (step === "jpg") {
        image.dataset.coverStep = "png";
        image.src = `${base}.png`;
        return;
      }

      if (step === "png") {
        image.dataset.coverStep = "gif";
        image.src = `${base}.gif`;
        return;
      }

      if (step === "gif") {
        image.dataset.coverStep = "fallback";
        image.src = image.dataset.coverFallback;
      }
    });
  });
};

renderProjectGrid();
renderAllProjectGrid();
renderProjectIndex();
renderProjectPage();
setupFilters();
setupLanguageToggle();
setupCopyEmail();
setupHeroInteractions();
setupCoverFallbacks();
setLanguage(getPreferredLanguage());

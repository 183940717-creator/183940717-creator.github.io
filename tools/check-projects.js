const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dataPath = path.join(root, "content/projects.json");
const supportedCategories = new Set(["brand", "campaign", "ui", "content", "digital"]);
const seenIds = new Set();
let hasError = false;

const fail = (message) => {
  hasError = true;
  console.error(`- ${message}`);
};

const readData = () => {
  try {
    return JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch (error) {
    fail(`content/projects.json 不是有效 JSON：${error.message}`);
    return null;
  }
};

const fileExists = (relativePath) => fs.existsSync(path.join(root, relativePath));

const checkProject = (project, index) => {
  const label = project?.title || `第 ${index + 1} 个作品`;

  if (!project || typeof project !== "object") {
    fail(`${label} 格式不正确。`);
    return;
  }

  ["id", "number", "title", "year", "category", "cover"].forEach((field) => {
    if (!project[field]) {
      fail(`${label} 缺少 ${field}。`);
    }
  });

  if (project.id) {
    if (seenIds.has(project.id)) {
      fail(`${label} 的 id 重复：${project.id}`);
    }
    seenIds.add(project.id);
  }

  if (project.category && !supportedCategories.has(project.category)) {
    fail(`${label} 的 category 建议使用 brand / campaign / ui / content / digital。当前是：${project.category}`);
  }

  if (project.cover && !fileExists(project.cover)) {
    fail(`${label} 的默认封面不存在：${project.cover}`);
  }

  if (!Array.isArray(project.media) || project.media.length === 0) {
    fail(`${label} 至少需要 1 张作品详情图片/GIF/视频。`);
  } else {
    project.media.forEach((item) => {
      const mediaPath = typeof item === "string" ? item : item?.path || item?.item || item?.value;
      if (mediaPath && !fileExists(mediaPath)) {
        fail(`${label} 的详情素材不存在：${mediaPath}`);
      }
    });
  }
};

const data = readData();
if (data) {
  if (!Array.isArray(data.featuredProjectIds)) {
    fail("featuredProjectIds 需要是数组。");
  }

  if (!Array.isArray(data.projects)) {
    fail("projects 需要是数组。");
  } else {
    data.projects.forEach(checkProject);

    if (Array.isArray(data.featuredProjectIds)) {
      data.featuredProjectIds.forEach((id) => {
        if (!seenIds.has(id)) {
          fail(`首页精选里找不到这个作品 id：${id}`);
        }
      });
    }
  }
}

if (hasError) {
  process.exit(1);
}

console.log("作品数据检查通过。");

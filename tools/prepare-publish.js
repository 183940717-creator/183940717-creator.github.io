const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const publishDir = path.join(root, "发布压缩版");

const copyTargets = [
  ["content/projects.json", "content/projects.json"],
  ["首页作品封面", "首页作品封面"],
  ["首页素材", "首页素材"],
  ["首页手机视频", "首页手机视频"],
  ["mobile-hero-video", "mobile-hero-video"],
  ["首页联系图标", "首页联系图标"],
  ["关于素材", "关于素材"]
];

const ensureParent = (target) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
};

const copyPath = (fromRelative, toRelative) => {
  const from = path.join(root, fromRelative);
  const to = path.join(publishDir, toRelative);

  if (!fs.existsSync(from)) {
    return;
  }

  ensureParent(to);
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, {
    recursive: true,
    filter: (source) => !source.endsWith(".DS_Store")
  });
};

const copyMissingDirectory = (fromRelative, toRelative) => {
  const from = path.join(root, fromRelative);
  const to = path.join(publishDir, toRelative);

  if (!fs.existsSync(from)) {
    return;
  }

  const walk = (directory) => {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      if (entry.name === ".DS_Store") {
        return;
      }

      const sourcePath = path.join(directory, entry.name);
      const relativePath = path.relative(from, sourcePath);
      const targetPath = path.join(to, relativePath);

      if (entry.isDirectory()) {
        walk(sourcePath);
        return;
      }

      if (!fs.existsSync(targetPath)) {
        ensureParent(targetPath);
        fs.copyFileSync(sourcePath, targetPath);
      }
    });
  };

  walk(from);
};

copyTargets.forEach(([from, to]) => copyPath(from, to));
copyMissingDirectory("我的作品", "我的作品");

console.log("Publish data and lightweight assets synced.");

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publishDir = path.join(root, "发布压缩版");
const ffmpeg = process.env.FFMPEG_PATH;
const avconvert = "/usr/bin/avconvert";

if ((!ffmpeg || !fs.existsSync(ffmpeg)) && !fs.existsSync(avconvert)) {
  console.error("No video compression tool is available.");
  process.exit(1);
}

const bytes = (file) => fs.statSync(file).size;
const rel = (file) => path.relative(publishDir, file).split(path.sep).join("/");

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  return result.status === 0;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return fullPath;
  });
}

function copySite() {
  fs.rmSync(publishDir, { recursive: true, force: true });
  fs.mkdirSync(publishDir, { recursive: true });
  const args = [
    "-a",
    "--delete",
    "--exclude",
    ".DS_Store",
    "--exclude",
    ".git",
    "--exclude",
    ".github",
    "--exclude",
    ".gitignore",
    "--exclude",
    "node_modules",
    "--exclude",
    "tools",
    "--exclude",
    "发布压缩版",
    "--exclude",
    "README.md",
    "--exclude",
    "GitHub添加作品说明.md",
    "--exclude",
    "后台使用说明.md",
    "--exclude",
    "作品添加模板.json",
    `${root}/`,
    `${publishDir}/`,
  ];
  if (!run("rsync", args)) {
    console.error("Failed to copy site files.");
    process.exit(1);
  }
}

function replaceReferences(replacements) {
  const dataFile = path.join(publishDir, "data.js");
  let source = fs.readFileSync(dataFile, "utf8");
  for (const [from, to] of replacements) {
    source = source.split(from).join(to);
  }
  fs.writeFileSync(dataFile, source);
}

function convertGif(file) {
  const output = file.replace(/\.gif$/i, ".webp");
  const ok = run(ffmpeg, [
    "-y",
    "-i",
    file,
    "-vf",
    "fps=15,scale='min(1600,iw)':-2:flags=lanczos",
    "-loop",
    "0",
    "-compression_level",
    "6",
    "-q:v",
    "68",
    output,
  ]);
  if (!ok || !fs.existsSync(output)) return null;
  if (bytes(output) >= bytes(file)) {
    fs.rmSync(output, { force: true });
    return null;
  }
  fs.rmSync(file);
  return [rel(file), rel(output)];
}

function compressMp4(file) {
  const output = file.replace(/\.mp4$/i, ".compressed.mp4");
  let ok = false;

  if (ffmpeg && fs.existsSync(ffmpeg)) {
    ok = run(ffmpeg, [
      "-y",
      "-i",
      file,
      "-vf",
      "scale='min(1600,iw)':-2:flags=lanczos",
      "-c:v",
      "libx264",
      "-crf",
      "30",
      "-preset",
      "veryfast",
      "-movflags",
      "+faststart",
      "-an",
      output,
    ]);
  }

  if (!ok && fs.existsSync(avconvert)) {
    ok = run(avconvert, [
      "--source",
      file,
      "--preset",
      "PresetMediumQuality",
      "--output",
      output,
      "--replace",
    ]);
  }

  if (!ok || !fs.existsSync(output)) return false;
  if (bytes(output) >= bytes(file)) {
    fs.rmSync(output, { force: true });
    return false;
  }
  fs.renameSync(output, file);
  return true;
}

copySite();

const files = walk(path.join(publishDir, "我的作品"));
const replacements = [];
let convertedGifs = 0;
let compressedVideos = 0;

for (const file of files) {
  if (/\.gif$/i.test(file)) {
    const replacement = convertGif(file);
    if (replacement) {
      replacements.push(replacement);
      convertedGifs += 1;
    }
  }
}

for (const file of walk(path.join(publishDir, "我的作品"))) {
  if (/\.mp4$/i.test(file) && compressMp4(file)) {
    compressedVideos += 1;
  }
}

replaceReferences(replacements);

console.log(
  JSON.stringify(
    {
      publishDir,
      convertedGifs,
      compressedVideos,
    },
    null,
    2,
  ),
);

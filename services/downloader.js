const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { randomUUID } = require("crypto");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);
const YTDLP_PATH = process.env.YTDLP_PATH || "yt-dlp";
const MAX_BYTES = Number(process.env.DOWNLOADER_MAX_BYTES || 64 * 1024 * 1024);
const MAX_DURATION = Number(process.env.DOWNLOADER_MAX_DURATION || 900);
const MAX_CONCURRENT = Math.max(1, Number(process.env.DOWNLOADER_MAX_CONCURRENT || 2));
const active = new Set();

const HOSTS = [
  ["Instagram", /(^|\.)instagram\.com$/i],
  ["TikTok", /(^|\.)tiktok\.com$/i],
  ["YouTube", /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i],
  ["Facebook", /(^|\.)facebook\.com$|(^|\.)fb\.watch$/i],
  ["X", /(^|\.)x\.com$|(^|\.)twitter\.com$/i],
  ["Pinterest", /(^|\.)pinterest\.com$|(^|\.)pin\.it$/i],
  ["Reddit", /(^|\.)reddit\.com$|(^|\.)redd\.it$/i],
];

function parseUrl(value) {
  try {
    const url = new URL(String(value).trim());
    if (!/^https?:$/.test(url.protocol)) return null;
    const platform = HOSTS.find(([, pattern]) => pattern.test(url.hostname))?.[0];
    return platform ? { url: url.toString(), platform } : null;
  } catch {
    return null;
  }
}

function findUrl(text) {
  const match = String(text || "").match(/https?:\/\/[^\s<>]+/i);
  if (!match) return null;
  return parseUrl(match[0].replace(/[),.!?]+$/, ""));
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function download(input, kind = "video") {
  const target = parseUrl(input);
  if (!target) throw new Error("URL tidak didukung. Gunakan link publik dari Instagram, TikTok, YouTube, Facebook, X, Pinterest, atau Reddit.");
  if (active.size >= MAX_CONCURRENT) throw new Error("Download sedang penuh. Coba lagi beberapa saat lagi.");

  const id = randomUUID();
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "wa-download-"));
  const output = path.join(dir, "media.%(ext)s");
  active.add(id);
  try {
    const args = ["--no-playlist", "--no-warnings", "--restrict-filenames", "--max-filesize", String(MAX_BYTES), "--match-filter", `duration <= ${MAX_DURATION}`, "--print", "after_move:filepath", "-o", output];
    if (kind === "audio") args.push("-x", "--audio-format", "mp3", "--audio-quality", "5");
    else args.push("-f", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b", "--merge-output-format", "mp4");
    args.push(target.url);

    const { stdout } = await execFileAsync(YTDLP_PATH, args, {
      timeout: Number(process.env.DOWNLOADER_TIMEOUT_MS || 120000),
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    });
    const file = stdout.trim().split(/\r?\n/).pop();
    if (!file) throw new Error("Provider tidak mengembalikan file.");
    const stat = await fs.stat(file);
    if (stat.size > MAX_BYTES) throw new Error(`File terlalu besar (${formatBytes(stat.size)}). Batas ${formatBytes(MAX_BYTES)}.`);
    const data = await fs.readFile(file);
    return { ...target, data, size: stat.size, kind };
  } catch (error) {
    if (error?.code === "ENOENT") throw new Error("yt-dlp belum terpasang. Install yt-dlp atau set YTDLP_PATH.");
    if (error?.killed || error?.code === "ETIMEDOUT") throw new Error("Download timeout.");
    const detail = String(error?.stderr || error?.message || "provider gagal").split(/\r?\n/).filter(Boolean).pop();
    throw new Error(detail?.slice(0, 180) || "Link tidak bisa diproses. Pastikan konten publik dan link masih valid.");
  } finally {
    active.delete(id);
    await fs.rm(dir, { recursive: true, force: true });
  }
}

module.exports = { parseUrl, findUrl, download, MAX_BYTES, MAX_DURATION };

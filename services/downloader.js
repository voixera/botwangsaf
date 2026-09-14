const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { randomUUID } = require("crypto");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);
const YTDLP_PATH = process.env.YTDLP_PATH || "yt-dlp";
const FFPROBE_PATH = process.env.FFPROBE_PATH || "ffprobe";
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

async function resolveUrl(target) {
  if (target.platform !== "TikTok" || !/^https?:\/\/(vt|vm)\.tiktok\.com\//i.test(target.url)) return target;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(target.url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Mozilla/5.0" },
    });
    const resolved = response.url;
    const parsed = resolved && parseUrl(resolved);
    // Keep original short URL when HTTP redirect loses TikTok's video ID.
    // yt-dlp can resolve valid short links with its own extractor session.
    return parsed && /\/video\/\d+/i.test(new URL(parsed.url).pathname) ? parsed : target;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Resolving short-link TikTok timeout.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function download(input, kind = "video") {
  const parsedTarget = parseUrl(input);
  if (!parsedTarget) throw new Error("URL tidak didukung. Gunakan link publik dari Instagram, TikTok, YouTube, Facebook, X, Pinterest, atau Reddit.");
  const target = await resolveUrl(parsedTarget);
  if (active.size >= MAX_CONCURRENT) throw new Error("Download sedang penuh. Coba lagi beberapa saat lagi.");

  const id = randomUUID();
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "wa-download-"));
  const output = path.join(dir, "media.%(ext)s");
  active.add(id);
  try {
    const args = ["--ignore-config", "--no-playlist", "--restrict-filenames", "--max-filesize", String(MAX_BYTES), "--match-filter", `duration <= ${MAX_DURATION}`, "--print", "after_move:filepath", "-o", output];
    if (target.platform === "TikTok") args.push("--impersonate", "chrome");
    if (kind === "audio") args.push("-x", "--audio-format", "mp3", "--audio-quality", "5");
    else args.push(
      "-f", target.platform === "TikTok" ? "b[ext=mp4]/b" : "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b",
      "--merge-output-format", "mp4",
      "--recode-video", "mp4",
      "--postprocessor-args", "VideoConvertor+ffmpeg:-c:v libx264 -c:a aac -pix_fmt yuv420p -movflags +faststart",
      "--compat-options", "no-youtube-unavailable-videos",
    );
    args.push(target.url);

    const { stdout } = await execFileAsync(YTDLP_PATH, args, {
      timeout: Number(process.env.DOWNLOADER_TIMEOUT_MS || 120000),
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    });
    const file = stdout.trim().split(/\r?\n/).find((line) => line.startsWith(dir));
    if (!file) throw new Error("Provider tidak mengembalikan file.");
    const stat = await fs.stat(file);
    if (stat.size > MAX_BYTES) throw new Error(`File terlalu besar (${formatBytes(stat.size)}). Batas ${formatBytes(MAX_BYTES)}.`);
    const data = await fs.readFile(file);
    const { stdout: durationOutput } = await execFileAsync(FFPROBE_PATH, [
      "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file,
    ], { timeout: 10000, windowsHide: true });
    const duration = Number(durationOutput.trim());
    return { ...target, data, size: stat.size, duration: Number.isFinite(duration) ? Math.round(duration) : undefined, kind };
  } catch (error) {
    if (error?.code === "ENOENT") throw new Error("yt-dlp belum terpasang. Install yt-dlp atau set YTDLP_PATH.");
    if (error?.killed || error?.code === "ETIMEDOUT") throw new Error("Download timeout.");
    const raw = String(error?.stderr || error?.message || "provider gagal");
    if (/login page|login required|rate-limit reached|requested content is not available/i.test(raw) && target.platform === "Instagram") {
      throw new Error("Instagram menolak akses provider. Pastikan akun/konten publik dan coba lagi nanti.");
    }
    if (/Unexpected response|impersonat|JSON object must be str|NoneType/i.test(raw) && target.platform === "TikTok") {
      throw new Error("TikTok menolak request provider. Pastikan image sudah rebuild dengan curl-cffi, lalu coba lagi.");
    }
    const detail = raw.split(/\r?\n/).filter(Boolean).pop();
    throw new Error(detail?.slice(0, 180) || "Link tidak bisa diproses. Pastikan konten publik dan link masih valid.");
  } finally {
    active.delete(id);
    await fs.rm(dir, { recursive: true, force: true });
  }
}

module.exports = { parseUrl, findUrl, download, MAX_BYTES, MAX_DURATION };

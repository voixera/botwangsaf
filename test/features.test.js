const test = require("node:test");
const assert = require("node:assert/strict");
const { parseUrl, findUrl } = require("../services/downloader");
const { parseEmoji } = require("../commands/emoji");

test("detects supported downloader hosts", () => {
  assert.equal(parseUrl("https://www.instagram.com/reel/demo/").platform, "Instagram");
  assert.equal(parseUrl("https://vm.tiktok.com/demo").platform, "TikTok");
  assert.equal(parseUrl("https://youtu.be/demo").platform, "YouTube");
  assert.equal(parseUrl("https://example.com/video"), null);
});

test("finds supported URL in message", () => {
  assert.equal(findUrl("lihat https://x.com/demo!").platform, "X");
});

test("parses dynamic emoji input", () => {
  assert.deepEqual(parseEmoji("😁 + 🙏"), ["😁", "🙏"]);
  assert.deepEqual(parseEmoji("😂 ❤️ 🔥"), ["😂", "❤️", "🔥"]);
  assert.deepEqual(parseEmoji(""), []);
});

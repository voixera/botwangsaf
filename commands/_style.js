const LINE = "━━━━━━━━━━━━━━━━━━━━";
const THIN_LINE = "┄┄┄┄┄┄┄┄┄┄┄┄┄┄";

function box(title, rows = [], footer = null) {
  return [
    `╭━━〔 *${title}* 〕━━╮`,
    ...rows.map((row) => `┃ ${row}`),
    "╰━━━━━━━━━━━━━━━━╯",
    footer ? `${THIN_LINE}\n${footer}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function success(title, message) {
  return box(title, [`⌬ ${message}`]);
}

function warn(message) {
  return box("𝙽𝙾𝚃𝙸𝙲𝙴", [`⌬ ${message}`]);
}

module.exports = {
  LINE,
  THIN_LINE,
  box,
  success,
  warn,
};

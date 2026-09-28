const fs = require("fs");
const path = require("path");
const { MessageMedia } = require("whatsapp-web.js");

module.exports = {
  name: "menu",
  aliases: ["help"],
  description: "Menampilkan daftar command VX Bot.",
  usage: "menu",
  async execute({ message, commands }) {
    const uniqueCommands = [...new Set(commands.values())].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const commandCategories = {
      "Media": ["stiker", "xbg", "video", "audio", "tiktok", "ig", "yt"],
      "Menfess": ["menfess", "endconfess"],
      "Utilitas": [
        "ping",
        "runtime",
        "info",
        "id",
        "quote",
        "grupinfo",
      ],
    };

    const categoryNames = Object.keys(commandCategories);
    const commandNamesInCategory = Object.values(commandCategories).flat();

    const categorizedCommands = uniqueCommands.filter((cmd) =>
      commandNamesInCategory.includes(cmd.name)
    );
    const otherCommands = uniqueCommands.filter(
      (cmd) => !commandNamesInCategory.includes(cmd.name)
    );

    const line = "━━━━━━━━━━━━━━━━━━━━";
    const thinLine = "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄";
    const formatCommand = (cmd) => `┃ ${cmd.name}`;

    const formatCategory = (category) => {
      const names = commandCategories[category];
      const filtered = categorizedCommands.filter((cmd) => names.includes(cmd.name));
      if (!filtered.length) return "";

      return [`╭─ ${category}`, filtered.map(formatCommand).join("\n")].join("\n");
    };

    const categoryList = categoryNames
      .map((category) => formatCategory(category))
      .filter(Boolean)
      .join(`\n${thinLine}\n`);

    const otherList = otherCommands.length
      ? ["╭─ ◈ 𝙻𝙰𝙸𝙽𝙽𝚈𝙰", otherCommands.map(formatCommand).join("\n")].join("\n")
      : "";

    const menuText = [
      "╭━━〔 *VX Bot* 〕━━╮",
      "┃ Menu utama",
      "╰━━━━━━━━━━━━━━━━╯",
      "",
      line,
      categoryList,
      otherList ? `${thinLine}\n${otherList}` : "",
      line,
      "",
      "Ketik nama command tanpa prefix.",
      line,
    ].join("\n");

    const imagePath = path.join(__dirname, "..", "assets", "chat.jpg");
    if (fs.existsSync(imagePath)) {
      const media = MessageMedia.fromFilePath(imagePath);
      await message.reply(media, undefined, { caption: menuText });
      return;
    }

    await message.reply(menuText);
  },
};

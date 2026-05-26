const fs = require("fs");
const path = require("path");
const { MessageMedia } = require("whatsapp-web.js");

module.exports = {
  name: "menu",
  aliases: ["help"],
  description: "Menampilkan daftar command DX Bot.",
  usage: "menu",
  async execute({ message, commands, state }) {
    const prefix = state.config.prefixes[0];
    const uniqueCommands = [...new Set(commands.values())].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const commandCategories = {
      "◈ 𝙼𝙴𝙳𝙸𝙰": ["stiker", "brat"],
      "◈ 𝙰𝙸": ["tanya", "endtanya", "curhat", "endcurhat"],
      "◈ 𝙼𝙴𝙽𝙵𝙴𝚂𝚂": ["menfess", "endconfess"],
      "◈ 𝚄𝚃𝙸𝙻𝙸𝚃𝚈": [
        "ping",
        "runtime",
        "info",
        "id",
        "owner",
        "prefix",
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
    const formatCommand = (cmd) => `┃ ⌬ ${prefix}${cmd.name}`;

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
      "╭━━〔 *𝙳𝚇 𝙱𝙾𝚃* 〕━━╮",
      "┃ 𝙼𝙰𝙸𝙽 𝙼𝙴𝙽𝚄",
      "╰━━━━━━━━━━━━━━━━╯",
      "",
      line,
      categoryList,
      otherList ? `${thinLine}\n${otherList}` : "",
      line,
      "",
      `Prefix aktif: *${state.config.prefixes.join(" ")}*`,
      line,
    ].join("\n");

    const imagePath = path.join(__dirname, "..", "assets", "chat.jpeg");
    if (fs.existsSync(imagePath)) {
      const media = MessageMedia.fromFilePath(imagePath);
      await message.reply(media, undefined, { caption: menuText });
      return;
    }

    await message.reply(menuText);
  },
};

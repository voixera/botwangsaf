module.exports = {
  name: "menu",
  aliases: ["help"],
  description: "Menampilkan daftar command bot.",
  usage: "menu",
  async execute({ message, commands, state }) {
    const prefix = state.config.prefixes[0];
    const uniqueCommands = [...new Set(commands.values())].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const commandCategories = {
      "🟫 Media": ["stiker", "brat"],
      "🍫 Tanya": ["tanya", "endtanya"],
      "🤎 Menfess": ["menfess", "endconfess"],
      "🟤 Curhat": ["curhat", "endcurhat"],
    };

    const categoryNames = Object.keys(commandCategories);
    const commandNamesInCategory = Object.values(commandCategories).flat();

    const categorizedCommands = uniqueCommands.filter((cmd) =>
      commandNamesInCategory.includes(cmd.name)
    );
    const otherCommands = uniqueCommands.filter(
      (cmd) => !commandNamesInCategory.includes(cmd.name)
    );

    const divider = "━━━━━━━━━━━━━━━━━━";

    const formatCommand = (cmd) => {
      const usage = cmd.usage ? `${prefix}${cmd.usage}` : `${prefix}${cmd.name}`;
      const alias = cmd.aliases?.length ? `\n  alias: ${cmd.aliases.join(", ")}` : "";
      return `• ${usage}\n  ${cmd.description || "-"}${alias}`;
    };

    const formatCategory = (category) => {
      const names = commandCategories[category];
      const filtered = categorizedCommands.filter((cmd) => names.includes(cmd.name));
      if (!filtered.length) return "";
      return [category, filtered.map(formatCommand).join("\n")].join("\n");
    };

    const categoryList = categoryNames
      .map((category) => formatCategory(category))
      .filter(Boolean)
      .join("\n\n");

    const otherList = otherCommands.length ? otherCommands.map(formatCommand).join("\n") : "";

    await message.reply(
      [
        "🍫 *CHOCO BOT MENU*",
        divider,
        categoryList,
        otherList ? `\n🤍 Lainnya\n${otherList}` : "",
        "",
        divider,
        "🍪 *Contoh Penggunaan*",
        "",
        "🤎 Menfess",
        `Kirim: ${prefix}menfess 628xxx|Nama Target|pesan kamu`,
        `Stop : ${prefix}endconfess`,
        "",
        "🟤 Curhat",
        `Mulai: ${prefix}curhat` + "<topik>",
        `Stop : ${prefix}endcurhat`,
        "",
        "🍫 Tanya",
        `Mulai: ${prefix}tanya`,
        "Tanya: kirim pesan apa saja setelah mode aktif",
        `Stop : ${prefix}endtanya`,
        "",
        divider,
      ].join("\n")
    );
  },
};

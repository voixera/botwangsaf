function log(level, event, details = "") {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const suffix = details ? ` | ${details}` : "";
  const line = `[${timestamp}] ${level.padEnd(5)} | VX Bot | ${event}${suffix}`;
  (level === "ERROR" ? console.error : level === "WARN" ? console.warn : console.log)(line);
}

module.exports = { log };

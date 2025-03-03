const dayjs = require("dayjs");
const chalk = require("chalk").default;

const format = "{tstamp} {tag} {txt}\n";

function error(content) {
  write(content, chalk.black, chalk.bgRed, "ERROR", true);
}

function warn(content) {
  write(content, chalk.black, chalk.bgYellow, "WARN", false);
}

function typo(content) {
  write(content, chalk.black, chalk.bgCyan, "TYPO", false);
}

function command(content) {
  write(content, chalk.black, chalk.bgMagenta, "CMD", false);
}

function event(content) {
  write(content, chalk.black, chalk.bgGreen, "EVT", true);
}

function client(content) {
  write(content, chalk.black, chalk.bgBlue, "CLIENT", false);
}

function info(content) {
  write(content, chalk.black, chalk.bgBlack, "INFO", false);
}

function write(content, tagColor, bgTagColor, tag, error = false) {
  const timestamp = `[${dayjs().format("DD/MM - HH:mm:ss")}]`;
  const logTag = `[${tag}]`;
  const stream = error ? process.stderr : process.stdout;

  const item = format
    .replace("{tstamp}", chalk.gray(timestamp))
    .replace("{tag}", bgTagColor(tagColor(logTag)))
    .replace("{txt}", chalk.white(content));

  stream.write(item);
}

module.exports = { error, warn, command, event, typo, client, info };

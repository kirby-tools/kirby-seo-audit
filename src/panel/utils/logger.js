/* eslint-disable no-console */

export class BrowserReporter {
  constructor() {
    this.defaultColor = "#7f8c8d"; // Gray
    this.levelColorMap = {
      0: "#c0392b", // Red
      1: "#f39c12", // Yellow
      2: "#00BCD4", // Cyan
    };
    this.typeColorMap = {
      success: "#2ecc71", // Green
    };
  }

  _getLogFn(level) {
    if (level < 1) return console.error;
    return console.log;
  }

  log(logObj) {
    const consoleLogFn = this._getLogFn(logObj.level);

    // Type
    const type = logObj.type === "log" ? "" : logObj.type;

    // Tag
    const tag = logObj.tag || "";

    // Styles
    const color =
      this.typeColorMap[logObj.type] ||
      this.levelColorMap[logObj.level] ||
      this.defaultColor;
    const style = `
  background: ${color};
  border-radius: 0.5em;
  color: white;
  font-weight: bold;
  padding: 2px 0.5em;
`.trimStart();

    const badge = `%c${[tag, type].filter(Boolean).join(":")}`;

    // Log to the console
    if (typeof logObj.args[0] === "string") {
      consoleLogFn(
        `${badge}%c ${logObj.args[0]}`,
        style,
        // Empty string as style resets to default console style
        "",
        ...logObj.args.slice(1),
      );
    } else {
      consoleLogFn(badge, style, ...logObj.args);
    }
  }
}

const REPORTER_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
};

export function createLogger(tag) {
  const reporter = new BrowserReporter();

  return new Proxy(
    {},
    {
      get(target, prop) {
        return (...args) => {
          reporter.log({
            level: REPORTER_LEVELS[prop],
            type: prop,
            tag,
            args,
          });
        };
      },
    },
  );
}

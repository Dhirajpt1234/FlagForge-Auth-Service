import fs from "fs";
import path from "path";
import pino from "pino";
import { APP_NAME, LOG_LEVEL } from "../config/properties";

/*
---------------------------------------
Log directory
---------------------------------------
*/

const logDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const readableStream = fs.createWriteStream(
  path.join(logDir, `${APP_NAME}.log`),
  { flags: "a" }
);

/*
---------------------------------------
JSON Logger (for machines)
---------------------------------------
*/

const jsonLogger = pino(
  {
    level: LOG_LEVEL,
  },
  pino.destination({
    dest: path.join(logDir, `${APP_NAME}.json.log`),
    sync: false
  })
);

/*
---------------------------------------
Caller detection
---------------------------------------
*/

function getCaller(): string {
  const stack = new Error().stack?.split("\n") || [];

  for (const line of stack) {
    if (
      line.includes(".ts") &&
      !line.includes("logger.util") &&
      !line.includes("node_modules") &&
      !line.includes("exceptionHandler.middleware") &&
      !line.includes("/Middleware/")
    ) {
      const normalized = line.trim();

      const matchWithParens = normalized.match(/\((.*\.ts):(\d+):(\d+)\)/);
      const matchWithoutParens = normalized.match(/at\s+(?:async\s+)?(.*\.ts):(\d+):(\d+)$/);
      const match = matchWithParens || matchWithoutParens;

      if (!match) continue;

      const file = match[1].split("/").pop();
      const lineNo = match[2];

      return `${file}:${lineNo}`;
    }
  }

  return "unknownFileName";
}

/*
---------------------------------------
Formatting
---------------------------------------
*/

function formatLog(level: string, message: string, data?: any) {
  const time = new Date().toISOString();
  const caller = getCaller();

  const dataStr = data ? JSON.stringify(data) : "";

  return `[${time}] [${level.toUpperCase()}] [${caller}] ${message} ${dataStr}`;
}

/*
---------------------------------------
Writer
---------------------------------------
*/

function write(level: "info" | "debug" | "warn" | "error", message: string, data?: any) {
  const formatted = formatLog(level, message, data);

  /*
  console readable
  */

  if(LOG_LEVEL !== "PROD") {
    console.log(formatted);
  }

  /*
  readable log file
  */

  readableStream.write(formatted + "\n");

  /*
  structured json log
  */

  jsonLogger[level]({
    message,
    data,
    caller: getCaller(),
    timestamp: new Date().toISOString()
  });
}

/*
---------------------------------------
Logger API
---------------------------------------
*/

export default {

  info(message: string, data?: any) {
    write("info", message, data);
  },

  debug(message: string, data?: any) {
    write("debug", message, data);
  },

  warn(message: string, data?: any) {
    write("warn", message, data);
  },

  error(message: string, data?: any) {
    write("error", message, data);
  }

};
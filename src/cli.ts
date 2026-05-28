#!/usr/bin/env node
import { cac } from "cac";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { sqliteToDbml } from "./sources/sqlite.js";
import { parseDbml } from "./dbml/parse.js";
import { buildCanvas } from "./canvas/build.js";

const cli = cac("dmv");

cli
  .command("dbml-to-canvas <input>", "Convert a .dbml file to a .canvas file")
  .option("-o, --output <path>", "Output .canvas path (defaults to alongside input)")
  .action((input: string, opts: { output?: string }) => {
    const dbml = readFileSync(input, "utf8");
    const schema = parseDbml(dbml);
    const canvas = buildCanvas(schema);
    const out = opts.output ?? input.replace(/\.dbml$/, "") + ".canvas";
    writeFileSync(out, JSON.stringify(canvas, null, 2));
    console.error(`wrote ${out}  (${canvas.nodes.length} tables, ${canvas.edges.length} refs)`);
  });

cli
  .command("sqlite-to-dbml <file>", "Convert a SQLite database file to DBML")
  .option("-o, --output <path>", "Output .dbml path (defaults to stdout)")
  .action((file: string, opts: { output?: string }) => {
    const dbml = sqliteToDbml(resolve(file));
    if (opts.output) {
      writeFileSync(opts.output, dbml);
      console.error(`wrote ${opts.output}`);
    } else {
      process.stdout.write(dbml);
    }
  });

cli
  .command("sqlite-to-canvas <file>", "Convert a SQLite database file to a .canvas file")
  .option("-o, --output <path>", "Output .canvas path (defaults to <file>.canvas)")
  .action((file: string, opts: { output?: string }) => {
    const dbml = sqliteToDbml(resolve(file));
    const schema = parseDbml(dbml);
    const canvas = buildCanvas(schema);
    const out = opts.output ?? file.replace(/\.(sqlite|db|sqlite3)$/, "") + ".canvas";
    writeFileSync(out, JSON.stringify(canvas, null, 2));
    console.error(`wrote ${out}  (${canvas.nodes.length} tables, ${canvas.edges.length} refs)`);
  });

cli.help();
cli.version("0.1.0");
cli.parse();

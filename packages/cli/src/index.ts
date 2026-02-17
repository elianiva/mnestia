#!/usr/bin/env bun
import cac from "cac";

const cli = cac("mnestia");

cli
  .command("dev", "Start development server")
  .option("-p, --port <port>", "Port to run on", {
    default: 3000,
  })
  .action((options) => {
    console.log(`Starting dev server on port ${options.port}...`);
  });

cli.help();
cli.parse();

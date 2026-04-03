#!/usr/bin/env node

import chalk from 'chalk';

import { runCli } from './cli/program';

runCli(process.argv).catch(err => {
  console.error(chalk.red('\n  [FATAL] ') + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
});

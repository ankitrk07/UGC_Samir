import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
execFileSync(process.execPath,[resolve(__dirname,'../../scripts/export-contracts.cjs')],{stdio:'inherit'});

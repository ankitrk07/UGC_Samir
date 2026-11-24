const fs = require('node:fs');
const path = require('node:path');
process.chdir(path.resolve(__dirname, '..'));
const schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
const migrations = fs.readdirSync('backend/prisma/migrations', { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort();
const sql = migrations.map(name => fs.readFileSync('backend/prisma/migrations/' + name + '/migration.sql', 'utf8')).join('\n');
const models = [...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)];
const names = new Set(models.map(m => m[1]));
const findings = [], rows = [];
for (const [, name, body] of models) {
  const table = [...sql.matchAll(/CREATE TABLE "([^"]+)" \(([\s\S]*?)\);/g)].find(m => m[1] === name);
  if (!table) { findings.push(name + ': missing CREATE TABLE'); continue; }
  const alterations = [...sql.matchAll(/ALTER TABLE "([^"]+)" ([\s\S]*?);/g)].filter(m => m[1] === name).map(m => m[2]).join('\n');
  const ddl = table[2] + '\n' + alterations;
  const fields = [...body.matchAll(/^\s+(\w+) ([\w]+)(\?|\[\])?([^\n]*)/gm)].filter(m => !names.has(m[2]));
  for (const [, field, , optional] of fields) {
    const column = ddl.match(new RegExp('"' + field + '"\\s+((?:[^,(\\n]|\\([^)]*\\))*)'));
    if (!column) { findings.push(name + '.' + field + ': missing column'); continue; }
    const required = /NOT NULL|PRIMARY KEY/.test(column[1]);
    if ((optional !== '?') !== required) findings.push(name + '.' + field + ': nullable/required mismatch');
  }
  const relations = [...body.matchAll(/@relation\(fields:\[([^\]]+)\],references:\[([^\]]+)\]\)/g)];
  for (const relation of relations) {
    const column = relation[1].trim();
    if (!alterations.includes('"' + name + '_' + column + '_fkey"')) findings.push(name + '.' + column + ': missing named foreign key');
  }
  rows.push({ model: name, fields: fields.length, nullable: fields.filter(m => m[3] === '?').length, foreignKeys: relations.length, unique: [...body.matchAll(/@unique|@@unique/g)].length, indexes: [...body.matchAll(/@@index/g)].length });
}
fs.mkdirSync('artifacts/verification/current', { recursive: true });
fs.writeFileSync('artifacts/verification/current/schema-source-audit.json', JSON.stringify({ sourceOnly: true, databaseExecuted: false, migrations, rows, findings }, null, 2) + '\n');
fs.writeFileSync('docs/SCHEMA-AUDIT.md', '# Schema source audit\n\nSource inspection only; no Prisma validation, SQL execution or database introspection is claimed. Migration order: ' + migrations.join(', ') + '. Counts compare declared scalar fields, nullability and named foreign keys against checked-in SQL. Index/unique counts describe Prisma declarations, not verified database objects. Custom SQL constraints require real PostgreSQL tests.\n\n| Model | Scalar fields | Nullable | Declared foreign keys | Unique declarations | Index declarations |\n|---|---|---|---|---|---|\n' + rows.map(r => '| ' + [r.model, r.fields, r.nullable, r.foreignKeys, r.unique, r.indexes].join(' | ') + ' |').join('\n') + '\n\nFindings: ' + (findings.length ? findings.join('; ') : 'No column/nullability/named-FK mismatches detected by this source scanner.') + '\n\nAnalyticsDaily brandId/creatorId are denormalized dimensions; creatorId can be an empty campaign-level sentinel. Campaign is the authoritative FK/scope. TeamMember.userId and Payment.userId now have explicit User relations and restrictive FKs in the second migration. Existing orphans cause migration failure for explicit repair; no data is silently deleted. Prisma connection pooling, hot-query plans, uniqueness/exclusion behavior, money transactions and recovery remain unverified against PostgreSQL.\n');
console.log(JSON.stringify({ models: rows.length, migrations: migrations.length, findings, databaseExecuted: false }));
process.exitCode = findings.length ? 1 : 0;

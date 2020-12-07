#!/usr/bin/node

import { readdir, writeFile } from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import schemaRefParser from '@apidevtools/json-schema-ref-parser';

import importJson from '../lib/import-json.js';

const schemaDirectoryUrl = new URL(`../schemas/`, import.meta.url);

(async () => {
  const schemaFiles = process.argv.length > 2
    ? process.argv.slice(2)
    : (await readdir(schemaDirectoryUrl)).filter(
      schemaFile => path.extname(schemaFile) === `.json`,
    );

  process.chdir(schemaDirectoryUrl.pathname);
  for (const schemaFile of schemaFiles) {
    const schema = await importJson(schemaFile, schemaDirectoryUrl);
    const dereferencedSchemaUrl = new URL(`dereferenced/${schemaFile}`, schemaDirectoryUrl);

    try {
      const dereferencedSchema = await schemaRefParser.dereference(schema);
      await writeFile(
        dereferencedSchemaUrl,
        `${JSON.stringify(dereferencedSchema, null, 2)}\n`,
      );
      console.log(chalk.green(`[Success]`), `Updated dereferenced schema ${dereferencedSchemaUrl.pathname}.`);
    }
    catch (error) {
      console.error(chalk.red(`[Error]`), error);
    }
  }
})();

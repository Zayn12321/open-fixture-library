#!/usr/bin/node

const { readdir, writeFile } = require(`fs/promises`);
const path = require(`path`);
const chalk = require(`chalk`);

const { Register } = require(`../lib/register.js`);
const importJson = require(`../lib/import-json.js`);

let register;
let manufacturers;

const fixturesPath = path.join(__dirname, `../fixtures/`);

(async () => {
  try {
    manufacturers = await importJson(`../fixtures/manufacturers.json`, __dirname);
    register = new Register(manufacturers);

    await addFixturesToRegister();
  }
  catch (readError) {
    console.error(`Read error:`, readError);
    process.exit(1);
  }

  const filename = path.join(fixturesPath, (process.argv.length === 3 ? process.argv[2] : `register.json`));
  const fileContents = `${JSON.stringify(register.getAsSortedObject(), null, 2)}\n`;

  try {
    await writeFile(filename, fileContents, `utf8`);
    console.log(chalk.green(`[Success]`), `Updated register file`, filename);
    process.exit(0);
  }
  catch (error) {
    console.error(chalk.red(`[Fail]`), `Could not write register file.`, error);
    process.exit(1);
  }
})();


/**
 * Loop through all manufacturer directories and fixture files and add them to the register.
 */
async function addFixturesToRegister() {
  const directoryEntries = await readdir(fixturesPath, { withFileTypes: true });
  const manufacturerKeys = directoryEntries.filter(entry => entry.isDirectory()).map(entry => entry.name);

  for (const manufacturerKey of manufacturerKeys) {
    register.addManufacturer(manufacturerKey, manufacturers[manufacturerKey]);

    const manufacturerDirectory = path.join(fixturesPath, manufacturerKey);
    const fixtureFiles = await readdir(manufacturerDirectory);
    for (const filename of fixtureFiles) {
      if (path.extname(filename) !== `.json`) {
        continue;
      }

      const fixtureKey = path.basename(filename, `.json`);
      const fixtureData = await importJson(`${manufacturerKey}/${filename}`, fixturesPath);

      if (fixtureData.$schema.endsWith(`/fixture-redirect.json`)) {
        const redirectToData = await importJson(`${fixtureData.redirectTo}.json`, fixturesPath);

        register.addFixtureRedirect(manufacturerKey, fixtureKey, fixtureData, redirectToData);
      }
      else {
        register.addFixture(manufacturerKey, fixtureKey, fixtureData);
      }
    }
  }
}

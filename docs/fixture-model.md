# Fixture model

Instead of parsing [fixtures' JSON data](fixture-format.md) directly, it is recommended to use the model. We developed it to ease handling complicated fixture features like fine channels or switching channels.

All model functions and classes are documented with [JSDoc](http://usejsdoc.org/). Those annotations are converted to Markdown with [jsdoc2md](https://github.com/jsdoc2md/jsdoc-to-markdown) to obtain an [API reference](model-api.md).

The model uses [ES2015 classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) in [ES2015 modules](https://nodejs.org/api/esm.html) to represent the fixtures. E.g., `fixtureFromRepository('cameo', 'nanospot-120')` returns a [`Fixture`](model-api.md#Fixture) object, instantiated with the specified fixture's data. These objects have several convenient properties that allow easy usage of the fixture data in [plugins](plugins.md), [UI](ui.md) and more.

All model classes are located in the [`lib/model/`](../lib/model) directory. When using the model, it usually suffices to import the `fixtureFromRepository` function from `model.js` which returns a `Fixture` instance:

<!-- While top level `await` is not supported by ESLint, skip parsing this code block. -->
<!-- eslint-skip -->
```js
import { fixtureFromRepository } from './lib/model.js';

const myFixture = await fixtureFromRepository(`cameo`, `nanospot-120`); // instanceof Fixture

const physicalData = myFixture.physical; // instanceof Physical
const panFine = myFixture.getChannelByKey(`Pan fine`); // instanceof FineChannel

if (panFine.coarseChannel.hasHighlightValue) {
  console.log(`Highlight at ${panFine.coarseChannel.highlightValue}`);
}
```

If you want to use a model class directly, also import it via `model.js` (like this: `import { Meta } from './lib/model.js';`).

Model properties are always implemented using getters and setters. To store data, we use backing fields (an internal property prefixed with underscore, e.g. `_jsonObject`) to hold the data. The backing field should never be accessed directly, but only through its getter and setter functions (without underscore).

Avoid returning `undefined` by returning smart default values if necessary. If the default value is not `null`, also provide a `hasXY` boolean getter function. Properties that need further computation or create other objects should be cached in an internal `_cache` object.

<!-- eslint-disable jsdoc/require-jsdoc -->
```js
export default class Fixture {
  // returns backing field to avoid accessing _jsonObject from outside
  get jsonObject() {
    return this._jsonObject;
  }

  set jsonObject(jsonObject) {
    this._jsonObject = jsonObject;
    this._cache = {};
  }

  // required, no default needed
  get name() {
    return this._jsonObject.name;
  }

  // defaults to the name
  get shortName() {
    return this._jsonObject.shortName || this._jsonObject.name;
  }

  get hasShortName() {
    return `shortName` in this._jsonObject;
  }

  // it's not good to create a Meta object with each property access, so we cache it
  get meta() {
    if (!(`meta` in this._cache)) {
      this._cache.meta = new Meta(this._jsonObject.meta);
    }

    return this._cache.meta;
  }

  // defaults to null as there is no meaningful other default
  get rdm() {
    return this._jsonObject.rdm || null;
  }

  // ...
}
```

## Resource references

Resources (e.g. gobo images) are embedded by the model into the fixture JSON, i.e. instead of returning a string, `WheelSlot.resource` will return the resource object. The relevant code is in the `embedResourcesIntoFixtureJson` function in [`lib/model.js](../lib/model.js).

Thus, all information needed for the fixure is still included in the fixture JSON.

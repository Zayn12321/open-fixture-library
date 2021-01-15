/** @typedef {import('../../lib/model/AbstractChannel.js').default} AbstractChannel */
import { CoarseChannel } from '../../lib/model.js';
import { FineChannel } from '../../lib/model.js';
/** @typedef {import('../../lib/model/Fixture.js').default} Fixture */
import { NullChannel } from '../../lib/model.js';
import { SwitchingChannel } from '../../lib/model.js';

export const version = `0.1.0`;

const MAX_KNOBS = 8;
const MAX_OPZ_FIXTURES = 16;

/**
 * @param {Array.<Fixture>} fixtures An array of Fixture objects.
 * @param {Object} options Global options, including:
 * @param {URL} options.baseDirectory The OFL root directory.
 * @param {Date} options.date The current time.
 * @param {String|undefined} options.displayedPluginVersion Replacement for plugin version if the plugin version is used in export.
 * @returns {Promise.<Array.<Object>, Error>} The generated files.
 */
export async function exportFixtures(fixtures, options) {
  const exportJson = {
    profiles: [],
    config: [],
  };

  const usedKnobs = {};

  fixtures.forEach(fixture => {
    const fixtureKey = `${fixture.manufacturer.key}/${fixture.key}`;

    fixture.modes.forEach((mode, modeIndex) => {
      const modeName = `${fixtureKey}/${mode.shortName}`;

      // add profile
      exportJson.profiles.push({
        name: modeName,
        channels: mode.channels.map(channel => getOpZChannelType(channel, fixtureKey)),
      });

      // add config
      if (modeIndex === 0 && exportJson.config.length < MAX_OPZ_FIXTURES) {
        exportJson.config.push({
          fixture: exportJson.config.length + 1,
          profile: modeName,
        });
      }
    });
  });


  return [{
    name: `dmx.json`,
    content: JSON.stringify(exportJson, null, 2),
    mimetype: `application/json`,
    fixtures,
  }];



  /**
   * @param {AbstractChannel} channel The OFL channel object.
   * @param {String} fixtureKey The OFL fixture key.
   * @returns {String} The OP-Z channel type.
   */
  function getOpZChannelType(channel, fixtureKey) {
    if (channel instanceof SwitchingChannel) {
      channel = channel.defaultChannel;
    }

    if (channel instanceof NullChannel || channel instanceof FineChannel) {
      return `off`;
    }

    const defaultValue = channel.getDefaultValueWithResolution(CoarseChannel.RESOLUTION_8BIT);

    const opZChannelTypes = {
      [`${defaultValue}`]: () => channel.isConstant || channel.type === `Shutter`,
      'red': () => channel.color === `Red`,
      'green': () => channel.color === `Green`,
      'blue': () => channel.color === `Blue`,
      'white': () => channel.color === `White`,
      'color': () => channel.type === `Multi-Color`,
      'intensity': () => channel.type === `Intensity`,
      'fog': () => channel.type === `Fog`,
      // 'knob1': () => false,
      // 'knob2': () => false,
      // 'knob3': () => false,
      // 'knob4': () => false,
      // 'knob5': () => false,
      // 'knob6': () => false,
      // 'knob7': () => false,
      // 'knob8': () => false,
      // 'on': () => false,
      'off': () => channel.type === `Maintenance`,
    };

    const channelType = Object.keys(opZChannelTypes).find(
      type => opZChannelTypes[type](),
    );
    if (channelType) {
      return channelType;
    }

    return getKnobType() || `${defaultValue}`;


    /**
     * Try to use a `knobX` OP-Z channel type for this channel. A channel used
     * across different modes will get the same knob again. null is returned
     * for all channels after all knobs are already assigned.
     * @returns {String|null} The OP-Z channel type `knobX` if applicable, null otherwise.
     */
    function getKnobType() {
      const channelKey = `${fixtureKey}/${channel.key}`;
      if (channelKey in usedKnobs) {
        return usedKnobs[channelKey];
      }

      const usedKnobCount = Object.keys(usedKnobs).length;
      if (usedKnobCount < MAX_KNOBS) {
        usedKnobs[channelKey] = `knob${usedKnobCount + 1}`;

        return usedKnobs[channelKey];
      }

      return null;
    }
  }
}

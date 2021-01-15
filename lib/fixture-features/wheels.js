/** @typedef {import('../model/Fixture.js').default} Fixture */

const schemaProperties = require(`../../lib/schema-properties.js`).default;
const wheelSlotTypes = Object.keys(schemaProperties.wheelSlotTypes);
const wheelTypes = wheelSlotTypes.filter(type => !type.startsWith(`AnimationGobo`)).concat(`AnimationGobo`);

const wheelTypeFeatures = wheelTypes.map(type => ({
  id: `wheel-type-${type}`,
  name: `Wheel type ${type}`,
  description: `Whether the fixture has at least one wheel of type '${type}'`,

  /**
   * @param {Fixture} fixture The Fixture instance
   * @returns {Boolean} true if the fixture has at least one wheel of the current type
   */
  hasFeature: fixture => fixture.wheels.some(
    wheel => wheel.type === type,
  ),
}));

const wheelSlotTypeFeatures = wheelSlotTypes.map(type => ({
  id: `wheel-slot-type-${type}`,
  name: `Wheel slot type ${type}`,
  description: `Whether the fixture has at least one wheel slot of type '${type}'`,

  /**
   * @param {Fixture} fixture The Fixture instance
   * @returns {Boolean} true if the fixture has at least one wheel slot of the current type
   */
  hasFeature: fixture => fixture.wheels.some(
    wheel => wheel.slots.some(
      slot => slot.type === type,
    ),
  ),
}));

const resourceFeature = {
  id: `wheel-slot-uses-resource`,
  name: `Wheel slot uses resource`,
  description: `Whether the fixture has at least one wheel slot that references a resource`,

  /**
   * @param {Fixture} fixture The Fixture instance
   * @returns {Boolean} true if the fixture has at least one wheel slot that references a resource
   */
  hasFeature: fixture => fixture.wheels.some(
    wheel => wheel.slots.some(
      slot => slot.resource !== null,
    ),
  ),
};

module.exports = wheelTypeFeatures.concat(wheelSlotTypeFeatures, resourceFeature);

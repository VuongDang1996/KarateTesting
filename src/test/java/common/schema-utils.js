/**
 * common/schema-utils.js — Runtime JSON Schema composition utilities.
 *
 * Loaded globally by karate-config.js as the variable `schemaUtils`.
 * Also loadable locally:  * def schemaUtils = read('classpath:common/schema-utils.js')
 *
 * All functions return NEW objects — they never mutate their inputs.
 */
(function() {
var schemaUtils = {

  // ── Structural operations ────────────────────────────────────────────────────

  /**
   * Shallow-merge two schema objects.
   * Fields from `override` win on collision — useful for environment-specific
   * or role-specific schema variants.
   *
   * Example:
   *   merge({ id: '#number', name: '#string' }, { name: '#? _.length > 0' })
   *   → { id: '#number', name: '#? _.length > 0' }
   */
  merge: function(base, override) {
    var result = {};
    karate.keysOf(base).forEach(function(k)     { result[k] = base[k];     });
    karate.keysOf(override).forEach(function(k) { result[k] = override[k]; });
    return result;
  },

  /**
   * Return a new schema containing ONLY the listed fields.
   * Use this to build a minimal "v1 contract" from a larger v2+ schema.
   *
   * Example:
   *   pick(petSchema, ['id', 'name', 'status'])
   *   → { id: '#number', name: '#string', status: '#regex (available|...)' }
   */
  pick: function(schema, fields) {
    var result = {};
    fields.forEach(function(f) {
      if (schema[f] !== undefined) result[f] = schema[f];
    });
    return result;
  },

  /**
   * Return a new schema where every scalar fuzzy matcher is made optional.
   * Converts  "#foo"  →  "##foo"  for one-level depth.
   * Nested objects and arrays are left unchanged (they already handle optionality
   * internally via ## prefixes on their parent key).
   *
   * Useful when generating a "permissive" schema for partial-response assertions.
   */
  makeOptional: function(schema) {
    var result = {};
    karate.keysOf(schema).forEach(function(k) {
      var v = schema[k];
      if (typeof v === 'string' && v.charAt(0) === '#' && v.charAt(1) !== '#') {
        result[k] = '#' + v;    // "#string" → "##string"
      } else {
        result[k] = v;
      }
    });
    return result;
  },

  /**
   * Append (or override) a single field assertion on an existing schema.
   * Returns a new schema without mutating the original.
   *
   * Example:
   *   withField(strictSchema, 'name', '#? _.length >= 3 && _.length <= 50')
   */
  withField: function(schema, key, matcher) {
    var patch = {};
    patch[key] = matcher;
    return schemaUtils.merge(schema, patch);
  },

  /**
   * Remove one or more fields from a schema.
   * Returns a new schema without the listed keys.
   *
   * Example:
   *   without(petSchema, ['tags', 'photoUrls'])
   *   → schema without the tags and photoUrls keys
   */
  without: function(schema, fields) {
    var excluded = {};
    fields.forEach(function(f) { excluded[f] = true; });
    var result = {};
    karate.keysOf(schema).forEach(function(k) {
      if (!excluded[k]) result[k] = schema[k];
    });
    return result;
  },

  // ── Validation helpers ───────────────────────────────────────────────────────

  /**
   * Programmatically check a value against a schema WITHOUT throwing.
   * Returns { pass: boolean, message: string }.
   *
   * Wraps karate.match() so callers get a consistent result object.
   *
   * Example:
   *   * def check = schemaUtils.validate(response, petSchema)
   *   * if (!check.pass) karate.log('[VIOLATION]', check.message)
   */
  validate: function(value, schema) {
    return karate.match(value, schema);
  },

  /**
   * Assert the response has EXACTLY the keys listed — no more, no less.
   * Returns { pass: boolean, extra: [], missing: [] }.
   *
   * Example:
   *   * def keyCheck = schemaUtils.exactKeys(response, ['id', 'name', 'status'])
   *   * assert keyCheck.pass
   */
  exactKeys: function(obj, expectedKeys) {
    var actual   = karate.keysOf(obj);
    var expected = {};
    expectedKeys.forEach(function(k) { expected[k] = true; });

    var missing = expectedKeys.filter(function(k) { return actual.indexOf(k) === -1; });
    var extra   = actual.filter(function(k)        { return !expected[k]; });

    return {
      pass   : missing.length === 0 && extra.length === 0,
      missing: missing,
      extra  : extra
    };
  }

};

return schemaUtils;
})()

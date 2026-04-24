/**
 * helpers.js — Shared JavaScript utility library.
 *
 * Load in any feature with:
 *   * def h = read('classpath:helpers.js')
 *
 * All utilities are exposed as properties of the returned object so they
 * benefit from a single namespace and are easy to discover via IDE auto-complete.
 *
 * Available via karate-config.js as the global `helpers` variable, so features
 * can call  helpers.randomInt(1, 100)  without the extra read().
 */
(function() {
var helpers = {

  // ── Generators ──────────────────────────────────────────────────────────────

  /**
   * Random integer between min and max (both inclusive).
   * Example:  helpers.randomInt(1000000, 9999999)
   */
  randomInt: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Random alphanumeric string of the requested length.
   * Example:  helpers.randomString(8)  →  'XkT3mWqZ'
   */
  randomString: function(len) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var out = '';
    for (var i = 0; i < len; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  },

  /**
   * Current UTC instant as an ISO-8601 string.
   * Example:  helpers.isoNow()  →  '2026-04-23T10:15:30.000Z'
   */
  isoNow: function() {
    return new Date().toISOString();
  },

  // ── Payload builders ────────────────────────────────────────────────────────

  /**
   * Build a complete, valid Pet payload ready to POST to /pet.
   * @param {number} id      - unique numeric pet ID
   * @param {string} name    - pet display name
   * @param {string} status  - 'available' | 'pending' | 'sold'
   */
  pet: function(id, name, status) {
    return {
      id       : id,
      category : { id: 1, name: 'TestCategory' },
      name     : name,
      photoUrls: ['https://ci.example.com/pets/' + name + '.jpg'],
      tags     : [{ id: 1, name: 'auto-test' }],
      status   : status || 'available'
    };
  },

  /**
   * Build a complete, valid Order payload ready to POST to /store/order.
   * @param {number} orderId  - unique numeric order ID
   * @param {number} petId    - ID of the pet being ordered
   * @param {number} [qty=1]  - quantity
   */
  order: function(orderId, petId, qty) {
    return {
      id      : orderId,
      petId   : petId,
      quantity: qty || 1,
      shipDate: new Date().toISOString(),
      status  : 'placed',
      complete: false
    };
  },

  // ── Validators ──────────────────────────────────────────────────────────────

  /** Returns true when value is one of the three valid pet status strings. */
  isValidPetStatus: function(status) {
    return ['available', 'pending', 'sold'].indexOf(status) !== -1;
  },

  /** Returns true when value is one of the three valid order status strings. */
  isValidOrderStatus: function(status) {
    return ['placed', 'approved', 'delivered'].indexOf(status) !== -1;
  },

  // ── String helpers ──────────────────────────────────────────────────────────

  /** Pads a number to the requested minimum width with leading zeros. */
  zeroPad: function(n, width) {
    var s = '' + n;
    while (s.length < width) { s = '0' + s; }
    return s;
  },

  // ── Statistics ───────────────────────────────────────────────────────────────

  /**
   * Arithmetic mean of a numeric array.
   * Example:  helpers.mean([100, 200, 300])  →  200
   */
  mean: function(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce(function(s, v) { return s + v; }, 0) / arr.length;
  },

  /**
   * Population standard deviation of a numeric array.
   * Example:  helpers.stddev([100, 200, 300])  →  81.65…
   */
  stddev: function(arr) {
    if (!arr || arr.length === 0) return 0;
    var m    = helpers.mean(arr);
    var sumSq = arr.reduce(function(s, v) { return s + Math.pow(v - m, 2); }, 0);
    return Math.sqrt(sumSq / arr.length);
  },

  /**
   * Percentile value from a numeric array (nearest-rank method).
   * p = 0 returns the minimum, p = 100 returns the maximum.
   * Example:  helpers.percentile([100,200,300,400,500], 95)  →  500
   */
  percentile: function(arr, p) {
    if (!arr || arr.length === 0) return 0;
    var sorted = arr.slice().sort(function(a, b) { return a - b; });
    if (p <= 0)   return sorted[0];
    if (p >= 100) return sorted[sorted.length - 1];
    var idx = Math.ceil(p / 100 * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  },

  /**
   * Returns true when value falls within [min, max] (both inclusive).
   * Example:  helpers.inRange(250, 200, 300)  →  true
   */
  inRange: function(value, min, max) {
    return value >= min && value <= max;
  }

};

return helpers;
})()

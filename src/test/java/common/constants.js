/**
 * common/constants.js — Application-wide typed constants.
 *
 * Loaded globally by karate-config.js as the variable `C`, so every feature
 * can reference constants without an extra read():
 *
 *   And param status = C.petStatus.AVAILABLE
 *   * assert responseTime < C.sla.NORMAL
 *   Then status C.http.OK
 *
 * You may also load it locally in a single feature:
 *   * def C = read('classpath:common/constants.js')
 */
(function() {
var C = {

  // ── Pet domain ─────────────────────────────────────────────────────────────
  petStatus: {
    AVAILABLE : 'available',
    PENDING   : 'pending',
    SOLD      : 'sold'
  },

  // ── Store / order domain ────────────────────────────────────────────────────
  orderStatus: {
    PLACED    : 'placed',
    APPROVED  : 'approved',
    DELIVERED : 'delivered'
  },

  // ── HTTP status codes ───────────────────────────────────────────────────────
  http: {
    OK           : 200,
    CREATED      : 201,
    NO_CONTENT   : 204,
    BAD_REQUEST  : 400,
    UNAUTHORIZED : 401,
    FORBIDDEN    : 403,
    NOT_FOUND    : 404,
    METHOD_NOT_ALLOWED : 405,
    SERVER_ERROR : 500
  },

  // ── SLA thresholds (ms) ─────────────────────────────────────────────────────
  sla: {
    FAST   : 500,
    NORMAL : 3000,
    SLOW   : 5000
  },

  // ── Petstore API paths ──────────────────────────────────────────────────────
  paths: {
    PET            : 'pet',
    PET_FIND_STATUS: 'pet/findByStatus',
    PET_FIND_TAGS  : 'pet/findByTags',
    STORE_ORDER    : 'store/order',
    STORE_INVENTORY: 'store/inventory',
    USER           : 'user',
    USER_LOGIN     : 'user/login',
    USER_LOGOUT    : 'user/logout'
  },

  // ── Performance benchmarking ───────────────────────────────────────────────
  perf: {
    ITERATIONS      : 10,    // number of probe requests per benchmark run
    WARMUP_REQUESTS : 2,     // pre-discarded warm-up calls (unused by probe but documented)
    MEAN_THRESHOLD  : 3000,  // ms — mean latency must not exceed
    P95_THRESHOLD   : 5000,  // ms — 95th-percentile must not exceed
    P99_THRESHOLD   : 8000   // ms — 99th-percentile must not exceed
  },

  // ── Mock server ────────────────────────────────────────────────────────────
  mock: {
    PORT : 9876,
    HOST : 'localhost',
    get baseUrl() { return 'http://' + this.HOST + ':' + this.PORT + '/v2'; }
  }

};

return C;
})()

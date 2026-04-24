/**
 * karate-config.js — Global configuration loaded before every feature.
 *
 * Select environment at runtime:
 *   mvn test -Dkarate.env=qa
 *   mvn test -Dkarate.env=staging
 *
 * Default environment: dev
 */
function fn() {

  // ── 1. Resolve active environment ────────────────────────────────────────
  var env = karate.env;
  if (!env) { env = 'dev'; }
  karate.log('[karate-config] Active environment:', env);

  // ── 2. Per-environment settings ──────────────────────────────────────────
  var envSettings = {
    dev: {
      baseUrl : 'https://petstore.swagger.io/v2',
      apiKey  : 'dev-api-key-00000'
    },
    qa: {
      baseUrl : 'https://petstore.swagger.io/v2',
      apiKey  : 'qa-api-key-11111'
    },
    staging: {
      baseUrl : 'https://petstore.swagger.io/v2',
      apiKey  : 'staging-api-key-22222'
    }
  };

  var settings = envSettings[env] || envSettings['dev'];

  // ── 3. Build the shared config object ────────────────────────────────────
  var config = {
    env     : env,
    baseUrl : settings.baseUrl,
    apiKey  : settings.apiKey,

    // Reusable helper: generates a random 7-digit integer suitable for pet IDs.
    // Call from any feature with:  * def newId = call uniqueId
    uniqueId: function() {
      return Math.floor(Math.random() * 9000000) + 1000000;
    }
  };

  // ── 4. Load shared JavaScript utility library ───────────────────────────
  // Exposes helpers.pet(), helpers.order(), helpers.randomInt(), etc.
  // to every feature as the `helpers` global variable.
  var helpers = read('classpath:helpers.js');
  config.helpers = helpers;

  // ── 5. Load typed application constants ──────────────────────────────────
  // Every feature gets `C` (e.g. C.petStatus.AVAILABLE, C.http.OK, C.sla.FAST)
  // without needing a local read() call.
  var C = read('classpath:common/constants.js');
  config.C = C;
  // ── 6. Load schema-composition utilities ─────────────────────────────────
  // Exposes schemaUtils.merge(), .pick(), .makeOptional(), .withField(), etc.
  var schemaUtils = read('classpath:common/schema-utils.js');
  config.schemaUtils = schemaUtils;

  // ── 7. Load custom test reporter ──────────────────────────────────────────
  // reporter.record(...) / reporter.flush() / reporter.summary() available
  // in every feature and in the afterScenario hook.
  var reporter = read('classpath:common/reporter.js');
  config.reporter = reporter;
  // ── 8. Bootstrap shared session ONCE per JVM ─────────────────────────────
  // karate.callSingle caches the result in memory — all parallel threads
  // reuse the same session object.  Ideal for OAuth token exchange.
  // Passing `config` injects baseUrl, apiKey, env into the auth feature.
  var session = karate.callSingle('classpath:petstore/helpers/auth.feature@auth', config);
  config.session = session;
  karate.log('[karate-config] Session bootstrapped at:', session.bootstrappedAt);

  // ── 9. Mock server URL override ────────────────────────────────────────────
  // When MockRunner passes -Dmock.baseUrl=http://localhost:9876/v2,
  // all features transparently target the local mock instead of the live API.
  // No feature file changes needed — the substitution happens here.
  var mockBaseUrl = karate.properties['mock.baseUrl'];
  if (mockBaseUrl) {
    config.baseUrl = mockBaseUrl;
    karate.log('[karate-config] Mock mode: baseUrl overridden to', mockBaseUrl);
  }

  // ── 10. Global HTTP configuration ─────────────────────────────────────────
  karate.configure('connectTimeout', 10000);
  karate.configure('readTimeout'   , 10000);

  // Accept self-signed / corporate-proxy TLS certificates in non-prod envs.
  karate.configure('ssl', true);

  // Charset for request serialisation.
  karate.configure('charset', 'UTF-8');

  // ── 11. Automatic retry on transient failures ──────────────────────────────
  // Features can override with:  * configure retry = { count: 5, interval: 500 }
  // The `retry until <condition>` DSL keyword uses these defaults.
  karate.configure('retry', { count: 3, interval: 2000 });

  // ── 12. Dynamic request headers (function evaluated before every request) ──
  // A new X-Request-Id UUID and X-Timestamp are generated per HTTP call,
  // which enables distributed tracing correlation in server logs.
  // The api_key is captured at config build time via closure.
  var _apiKey = settings.apiKey;
  karate.configure('headers', function() {
    return {
      'Content-Type' : 'application/json',
      'Accept'       : 'application/json',
      'api_key'      : _apiKey,
      'X-Request-Id' : '' + java.util.UUID.randomUUID(),
      'X-Timestamp'  : new Date().toISOString()
    };
  });

  // ── 13. afterScenario hook — automatic pass/fail logging + reporter ─────────
  // karate.info exposes: scenarioName, tags, feature.packageQualifiedName,
  // callDepth, errorMessage (non-null only on failure).
  karate.configure('afterScenario', function() {
    var info   = karate.info;
    var status = info.errorMessage ? 'FAIL' : 'PASS';
    if (info.errorMessage) {
      karate.log('[FAIL]', info.scenarioName, '|', info.errorMessage);
    } else {
      karate.log('[PASS]', info.scenarioName);
    }
    // Only record top-level scenarios (callDepth 0); skip helper calls
    if (info.callDepth === 0) {
      reporter.record(info.scenarioName, status, 0);
    }
  });

  // ── 14. abortedStepsShouldPass = false ────────────────────────────────────
  // Scenarios aborted via karate.abort() are counted as failures so
  // they don't silently inflate the pass-rate in the Masterthought report.
  karate.configure('abortedStepsShouldPass', false);

  return config;
}

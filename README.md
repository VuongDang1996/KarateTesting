# Karate Petstore API Tests

> **Enterprise-grade API test automation suite** built with [Karate DSL](https://karatelabs.github.io/karate/) targeting the [Swagger Petstore API](https://petstore.swagger.io/). Covers full CRUD lifecycles, consumer-driven contract testing, stateful API mocking, data-driven testing, statistical performance benchmarking, and automated Masterthought HTML reporting — all within a single, zero-dependency Maven build.

---

## Table of Contents

1. [Tech Stack & Prerequisites](#tech-stack--prerequisites)
2. [Project Structure](#project-structure)
3. [Getting Started / Execution](#getting-started--execution)
4. [Maven Profiles Reference](#maven-profiles-reference)
5. [Runner Classes Deep Dive](#runner-classes-deep-dive)
6. [Configuration (`karate-config.js`)](#configuration-karate-configjs)
7. [Tagging Strategy](#tagging-strategy)
8. [Knowledge Base / Core Concepts](#knowledge-base--core-concepts)
   - [1. Full E2E CRUD Testing](#1-full-e2e-crud-testing)
   - [2. Contract & Schema Validation](#2-contract--schema-validation)
   - [3. Schema Composition Utilities (`schema-utils.js`)](#3-schema-composition-utilities-schema-utilsjs)
   - [3a. Additional Schemas (`order-schema.json` & `user-schema.json`)](#3a-additional-schemas-order-schemajson--user-schemajson)
   - [4. Reusable Helpers & Utilities](#4-reusable-helpers--utilities)
   - [5. Centralized Constants (`constants.js`)](#5-centralized-constants-constantsjs)
   - [6. Data-Driven Testing](#6-data-driven-testing)
   - [7. Stateful API Mocking](#7-stateful-api-mocking)
   - [8. Statistical Performance Benchmarking](#8-statistical-performance-benchmarking)
   - [9. Lifecycle Hooks](#9-lifecycle-hooks)
   - [10. Thread-Safe Test Data Management](#10-thread-safe-test-data-management)
   - [11. Advanced Search & Keyword Showcase](#11-advanced-search--keyword-showcase)
9. [Gotchas & Lessons Learned](#gotchas--lessons-learned)
10. [Reporting](#reporting)
11. [Logging Configuration](#logging-configuration)
12. [`.gitignore`](#gitignore)
13. [CI/CD Integration](#cicd-integration)

---

## Tech Stack & Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| **Java** | 17 | Runtime & Java interop in feature files |
| **Maven** | 3.8+ | Build, dependency management, profiles |
| **Karate DSL** (`karate-junit5`) | 1.4.1 | Core test framework (HTTP, mocking, assertions) |
| **JUnit** | 5 (Jupiter) | Test runner integration |
| **Maven Surefire Plugin** | 3.2.5 | Executes JUnit runners, forwards `karate.env` |
| **Maven Compiler Plugin** | 3.13.0 | Compiles runner Java classes at source level 17 |
| **Masterthought Cucumber Reporting** | 5.8.1 | Rich HTML report generation |

---

## Project Structure

```text
karate-petstore/
├── pom.xml                               # Maven build — dependencies, plugins, profiles
└── src/test/java/
    ├── karate-config.js                  # Global config: env, auth, headers, hooks
    ├── helpers.js                        # Shared JS utility library
    ├── logback-test.xml                  # Logging configuration
    └── common/
    │   ├── constants.js                  # Typed enums: HTTP codes, SLAs, API paths
    │   ├── hooks.feature                 # Reusable @setup / @teardown lifecycle hooks
    │   ├── reporter.js                   # Custom pass/fail scenario recorder
    │   └── schema-utils.js              # Runtime schema composition utilities
    └── petstore/
        ├── data/
        │   └── pets.csv                 # CSV test data for Scenario Outline
        ├── features/
        │   ├── contract/
        │   │   └── contract-tests.feature  # Consumer-driven contract testing
        │   ├── performance/
        │   │   ├── perf-benchmark.feature  # Statistical benchmarks (mean/p95/p99)
        │   │   └── probe.feature           # Single-probe callable scenario
        │   ├── pet/
        │   │   ├── pet-crud.feature        # Full CRUD lifecycle + data-driven
        │   │   └── pet-search.feature      # findByStatus, findByTags, negative paths
        │   ├── store/
        │   │   └── store.feature           # Store inventory & order flows
        │   └── user/
        │       └── user.feature            # User CRUD & login/logout
        ├── helpers/
        │   ├── auth.feature               # Session bootstrap (callSingle)
        │   └── utils.feature              # Reusable @createPet / @deletePet helpers
        ├── mocks/
        │   └── pet-mock.feature           # Stateful Karate Netty mock server
        ├── runners/
        │   ├── MasterRunner.java          # Default: all features, 5 threads
        │   ├── SmokeRunner.java           # @smoke only, 3 threads (PR gate)
        │   ├── RegressionRunner.java      # @regression, 5 threads (nightly)
        │   ├── MockRunner.java            # Starts mock server, runs against it
        │   ├── TestDataManager.java       # Thread-safe LIFO resource cleanup registry
        │   └── TestUtils.java            # Static Java utility helpers
        └── schemas/
            ├── pet-schema.json            # Loose schema (optional fields allowed)
            └── pet-schema-strict.json     # Strict schema (all fields required)
```

---

## Getting Started / Execution

### Prerequisites
Make sure the following are installed and available on your `PATH`:
```bash
java -version   # Must be 17+
mvn -version    # Must be 3.8+
```

### Run All Tests (Default — `dev` environment)
```bash
mvn test
```

### Run Against a Specific Environment
```bash
mvn test "-Dkarate.env=qa"
mvn test "-Dkarate.env=staging"
```

### Run a Single Feature File
```bash
mvn test "-Dkarate.options=classpath:petstore/features/pet/pet-crud.feature"
```

### Run by Tag (Ad-hoc)
```bash
mvn test "-Dkarate.options=--tags @smoke"
mvn test "-Dkarate.options=--tags @regression"
mvn test "-Dkarate.options=--tags @contract"
mvn test "-Dkarate.options=--tags @data-driven"
```

> **Note (Windows):** Wrap the `-D` property value in double-quotes to prevent the shell from misinterpreting `@`.

**Verified tag scenario counts:**

| Tag | Scenarios | Build |
|---|---|---|
| `@smoke` | 9 | ✅ |
| `@regression` | 14 | ✅ |
| `@contract` | 5 | ✅ |
| `@data-driven` | 5 | ✅ |
| `@performance` | 2 | ✅ |
| `@search` | 2 | ✅ |
| `@negative` | 1 | ✅ |
| `@crud` | 1 | ✅ |
| `@order` | 1 | ✅ |
| `@retry` | 1 | ✅ |
| `@table` | 1 | ✅ |
| `@functional` | 1 | ✅ |
| `@keyword-showcase` | 1 | ✅ |
| `@java-interop` | 1 | ✅ |
| `@find-by-tags` | 1 | ✅ |

### Skip Tests
```bash
mvn test -DskipTests
```

---

## Maven Profiles Reference

The `pom.xml` defines four execution profiles, each wired to a specific runner and thread count:

| Profile | Command | Runner | Threads | Purpose |
|---|---|---|---|---|
| *(default)* | `mvn test` | `MasterRunner` | 5 | All features |
| `smoke` | `mvn test -Psmoke` | `SmokeRunner` | 3 | PR gate — fast confidence check |
| `regression` | `mvn test -Pregression` | `RegressionRunner` | 5 | Nightly full suite |
| `mock` | `mvn test -Pmock` | `MockRunner` | 2 | No network — local mock only |
| `performance` | `mvn test -Pperformance` | `MasterRunner` | — | `@performance` tagged benchmarks |

**Combine profiles with environment overrides:**
```bash
mvn test -Psmoke "-Dkarate.env=staging"

```

---

## Runner Classes Deep Dive

### `MasterRunner.java` — Default Full Suite
The primary JUnit 5 entry point. Uses `Runner.parallel(5)` (Karate's own thread pool) and, after all tests finish, generates the Masterthought HTML report by scanning all Cucumber JSON files written to `target/karate-reports/`.

```java
Results results = Runner
    .path("classpath:petstore/features")
    .tags("~@ignore")
    .outputCucumberJson(true)
    .parallel(5);

generateMasterthoughtReport(results.getReportDir());
assertEquals(0, results.getFailCount(), results.getErrorMessages());
```

The report is enriched with build metadata:
```java
config.addClassifications("Environment", System.getProperty("karate.env", "dev"));
config.addClassifications("Framework",   "Karate DSL 1.4.1 / JUnit 5");
config.addClassifications("Platform",    System.getProperty("os.name"));
config.addClassifications("Java",        System.getProperty("java.version"));
```

### `SmokeRunner.java` — PR Gate
Runs only `@smoke` tagged scenarios with 3 parallel threads — optimized for speed (< 2 minutes). Activated via the `smoke` Maven profile or directly:
```bash
mvn test -Dtest=SmokeRunner -Dkarate.env=staging
```

### `MockRunner.java` — Offline Testing
Starts the Karate Netty mock server in a `@BeforeAll` JUnit hook, runs the pet-crud and store smoke scenarios against it, and shuts it down in `@AfterAll`. No internet connection required.

```java
@BeforeAll
static void startMockServer() {
    mockServer = MockServer
            .feature("classpath:petstore/mocks/pet-mock.feature")
            .http(9876)
            .build();
}

@AfterAll
static void stopMockServer() { mockServer.stop(); }
```

### `RegressionRunner.java` — Nightly Full Suite
Runs only `@regression` tagged scenarios with 5 parallel threads — identical in structure to `SmokeRunner` but with a wider tag scope. Activated via the `regression` Maven profile:

```bash
mvn test -Pregression
mvn test -Pregression -Dkarate.env=qa
```

```java
Results results = Runner
    .path("classpath:petstore/features")
    .tags("@regression", "~@ignore")
    .outputCucumberJson(true)
    .parallel(5);

MasterRunner.generateMasterthoughtReport(results.getReportDir());
assertEquals(0, results.getFailCount(), results.getErrorMessages());
```

---

### `TestUtils.java` — Java Interop Utility Class

[`TestUtils.java`](src/test/java/petstore/runners/TestUtils.java) is a lightweight Java utility callable from any Karate feature via `Java.type()`. It demonstrates Karate's seamless JVM interop — any Java class on the test classpath can be invoked from Gherkin.

```java
public static String maskSensitive(String value, int visibleChars);
public static boolean areClose(long a, long b, long delta);
public static String reverse(String value);
public static boolean isValidEmail(String email);
```

**Usage from a feature:**
```gherkin
* def Utils = Java.type('petstore.runners.TestUtils')

# Mask sensitive values for safe logging
* def masked = Utils.maskSensitive(session.apiKey, 3)

# Numeric proximity check
* def close = Utils.areClose(1000000, 1000005, 10)

# String transformation
* def rev = Utils.reverse('karate')

# Email validation
* def valid = Utils.isValidEmail('tester@example.com')
```

---

## Configuration (`karate-config.js`)

`karate-config.js` is loaded **before every feature file**. It wires the entire framework together.

### Environment & Base URL
```javascript
var envSettings = {
  dev:     { baseUrl: 'https://petstore.swagger.io/v2', apiKey: 'dev-api-key-00000' },
  qa:      { baseUrl: 'https://petstore.swagger.io/v2', apiKey: 'qa-api-key-11111' },
  staging: { baseUrl: 'https://petstore.swagger.io/v2', apiKey: 'staging-api-key-22222' }
};
var settings = envSettings[env] || envSettings['dev'];
```

### Shared Session (`callSingle`)
Bootstraps authentication **once per JVM** — all parallel threads reuse the same cached session object. Ideal for OAuth token exchange:
```javascript
var session = karate.callSingle('classpath:petstore/helpers/auth.feature@auth', config);
config.session = session;
```

### Dynamic Request Headers
A fresh `X-Request-Id` UUID and `X-Timestamp` are injected on **every single HTTP call** for distributed tracing.

> **Important:** `Content-Type` is intentionally **not** set in the global headers function. Karate auto-detects the correct content type per request — `application/json; charset=UTF-8` for JSON bodies, `application/x-www-form-urlencoded` for `form field` steps. Setting it globally would override Karate's detection and cause HTTP 415 on form-data requests.

```javascript
karate.configure('headers', function() {
  return {
    'Accept'       : 'application/json',
    'api_key'      : _apiKey,
    'X-Request-Id' : '' + java.util.UUID.randomUUID(),
    'X-Timestamp'  : new Date().toISOString()
  };
});
```

### Global HTTP Settings
```javascript
karate.configure('connectTimeout', 10000);
karate.configure('readTimeout',    10000);
karate.configure('ssl',            true);   // Accepts self-signed certs in non-prod
karate.configure('charset',        'UTF-8');
karate.configure('retry',          { count: 3, interval: 2000 }); // Transient failure resilience
karate.configure('abortedStepsShouldPass', false); // Aborted scenarios count as failures
```

### Automatic After-Scenario Hook
Every scenario's pass/fail status is logged and forwarded to the custom `reporter.js`, which accumulates metrics for a final run summary:
```javascript
karate.configure('afterScenario', function() {
  var info   = karate.info;
  var status = info.errorMessage ? 'FAIL' : 'PASS';
  if (info.callDepth === 0) {
    reporter.record(info.scenarioName, status, 0);
  }
});

### Custom Reporter (`reporter.js`)

[`common/reporter.js`](src/test/java/common/reporter.js) is an in-test JSON summary reporter loaded globally as `reporter`. It accumulates scenario-level pass/fail metrics and writes a machine-readable summary to `target/test-summary.json`:

| Method | Description |
|---|---|
| `reporter.record(name, status, duration, tag)` | Record a single scenario outcome |
| `reporter.summary()` | Return the summary object: `{total, passed, failed, passRate, ...}` |
| `reporter.flush()` | Serialise summary to `target/test-summary.json` via `karate.write()` |
| `reporter.reset()` | Clear all accumulated records between feature-level runs |

The `afterScenario` hook in `karate-config.js` calls `reporter.record()` automatically for every scenario — no feature file changes needed.

### Mock Server URL Override
When `MockRunner` sets `-Dmock.baseUrl=http://localhost:9876/v2`, this block transparently redirects all features — zero feature file changes needed:
```javascript
var mockBaseUrl = karate.properties['mock.baseUrl'];
if (mockBaseUrl) { config.baseUrl = mockBaseUrl; }
```

---

## Tagging Strategy

Tags control which scenarios run in each profile/runner. Every scenario carries one or more of the following:

| Tag | Meaning |
|---|---|
| `@smoke` | Fast, critical-path check — run on every PR |
| `@regression` | Full coverage — run nightly |
| `@contract` | API contract/schema enforcement |
| `@data-driven` | Parameterized tests driven by CSV/JSON |
| `@performance` | Response-time benchmarks |
| `@negative` | Error handling & boundary conditions |
| `@ignore` | Helper scenarios — excluded from all runs |
| `@mock` | Designed to run against the local mock |

---

## Knowledge Base / Core Concepts

### 1. Full E2E CRUD Testing

The `pet-crud.feature` demonstrates a complete lifecycle in a single scenario using **reusable callable features** for setup and teardown:

```gherkin
@smoke @crud
Scenario: Full E2E CRUD with Schema Validation and Fuzzy Matchers

  # CREATE — via reusable helper, avoiding code duplication
  * def newId   = call uniqueId
  * def created = call read('classpath:petstore/helpers/utils.feature@createPet') \
                  { petId: #(newId), name: 'Buddy', status: 'available' }

  # READ & STRICT SCHEMA VALIDATION
  Given path 'pet', created.createdPetId
  When method get
  Then status 200
  And match response == schema               # Full structural check
  And match response.id   == '#? _ > 0'     # JS predicate
  And match response.name == '#string'       # Fuzzy type check

  # UPDATE
  * set updatePayload.name = 'Buddy-Updated'
  Given path 'pet'
  And request updatePayload
  When method put
  Then status 200
  And match response.name == 'Buddy-Updated'

  # DELETE — guaranteed cleanup
  * call read('classpath:petstore/helpers/utils.feature@deletePet') { petId: #(petId) }
```

---

### 2. Contract & Schema Validation

`contract-tests.feature` implements a **consumer-driven contract testing** pattern with strict and loose schema variants:

```gherkin
# Strict: EVERY field must be present with correct type
And match response == strictSchema

# Partial: backward-compatible check — extra fields allowed
And match response contains v1Contract

# Programmatic check — does NOT throw, returns a result object
* def result = karate.match(fakeResponse, strictSchema)
And match result.pass == false
And match result.message == '#string'

# Assert forbidden internal fields are absent
And match response !contains { _rev: '#present' }
```

---

### 3. Schema Composition Utilities (`schema-utils.js`)

`common/schema-utils.js` is a library of pure functions for runtime schema manipulation. All functions return **new objects** — inputs are never mutated.

| Function | Description |
|---|---|
| `merge(base, override)` | Shallow-merges two schemas; `override` wins on collision |
| `pick(schema, fields[])` | Returns a minimal schema with only the listed fields |
| `makeOptional(schema)` | Converts all `#matcher` → `##matcher` (optional) |
| `withField(schema, key, matcher)` | Appends or overrides a single field assertion |
| `without(schema, fields[])` | Returns a schema with listed keys removed |
| `validate(value, schema)` | Wraps `karate.match()` — returns `{pass, message}` without throwing |
| `exactKeys(obj, keys[])` | Asserts exact key set — returns `{pass, missing[], extra[]}` |

**Example — building an environment-specific schema at runtime:**
```gherkin
# Build a minimal v1 contract (only fields the old consumer cares about)
* def v1Contract = schemaUtils.pick(strictSchema, ['id', 'name', 'status'])

# Merge two schemas — extraFields.name overrides baseFields.name
* def composed = schemaUtils.merge(baseFields, extraFields)

# Relax a strict schema for a permissive assertion
* def relaxed = schemaUtils.makeOptional(strictSchema)

# Dynamically add a runtime constraint not in the base schema
* def extendedSchema = schemaUtils.withField(strictSchema, 'name', '#? _.length >= 3')
```

---

### 3a. Additional Schemas (`order-schema.json` & `user-schema.json`)

Beyond the pet schemas, the project includes schemas for store orders and users:

**`schemas/order-schema.json`** — Validates store order responses:
```json
{ "id": "#number", "petId": "#number", "quantity": "#number",
  "shipDate": "##string", "status": "#regex (placed|approved|delivered)",
  "complete": "#boolean" }
```
Used by `store.feature` order lifecycle scenarios.

**`schemas/user-schema.json`** — Validates user responses:
```json
{ "id": "##number", "username": "#string", "firstName": "##string",
  "lastName": "##string", "email": "##string", "password": "##string",
  "phone": "##string", "userStatus": "##number" }
```
Most user fields use `##` (optional) since the demo API returns sparse responses.

---

### 4. Reusable Helpers & Utilities

**`helpers.js`** — globally available as `helpers`. Contains three categories of utilities:

*Generators:*
```javascript
helpers.randomInt(1000000, 9999999)   // Random integer in range
helpers.randomString(8)               // Random alphanumeric: 'XkT3mWqZ'
helpers.isoNow()                      // '2026-04-30T10:15:30.000Z'
```

*Payload Builders:*
```javascript
helpers.pet(id, name, status)         // Full valid POST /pet body
helpers.order(orderId, petId, qty)    // Full valid POST /store/order body
```

*Statistics (used by perf benchmarks):*
```javascript
helpers.mean([100, 200, 300])         // → 200
helpers.stddev([100, 200, 300])       // → 81.65…
helpers.percentile(times, 95)         // → p95 value
helpers.inRange(250, 200, 300)        // → true
```

*Validators:*
```javascript
helpers.isValidPetStatus('available') // → true
helpers.isValidOrderStatus('placed')  // → true
```

**`petstore/helpers/utils.feature`** — Reusable Karate callable scenarios:
```gherkin
# Callable with a tagged scenario — acts as a named function
@createPet
Scenario: Create a pet and return its ID
  ...
  * def createdPetId = response.id

@deletePet
Scenario: Delete a pet by ID
  Given path 'pet', petId
  When method delete
  Then status 200
```

Usage from any feature:
```gherkin
* def created = call read('classpath:petstore/helpers/utils.feature@createPet') \
                { petId: #(newId), name: 'Buddy', status: 'available' }
* def petId   = created.createdPetId
```

The file also provides `@createOrder` and `@deleteOrder` helpers for store order management:

```gherkin
@createOrder
Scenario: Create a Store Order
  Given path 'store/order'
  And request helpers.order(orderId, petId, quantity)
  When method post
  Then status 200
  * def createdOrderId = response.id

@deleteOrder
Scenario: Delete a Store Order by ID
  Given path 'store/order', orderId
  When method delete
  Then status 200
```

Usage:
```gherkin
* def oid    = call uniqueId
* def placed = call read('classpath:petstore/helpers/utils.feature@createOrder') \
               { orderId: #(oid), petId: #(petId) }
* def orderId = placed.createdOrderId
```

---

### 5. Centralized Constants (`constants.js`)

`common/constants.js` is loaded globally as `C`. All magic strings and numbers are eliminated:

```gherkin
# Domain enums — use in param, request body, assertions
And param status = C.petStatus.AVAILABLE    # → 'available'
And param status = C.orderStatus.PLACED     # → 'placed'

# HTTP status codes — use in assert, NOT in 'Then status'
# ⚠️  Karate's 'Then status' step only accepts INTEGER LITERALS
# WRONG:  Then status C.http.OK
# CORRECT: Then status 200
* assert responseStatus == C.http.OK        # Use in JS assert expressions
* assert responseStatus == C.http.NOT_FOUND

# SLA thresholds (ms)
* assert responseTime < C.sla.FAST         # < 500ms
* assert responseTime < C.sla.NORMAL       # < 3000ms
* assert responseTime < C.sla.SLOW         # < 5000ms

# Performance benchmarking thresholds
* assert mean < C.perf.MEAN_THRESHOLD      # < 3000ms mean
* assert p95  < C.perf.P95_THRESHOLD       # < 5000ms p95
* assert p99  < C.perf.P99_THRESHOLD       # < 8000ms p99

# API paths
Given path C.paths.PET_FIND_STATUS         # → 'pet/findByStatus'
Given path C.paths.STORE_INVENTORY         # → 'store/inventory'

# Mock server coordinates
* def mockUrl = C.mock.baseUrl             # → 'http://localhost:9876/v2'
```

---

### 6. Data-Driven Testing

`Scenario Outline` + CSV from the `data/` folder enables zero-duplication parameterized testing. Each CSV row produces an independent scenario execution:

```gherkin
@data-driven
Scenario Outline: Data-Driven Pet Creation - <name> [<status>]
  Given path 'pet'
  And request
    """
    {
      "id":     <id>,
      "name":   "<name>",
      "status": "<status>"
    }
    """
  When method post
  Then status 200
  And match response        == schema
  And match response.name   == '<name>'
  And match response.status == '<status>'

  Examples:
    | read('classpath:petstore/data/pets.csv') |
```

**`data/pets.csv` format:**
```csv
id,name,status
1001001,Fluffy,available
1001002,Rex,pending
1001003,Whiskers,sold
```

**`data/negative-cases.json`** — Pre-defined IDs for non-existent resources used in 404 verification scenarios:

```json
{
  "pet":   [
    { "id": 999999901, "desc": "Non-existent pet — large ID never created" }
  ],
  "order": [
    { "id": 999999801, "desc": "Non-existent store order" }
  ],
  "user":  [
    { "username": "ghost-user-xyz-karate-404", "desc": "Non-existent username" }
  ]
}
```

---

### 7. Stateful API Mocking

`petstore/mocks/pet-mock.feature` implements a fully **stateful in-memory Petstore** using Karate's Netty mock server. Unlike static stub servers, this mock maintains an in-memory database (`db = {}`) across requests, enabling real CRUD flows without any network dependency.

**Mock routing is top-to-bottom, first match wins:**
```gherkin
Background:
  * def db  = {}            # Shared in-memory store — persists across ALL requests
  * def seq = { next: 9000000 }  # Auto-increment ID counter

Scenario: pathMatches('/v2/pet') && methodIs('post')
  * def newId = request.id > 0 ? request.id : seq.next++
  * eval db['' + newId] = newPet
  * def responseStatus = 200

Scenario: pathMatches('/v2/pet/{id}') && methodIs('get')
  * def found = db['' + pathParams.id]
  * def responseStatus = found ? 200 : 404

Scenario: pathMatches('/v2/pet') && methodIs('put')
  * eval if (existing) db[id] = request
  * def responseStatus = existing ? 200 : 404

Scenario: pathMatches('/v2/pet/{id}') && methodIs('delete')
  * eval if (existed) delete db[id]
  * def responseStatus = existed ? 200 : 404

# Catch-all — any unmatched route returns 404
Scenario:
  * def responseStatus = 404
```

---

### 8. Statistical Performance Benchmarking

`perf-benchmark.feature` implements a full statistical SLA gate using only Karate and `helpers.js`. No external tools (Gatling, JMeter) required for this built-in benchmarking approach.

**Workflow:**
1. Build an array of `N` inputs (driven by `C.perf.ITERATIONS`)
2. Batch-call `probe.feature@probe` once per array element
3. Collect all `responseTime` values
4. Compute mean / p50 / p95 / p99 / stddev using `helpers.js`
5. Assert each metric against SLA thresholds from `constants.js`
6. Embed a dynamic HTML results table into the Masterthought report via `karate.embed()`
7. Write machine-readable JSON to `target/perf-results.json` via `karate.write()`
8. Verify zero resource leaks via `TestDataManager.totalRegistered()`

```gherkin
@regression @perf-stats
Scenario: Statistical Benchmark — mean / p50 / p95 / p99

  * def N     = C.perf.ITERATIONS          # 10 probe requests
  * def inputs = (function(){ var a=[]; for(var i=0;i<N;i++) a.push({i:i}); return a; })()
  * def runs  = call read('probe.feature@probe') inputs
  * def times = karate.map(runs, function(r){ return r.elapsed })

  * def mean = helpers.mean(times)
  * def p95  = helpers.percentile(times, 95)
  * def p99  = helpers.percentile(times, 99)

  * assert mean < C.perf.MEAN_THRESHOLD    # 3000ms
  * assert p95  < C.perf.P95_THRESHOLD     # 5000ms
  * assert p99  < C.perf.P99_THRESHOLD     # 8000ms

  # Embed live HTML table into the Masterthought report
  * karate.embed(fullHtml, 'text/html')

  # Write machine-readable results
  # ⚠️  karate.toJson() takes ONE argument in Karate 1.4 — the 'true' pretty-print
  # second arg causes XML output instead of JSON
  * karate.write(karate.toJson(perfResults), 'perf-results.json')
```

---

### 9. Lifecycle Hooks

`common/hooks.feature` provides two tagged callable scenarios for cross-cutting concerns:

```gherkin
@setup
Scenario: Feature-Level Setup — log start time and resolve runtime context
  * def startedAt  = new Date().toISOString()
  * def runId      = '' + java.util.UUID.randomUUID()
  * karate.log('[hooks@setup] Active env:', env, '| Base URL:', baseUrl)

@teardown
Scenario: Feature-Level Teardown — log completion and duration
  * def finishedAt = new Date().toISOString()
  * karate.log('[hooks@teardown] Feature finish:', finishedAt)
```

**Usage in a feature's `Background`:**
```gherkin
Background:
  * def setup = callonce read('classpath:common/hooks.feature@setup')
  * print '[feature] started at', setup.startedAt, '| Run ID:', setup.runId
```

`callonce` caches the result — the setup block runs **once per feature file**, not once per scenario, regardless of how many threads are executing it.

---

### 10. Thread-Safe Test Data Management

`TestDataManager.java` is a thread-safe resource registry that ensures no "orphaned" test data is left behind when parallel scenarios fail mid-way. Resources are stored in a **LIFO `Deque`** per thread, so teardown happens in the reverse order of creation (safest for parent-child dependencies like deleting an order before its pet).

**Usage from a Karate feature:**
```gherkin
* def TDM = Java.type('petstore.runners.TestDataManager')

# Register resources at creation time
* def petId = created.createdPetId
* TDM.register('pet', petId)

# After test — iterate LIFO list and clean up
* def resources = TDM.getResources()
* karate.forEach(resources, function(r){ karate.log('[cleanup]', r.type, r.id) })
* TDM.clear()

# Diagnostic: detect resource leaks across all threads
* def leakCount = TDM.totalRegistered()
* assert leakCount == 0
```

---

### 11. Advanced Search & Keyword Showcase

`pet-search.feature` and `store.feature` are dedicated keyword showcases. Each scenario demonstrates a specific Karate capability:

| Keyword / API | Demonstrated in | What it does |
|---|---|---|
| `callonce` | `pet-search.feature` Background | Runs setup **once per feature**, cached across all scenarios |
| `match responseType` | `findByStatus` smoke | Asserts parsed media type: `'json'` \| `'xml'` \| `'string'` |
| `match header` | `findByStatus` smoke | Asserts a single named response header value |
| `responseHeaders[key][0]` | `findByStatus` smoke | Access raw header map (keys are lowercase) |
| `karate.sort()` | `findByStatus` regression | Sort array by comparator function |
| `karate.distinct()` | multi-status | Deduplicate array values |
| `copy` | deep-clone | Deep-clone an object (unlike `def` which is a reference) |
| `set` (deep path) | deep-clone | Mutate a nested field: `set cloned.tags[0].name = 'beta'` |
| `remove` | deep-clone | Delete a key: `remove cloned.status` |
| `replace` | batch create | String template substitution: `replace users/<sfx> = suffix` |
| `text` | perf-benchmark | Assign raw multi-line text **without XML parsing** |
| `Java.type()` | pet-search | Call a static Java class from Gherkin |
| `karate.abort()` | store functional | Conditionally skip remaining steps |
| `karate.jsonPath()` | store functional | JSONPath queries over response arrays |
| `karate.embed()` | perf-benchmark | Attach custom HTML/image to the Masterthought report |
| `retry until` | store, user | Poll + retry a step until a condition is met |
| `table` keyword | store batch | Inline data table (values are JS-evaluated, quote strings) |
| `match each` | contract, search | Assert every element in an array satisfies a matcher |
| `match contains deep` | store | Deep partial object match |
| `match !contains` | store, contract | Assert a key/value is **absent** |
| `match contains` | store inventory | Partial object match — extra fields in actual are allowed |
| `karate.keysOf` / `karate.sizeOf` | store inventory | Introspect map keys and count entries at runtime |
| `karate.map` | store functional | Transform array by applying a function to each element |
| `karate.filter` | store functional | Keep only elements that satisfy a predicate |
| `karate.forEach` | store functional | Side-effect iteration over array elements |
| `karate.set` / `karate.get` | store order | Cross-step variable mutation and retrieval |
| `karate.match()` | contract negative | Programmatic schema match returning `{pass, message}` without throwing |
| `karate.write()` | contract, perf | Write machine-readable JSON/artifact to `target/` |
| `karate.fromString()` | user batch | Parse a JSON string back to an object after `replace` |
| `configure retry` (scenario) | user | Override global retry config for a single scenario |
| `responseTime` | store, perf | Access the last HTTP call's elapsed time in ms |
| `print` | multiple | Structured console output via SLF4J logger |

**Key `table` keyword rule:**
```gherkin
# ✅ Correct — string values must be single-quoted inside table cells
* table petRows
  | id    | name        | status      |
  | 30001 | 'TablePet1' | 'available' |

# ❌ Wrong — bare identifiers are evaluated as JavaScript variables
* table petRows
  | id    | name      | status    |
  | 30001 | TablePet1 | available |   # ReferenceError: TablePet1 is not defined
```

**`copy` vs `def` for cloning:**
```gherkin
* def original = { name: 'Buddy', tags: [{ name: 'alpha' }] }

* def ref    = original          # shallow reference — mutations affect original
* copy clone = original          # deep clone — mutations are isolated

* set clone.tags[0].name = 'beta'
And match original.tags[0].name == 'alpha'  # unchanged
And match clone.tags[0].name   == 'beta'    # independent
```

---

## Gotchas & Lessons Learned

Real issues encountered and fixed during development of this framework:

### 1. `Then status` only accepts integer literals
Karate's `Then status` step is parsed at the Gherkin level and **cannot evaluate expressions**.
```gherkin
# ❌ Fails — Karate tries to look up 'C.http.OK' as a step keyword
Then status C.http.OK

# ✅ Correct — use the integer literal
Then status 200

# ✅ Also fine — use constants in JS assert context
* assert responseStatus == C.http.OK
```

### 2. `##string` vs `#string` — optional vs required fields
The demo Petstore contains pets with missing `name` fields entirely. Use the `##` prefix to mark fields as optional:
```gherkin
# ❌ Fails when name is null OR absent
And match each response contains { id: '#number', name: '#string' }

# ✅ Allows null values
And match each response contains { id: '#number', name: '##string' }

# ✅ Best for totally absent keys — filter first
* def wellFormed = karate.filter(response, function(p){ return p.name != null })
And match each wellFormed contains { id: '#number', name: '#string' }
```

### 3. `replace` keyword leaves the variable as a String
After `replace`, the variable is a raw String. If you pass a String to `And request`, Karate sends `text/plain` (HTTP 415).
```gherkin
* def users = """ [ { "username": "<sfx>" } ] """
* replace users/<sfx> = suffix
# users is now a String — must parse back to JSON
* def users = karate.fromString(users)
And request users   # ✅ now sends application/json
```

### 4. `configure headers` function overrides per-step `header` declarations
The global `headers` function runs on every request and takes precedence. Setting `Content-Type: application/json` globally prevents `form field` steps from sending `application/x-www-form-urlencoded`.
```javascript
// ❌ Breaks form-field requests (HTTP 415)
karate.configure('headers', function() {
  return { 'Content-Type': 'application/json', ... };
});

// ✅ Let Karate auto-detect per request
karate.configure('headers', function() {
  return { 'Accept': 'application/json', ... };
});
```

### 5. `* def html = """ <html>... """` triggers XML parsing
Karate parses triple-quoted strings starting with `<` as XML, causing `SAXParseException`.
```gherkin
# ❌ Karate tries to parse as XML
* def html =
  """
  <table>...</table>
  """

# ✅ Use the 'text' keyword for raw string assignment
* text html =
  """
  <table>...</table>
  """
```

### 6. `karate.toJson()` takes one argument in Karate 1.4
```gherkin
# ❌ The 'true' pretty-print arg causes XML serialization in Karate 1.4
* karate.write(karate.toJson(obj, true), 'result.json')

# ✅ One argument only
* karate.write(karate.toJson(obj), 'result.json')
```

### 7. Inline JS expressions in JSON templates
Using `#(call uniqueId)` inside a triple-quoted JSON string is unreliable for complex expressions. Pre-compute values before the template:
```gherkin
# ❌ Unreliable — complex expression inside embedded expression
* def body = """ { "id": #(call uniqueId) } """

# ✅ Pre-compute, then reference
* def newId = call uniqueId
* def body  = """ { "id": #(newId) } """
```

### 8. `karate.call(function(){})` is not valid in Karate 1.4
`karate.call()` only accepts a String classpath path. To execute an inline JS function, use an IIFE:
```gherkin
# ❌ TypeError: no applicable overload for call(function)
* def x = karate.call(function(){ return 42; })

# ✅ IIFE — invoked immediately
* def x = (function(){ return 42; })()

# ✅ Also valid for try/catch guards
* def featurePath = (function(){
    try { return karate.info.feature.packageQualifiedName; }
    catch(e) { return ''; }
  })()
```

### 9. `callSingle` and parallel thread scope
Variables captured via closure in `karate-config.js` are **not shared across parallel threads**. Explicitly expose them on the `config` object:
```javascript
// ❌ _apiKey closure is not accessible in child threads from batch `call`
var _apiKey = settings.apiKey;

// ✅ Expose on config so sub-features can read it
config.apiKey = settings.apiKey;
```

### 10. Demo API reliability
The public `petstore.swagger.io` demo server is **not reliable** for automated testing:
- `POST /user` intermittently returns HTTP 500
- `/pet/findByStatus` returns thousands of pets with `null` or missing `name` fields
- IDs are not guaranteed to be unique after round-trips

Use `configure retry` and defensive assertions:
```gherkin
* configure retry = { count: 5, interval: 2000 }
And retry until responseStatus == 200
When method post

# Accept null/missing names from the noisy live dataset
And match each response contains { id: '#number', name: '##string' }
```

---

## Reporting

Two report types are automatically generated after every run:

### 1. Karate Native HTML Report
- **Path:** `target/karate-reports/karate-summary.html`
- **Best for:** Debug deep-dives. Provides timeline view, HTTP request/response bodies, step-by-step traces, and embedded media (`karate.embed()` output).

### 2. Masterthought Cucumber HTML Report
- **Path:** `target/cucumber-html-reports/overview-features.html`
- **Best for:** Management dashboards. Rich pass/fail metrics, feature-level breakdowns, tag-based statistics, and build metadata (environment, Java version, OS, framework).

### 3. Machine-Readable Outputs
| File | Generated by | Contents |
|---|---|---|
| `target/perf-results.json` | `perf-benchmark.feature` | Mean, p50, p95, p99, stddev, SLA pass/fail |
| `target/contract-report.json` | `contract-tests.feature` | Contract violation log per endpoint |
| `target/karate-reports/*.json` | Karate (auto) | Raw Cucumber JSON used by Masterthought |
| `target/test-summary.json` | `reporter.js` via `afterScenario` hook | Scenario-level pass/fail summary with duration stats |

---

## Logging Configuration

[`logback-test.xml`](src/test/java/logback-test.xml) configures dual-output logging with DEBUG-level detail from the Karate DSL core:

| Feature | Configuration |
|---|---|
| **Console appender** | Pattern: `HH:mm:ss.SSS [thread] LEVEL logger - msg` |
| **Rolling file appender** | Writes to `target/test-logs/karate-test.log` with 7-day retention |
| **Karate core logger** | `com.intuit.karate` at `DEBUG` — full HTTP request/response pairs |
| **HTTP wire logger** | `com.intuit.karate.http` at `INFO` — reduces wire-level noise in console |
| **Root level** | `INFO` — both console and file |

---

## `.gitignore`

```gitignore
target/          # Maven build output and test reports
.vscode/         # VS Code workspace settings
*.class          # Compiled Java classes
*.iml            # IntelliJ module files
.idea/           # IntelliJ project settings
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: API Tests

on: [push, pull_request]

jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Run Smoke Tests
        run: mvn test -Psmoke -Dkarate.env=qa
      - name: Upload Reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: karate-reports
          path: |
            target/karate-reports/
            target/cucumber-html-reports/
```

### Nightly Regression
```yaml
  regression:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - run: mvn test -Pregression -Dkarate.env=staging
```

# Business Overview: Karate Petstore Automation

This document outlines the business logic, high-level objectives, and verification strategies of the Karate API Testing Framework implemented for the Swagger Petstore.

## 1. High-Level Purpose
The primary goal of this project is to provide a **production-grade quality gate** for the Petstore API ecosystem. It ensures that the core business workflows—managing inventory (pets), processing customer orders (store), and handling user accounts—are functional, performant, and compliant with defined contracts.

## 2. Business Meaning & Value
In a real-world scenario, the Petstore API serves as the backbone for:
- **Inventory Management:** Ensuring pet data is accurate and searchable.
- **Revenue Stream:** Guaranteeing that the ordering system is reliable and handles transactions correctly.
- **User Trust:** Protecting user data and providing a seamless registration/login experience.

By automating these checks, the business reduces the risk of regression, speeds up the release cycle (CI/CD), and ensures a consistent customer experience.

## 3. What We Verify

### A. Functional Integrity (End-to-End CRUD)
We verify the complete lifecycle of core entities:
- **Pets:** Creating a new pet, updating its status (Available -> Pending -> Sold), searching by status, and final removal.
- **Store:** Processing orders, tracking inventory counts, and ensuring orders can be retrieved or cancelled.
- **User:** Onboarding new users, updating profiles, and managing sessions.

### B. API Contract & Schema Compliance
We enforce **Consumer-Driven Contract Testing**. This ensures that:
- The API response structure matches the documentation.
- Data types are correct (e.g., IDs are numbers, dates are strings).
- No breaking changes (missing fields) are introduced in new versions.

### C. Performance & Reliability (SLA Gates)
We don't just check if it works; we check if it works **fast enough**:
- **Statistical Benchmarking:** Measuring Mean, P95, and P99 response times.
- **SLA Enforcement:** Failing builds if the API exceeds defined thresholds (e.g., > 3000ms).
- **Resilience:** Using retry logic to handle transient network blips.

### D. Service Virtualization (Mocking)
We provide a **Stateful Mock Server** that mimics the real API. This allows:
- **Parallel Development:** Frontend teams can build against the mock before the backend is ready.
- **Deterministic Testing:** Testing edge cases (like 500 errors or specific data states) that are hard to trigger in live environments.

## 4. Current API Documentation Tested

The framework actively tests the **Swagger Petstore V2 API**. Below is the detailed API documentation matrix representing exactly which methods, endpoints, payloads, and HTTP status codes are verified by this automation suite.

### 🐶 Pet Domain (`/v2/pet`)
*Inventory management, tracking pet status, and core CRUD operations.*

| HTTP Method | Endpoint | Description | Validated Status Codes |
| :--- | :--- | :--- | :--- |
| **POST** | `/pet` | Add a new pet to the store. Requires full JSON payload. | `200 OK`, `400 Bad Request`, `405 Invalid Input` |
| **GET** | `/pet/{petId}` | Retrieve a pet by its unique ID. | `200 OK`, `404 Not Found` |
| **PUT** | `/pet` | Update an existing pet's information (e.g., changing status from 'available' to 'sold'). | `200 OK`, `400 Bad Request`, `404 Not Found` |
| **DELETE** | `/pet/{petId}` | Remove a pet from the store. | `200 OK`, `404 Not Found` |
| **GET** | `/pet/findByStatus` | Search for pets by status. Uses query parameters (e.g., `?status=available`). | `200 OK` (Validates Array & Schema) |

### 🏬 Store Domain (`/v2/store`)
*E-commerce processing, order placement, and inventory tracking.*

| HTTP Method | Endpoint | Description | Validated Status Codes |
| :--- | :--- | :--- | :--- |
| **POST** | `/store/order` | Place an order for a pet. Requires Order JSON payload. | `200 OK`, `400 Invalid Order` |
| **GET** | `/store/order/{orderId}` | Find a purchase order by its ID. | `200 OK`, `404 Order Not Found` |
| **DELETE** | `/store/order/{orderId}` | Cancel and delete an existing order. | `200 OK`, `404 Order Not Found` |
| **GET** | `/store/inventory` | Returns a map of status codes to quantities (e.g., `{"available": 300}`). | `200 OK` (Validates Map/Object Schema) |

### 👤 User Domain (`/v2/user`)
*Account management, authentication sessions, and bulk user operations.*

| HTTP Method | Endpoint | Description | Validated Status Codes |
| :--- | :--- | :--- | :--- |
| **POST** | `/user/createWithArray` | Bulk onboarding. Accepts a JSON Array of User objects. | `200 OK` |
| **GET** | `/user/{username}` | Fetch user profile details by username. | `200 OK`, `404 User Not Found` |
| **PUT** | `/user/{username}` | Update an existing user's profile details. | `200 OK`, `400 Invalid User Supplied`, `404 User Not Found` |
| **GET** | `/user/login` | Authenticate user. Uses query parameters `?username=X&password=Y`. | `200 OK` (Validates Session Headers/Cookies), `400 Invalid Login` |
| **GET** | `/user/logout` | Terminate the current logged-in session. | `200 OK` |

## 5. Summary of Verification Strategy
| Type | Strategy | Tooling |
|---|---|---|
| **Smoke** | Critical path checks on every PR. | `@smoke` tags |
| **Regression** | Full coverage of all endpoints. | `@regression` tags |
| **Contract** | Schema validation against JSON definitions. | `karate.match` + JSON Schema |
| **Perf** | Statistical analysis of response times. | `helpers.js` + `karate.embed` |

---

## 6. Project Skeleton & File Guide

Below is the visual directory structure (skeleton) of the Karate Petstore framework, followed by a detailed, file-by-file breakdown of their responsibilities.

### 📂 Directory Skeleton

```text
Karate/
├── pom.xml
├── README.md
├── Learning/
│   ├── README.md
│   └── business_overview.md
└── src/
    └── test/
        └── java/
            ├── karate-config.js
            ├── logback-test.xml
            ├── common/
            │   ├── constants.js
            │   ├── helpers.js
            │   ├── hooks.feature
            │   ├── reporter.js
            │   └── schema-utils.js
            └── petstore/
                ├── data/
                │   ├── negative-cases.json
                │   └── pets.csv
                ├── features/
                │   ├── contract/
                │   │   └── contract-tests.feature
                │   ├── performance/
                │   │   └── perf-benchmark.feature
                │   ├── pet/
                │   │   ├── pet-crud.feature
                │   │   └── pet-search.feature
                │   ├── store/
                │   │   └── store.feature
                │   └── user/
                │       └── user.feature
                ├── helpers/
                │   └── utils.feature
                ├── mocks/
                │   └── pet-mock.feature
                ├── runners/
                │   ├── MasterRunner.java
                │   ├── MockRunner.java
                │   ├── RegressionRunner.java
                │   ├── SmokeRunner.java
                │   ├── TestDataManager.java
                │   └── TestUtils.java
                └── schemas/
                    ├── order-schema.json
                    ├── pet-schema.json
                    ├── pet-schema-strict.json
                    └── user-schema.json
```

### 📄 Extreme Detail File Guide

#### 1. Root Level & Core Configuration
*   **`pom.xml`**: The Maven Project Object Model. This file controls the entire build lifecycle. It specifies the Java version (17), downloads the Karate DSL core engine (`karate-junit5`), and the Masterthought reporting library. Crucially, it defines Maven `<profiles>`. When you run `mvn test -Psmoke`, Maven reads this file to route execution specifically to the `SmokeRunner.java` class, ignoring everything else. It also configures the `maven-surefire-plugin` to disable its default parallel execution (`<forkCount>1</forkCount>`) because Karate handles multi-threading internally.
*   **`README.md`**: The technical manifesto of the project. It contains installation instructions, architecture diagrams, tagging strategies, gotchas (like why `Then status C.http.OK` fails), and commands for CI/CD pipelines.
*   **`karate-config.js`**: The most important script in Karate. It runs exactly once per thread *before* any feature file starts. 
    *   **Environment Resolution**: It reads `karate.env` (default 'dev') and maps it to a `baseUrl`.
    *   **Global Headers**: It uses `karate.configure('headers', ...)` to inject an `Accept` header and auto-generate a unique `X-Request-Id` (using Java UUID) for every single HTTP request.
    *   **Timeouts & Retries**: Configures connection and read timeouts globally, and defines the default retry strategy for flaky endpoints.
    *   **Reporting Hook**: Uses `karate.configure('afterScenario', ...)` to trigger `reporter.record()` every time a scenario finishes.
*   **`logback-test.xml`**: The logging engine configuration (SLF4J). It defines two appenders: one for the console and one for a rolling log file in `target/test-logs/`. It filters out noise by setting `com.intuit.karate.http` to INFO (hiding wire traffic from console) while keeping `com.intuit.karate` at DEBUG to record request/response bodies in the HTML reports.

#### 2. Shared Utilities (`/common`)
*   **`constants.js`**: A JavaScript file that prevents hardcoding. It returns a JSON object exposing `C.http.OK`, `C.petStatus.AVAILABLE`, and `C.perf.MEAN_THRESHOLD`. By using `* assert responseTime < C.sla.FAST`, the test logic is decoupled from the actual SLA millisecond value.
*   **`helpers.js`**: Contains two types of logic:
    *   *Data Generators*: Functions like `randomString(8)` or `isoNow()` used to create dynamic request payloads.
    *   *Statistical Functions*: Functions like `mean()`, `stddev()`, and `percentile()` written in pure JS to calculate performance metrics from an array of response times during load testing.
*   **`hooks.feature`**: Contains two tagged scenarios: `@setup` and `@teardown`. Features use `callonce` to invoke `@setup`, which generates a Run ID and logs the environment. This ensures setup logic happens only once per feature file, caching the result across all scenarios within that file.
*   **`reporter.js`**: A custom analytics engine. It maintains a global JSON state (`total`, `passed`, `failed`). The `karate-config.js` calls it after each scenario. At the end of the run, a Java runner calls `reporter.flush()` to write this aggregated data to `target/test-summary.json`.
*   **`schema-utils.js`**: Pure functional JavaScript for JSON Schema manipulation. Because APIs evolve, schemas must be flexible. This file provides functions like `pick()` (keep only specific fields), `merge()` (combine two schemas), and `makeOptional()` (convert `#string` to `##string`) so contract tests don't have to duplicate massive JSON files for every endpoint variation.

#### 3. Feature Domain Layer (`/petstore/features`)
The actual test cases, organized by the API's business domains. Below is an extreme deep dive into the mechanics of each feature file:

*   **`contract/contract-tests.feature`**:
    *   **Purpose**: Consumer-Driven Contract Testing. It completely ignores business logic (it doesn't care if a pet's name is "Fido"). It only verifies data structure and types.
    *   **Target APIs & Business Logic**: Targets `GET /v2/pet/{id}` and `GET /v2/store/order/{id}`. The business logic here is strict schema enforcement—ensuring the API doesn't break frontend applications by unexpectedly changing data types.
    *   **Mechanics**: It loads strict JSON Schema definitions (e.g., `pet-schema-strict.json`). When it calls an endpoint (like `GET /pet/{id}`), it uses `karate.match(response, schema)`. 
    *   **Value**: If the backend developers accidentally change a field type (e.g., returning `"id": "123"` as a String instead of an Integer) or add an undocumented field, this test instantly fails, preventing frontend UI crashes.

*   **`performance/perf-benchmark.feature`**:
    *   **Purpose**: Acts as an automated Service Level Agreement (SLA) enforcer.
    *   **Target APIs & Business Logic**: Targets high-traffic endpoints like `GET /v2/pet/findByStatus`. The business logic is ensuring the system can handle concurrent requests without degrading user experience (e.g., keeping search results fast).
    *   **Mechanics**: Instead of a single API call, it generates an array of inputs and uses Karate's `call` keyword to loop over a helper endpoint `N` times (e.g., 50 iterations). It extracts the `responseTime` of every single call into a massive array. It then passes this array to custom JavaScript math functions (`helpers.percentile()`) to calculate the P95 and P99 response times.
    *   **Value**: It fails the pipeline build if the 95th percentile response time breaches the maximum threshold defined in `constants.js` (e.g., > 3000ms), ensuring performance regressions never reach production.

*   **`pet/pet-crud.feature`**:
    *   **Purpose**: The Golden Path. It validates the full lifecycle of a Pet entity in a single, unified test scenario.
    *   **Target APIs & Business Logic**: Calls `POST /v2/pet`, `GET /v2/pet/{id}`, `PUT /v2/pet`, and `DELETE /v2/pet/{id}`. This tests the core business flow of a pet store employee adding a new animal to the system, verifying it exists, marking it as "sold" after a customer buys it, and removing it.
    *   **Mechanics**: 
        1. **Create**: Calls a helper to POST a new pet and extracts the auto-generated `id`.
        2. **Read**: Performs a GET using that `id` to ensure the database actually saved it.
        3. **Update**: Mutates the payload in-memory (e.g., changing status from `available` to `sold`) and sends a PUT request.
        4. **Delete**: Passes the `id` to the `TestDataManager` to guarantee a DELETE request is fired during the teardown phase.
    *   **Value**: Proves that the core database operations (Create, Read, Update, Delete) are functioning synchronously.

*   **`pet/pet-search.feature`**:
    *   **Purpose**: Validates complex query parameters and array manipulation.
    *   **Target APIs & Business Logic**: Calls `GET /v2/pet/findByStatus`. Simulates a customer on the frontend filtering the catalog to only see pets that are currently "available" for purchase.
    *   **Mechanics**: Calls `GET /pet/findByStatus?status=available`. Instead of checking a single object, it receives a JSON Array. It uses Karate's `match each` syntax to loop through hundreds of returned pets in a single line of code, verifying that absolutely every pet in the array genuinely has the `"available"` status. It also demonstrates how to use `karate.sort()` to organize arrays in-memory.
    *   **Value**: Proves that the database filtering and searching algorithms are not returning false positives.

*   **`store/store.feature`**:
    *   **Purpose**: Tests the e-commerce transaction engine.
    *   **Target APIs & Business Logic**: Calls `POST /v2/store/order` and `GET /v2/store/inventory`. Verifies the business rule that placing an order for a pet correctly updates the store's backend inventory levels.
    *   **Mechanics**: Places an order using `POST /store/order`. It then introduces Karate's powerful `retry until` feature. Because inventory updates might be asynchronous, it polls the `GET /store/inventory` endpoint up to 5 times, waiting for the inventory count of "sold" pets to increment by exactly 1. 
    *   **Value**: Verifies that placing an order correctly triggers downstream inventory adjustments, handling eventual consistency gracefully.

*   **`user/user.feature`**:
    *   **Purpose**: Verifies authentication protocols and bulk data handling.
    *   **Target APIs & Business Logic**: Calls `POST /v2/user/createWithArray`, `GET /v2/user/login`, and `GET /v2/user/logout`. Validates the business requirement that corporate partners can bulk-upload user accounts, and that those users can successfully log in and establish a secure session.
    *   **Mechanics**: Demonstrates how to pass a massive JSON Array of user objects to `POST /user/createWithArray`. It then tests `GET /user/login` by passing credentials in query parameters. Instead of just checking the JSON body, it specifically inspects the raw HTTP Headers (using `match header`) to ensure a valid session token/cookie is returned by the server.
    *   **Value**: Secures the user onboarding and login flows, ensuring security headers are present.

#### 4. Test Data & Schemas (`/data` & `/schemas`)
*   **`data/pets.csv`**: A spreadsheet of inputs. A `Scenario Outline` in Karate reads this file row-by-row. If the file has 10 rows, Karate dynamically spawns 10 independent tests, substituting `<name>` and `<status>` directly into the JSON request body.
*   **`data/negative-cases.json`**: A dictionary of bad data (e.g., pet ID `999999999`). Centralizing negative data here means we don't hardcode magic "bad IDs" in our `.feature` files.
*   **`schemas/pet-schema-strict.json`**: A Karate Matcher document (e.g., `{ "id": "#number", "name": "#string" }`). "Strict" implies that if the API adds a new, undocumented field, the test will intentionally fail.
*   **`schemas/pet-schema.json`, `order-schema.json`, `user-schema.json`**: Standard fuzzy-match schemas where `##` indicates optional fields and extra undocumented fields are ignored.

#### 5. Reusable Steps & Virtualization (`/helpers` & `/mocks`)
*   **`helpers/utils.feature`**: A function library written in Gherkin. It contains `@createPet`, which does the HTTP POST and returns the newly minted `response.id`. Other feature files `call` this to generate prerequisite data, keeping the main test files clean and focused on their specific assertions.
*   **`mocks/pet-mock.feature`**: A fake backend powered by Netty. It intercepts HTTP requests to `/v2/pet`. It maintains a persistent JavaScript object (`db = {}`). If it receives a POST, it saves the payload into `db`. If it receives a GET, it returns the data from `db`. It behaves exactly like the real database, allowing the entire suite to run offline.

#### 6. Test Orchestration (`/runners`)
*   **`MasterRunner.java`**: The apex predator of the framework. It calls `Karate.run().tags("~@ignore").parallel(5)`. This tells Karate to grab all feature files, split them across 5 CPU threads, and execute them simultaneously.
*   **`SmokeRunner.java`**: A scoped runner. It calls `Karate.run().tags("@smoke")`. Used by the CI/CD pipeline to run a fast, 2-minute sanity check on Pull Requests before merging.
*   **`RegressionRunner.java`**: Calls `Karate.run().tags("@regression")`. Runs the entire exhaustive suite, typically scheduled nightly.
*   **`MockRunner.java`**: Bootstraps the mock server. It starts `pet-mock.feature` on port 8080, overrides the system property `karate.env` to point to `localhost:8080`, runs the tests, and gracefully shuts down the server.
*   **`TestDataManager.java`**: A Java `ThreadLocal` registry. Because tests run in parallel, Thread 1 cannot clean up Thread 2's data. When a feature creates a pet, it calls `TestDataManager.register('pet', id)`. At the end of the test, the teardown hook retrieves this list and deletes the exact IDs created by that specific thread, preventing database bloat.
*   **`TestUtils.java`**: The report generator. After Karate finishes executing and drops raw JSON files into the `target/` directory, this Java class feeds those JSON files into the `net.masterthought` library, which compiles them into the beautiful, interactive HTML dashboard found in `target/cucumber-html-reports`.

---

## 7. CI/CD Pipeline Strategy

To maximize the business value of this automation, the test suite is designed to be tightly integrated into the Continuous Integration / Continuous Deployment (CI/CD) pipelines (e.g., GitHub Actions, Jenkins, GitLab CI).

*   **Pull Request Quality Gate (`@smoke`)**: Every time a developer opens a Pull Request, the CI pipeline triggers `mvn test -Psmoke`. This runs a subset of critical tests (under 2 minutes) to ensure core business functions aren't broken before the code is merged.
*   **Nightly Regression (`@regression`)**: Every night, a cron job triggers `mvn test -Pregression`. This runs the exhaustive test suite against the staging environment, performing deep schema validation and edge-case testing.
*   **Performance Budgeting (`@performance`)**: Before a release is deployed to production, the pipeline runs `mvn test -Pperformance`. If the API response times breach the SLAs defined in `constants.js` (e.g., P95 > 3000ms), the pipeline immediately fails, preventing a degraded user experience from reaching production.

## 8. Test Data Management (TDM) Strategy

One of the biggest challenges in API testing is **Data Pollution**—tests creating thousands of users or pets and leaving them in the database, eventually causing slow queries and brittle tests.

We solve this using a multi-tiered TDM strategy:
1.  **Dynamic Generation**: Tests never use hardcoded IDs. We use `helpers.randomString()` and `helpers.randomInt()` to ensure every test run uses fresh, unique data, preventing collisions.
2.  **Stateful Mocking**: For volatile edge-case testing, we use the local `pet-mock.feature` which runs completely in-memory. When the mock server shuts down, the data vanishes.
3.  **Thread-Safe Cleanup (`TestDataManager.java`)**: The golden rule is "Clean up what you create." Whenever a test creates an entity, it registers the ID in a Java `ThreadLocal` registry. Regardless of whether the test passes or fails, an `@afterScenario` hook guarantees that a `DELETE` request is sent to remove that exact entity from the database.

## 9. Future Technical Roadmap

While the framework is currently robust, the following enhancements are planned to further elevate its maturity:

*   **Phase 1: Real Load Testing (Gatling)**: Transition from statistical probing to true concurrency by integrating `karate-gatling`. This will allow us to reuse our existing Karate `.feature` files to bombard the API with thousands of simultaneous virtual users.
*   **Phase 2: Containerization (Docker)**: Wrap the entire test suite and mock server in a `Dockerfile`. This guarantees that the tests run identically on a developer's local machine, inside GitHub Actions, or on an AWS EC2 instance.
*   **Phase 3: Security & Fuzzing (`@security`)**: Introduce malicious payload testing. We will inject SQL syntax, cross-site scripting (XSS) payloads, and massively oversized JSON documents into the API endpoints to proactively identify vulnerabilities (OWASP Top 10) before security audits.
*   **Phase 4: Realistic Data Faking**: Integrate `JavaFaker` to replace arbitrary random strings with realistic human names, validly formatted addresses, and localized phone numbers to catch edge cases related to character encoding and data formatting.

---

## 10. Roles & Responsibilities (Stakeholder Matrix)

This framework is not just a tool for QA; it serves multiple disciplines across the engineering organization:

| Role | Primary Use Case | Key Interaction Point |
| :--- | :--- | :--- |
| **QA/SDET Engineers** | Authoring tests, maintaining schemas, and expanding coverage. | `.feature` files, `schema-utils.js` |
| **Backend Developers** | Debugging failed builds and ensuring new API endpoints match the documented contract. | Karate Native HTML Reports, `logback-test.xml` traces |
| **Frontend Developers** | Using the mock server to build UI components when the real backend is down or incomplete. | `pet-mock.feature`, `MockRunner.java` |
| **DevOps Engineers** | Integrating the test suite into deployment pipelines and monitoring SLA threshold breaches. | `pom.xml` profiles, GitHub Actions YAML |
| **Product Owners / BAs** | Verifying that business requirements (Acceptance Criteria) are met using the readable Gherkin syntax. | Masterthought Dashboard, Scenario descriptions |

## 11. Reporting & Analytics Strategy

Transparency is critical for business confidence. The framework automatically generates multiple layers of reporting after every execution:

1.  **The Executive Dashboard (Cucumber HTML Report)**:
    *   **Audience**: Management, Product Owners.
    *   **Value**: A high-level, beautiful visualization of Pass/Fail ratios, tag breakdowns (e.g., how many `@smoke` tests passed vs `@regression`), and historical execution trends.
2.  **The Developer Debugger (Karate Native Report)**:
    *   **Audience**: Engineers.
    *   **Value**: Extremely detailed step-by-step execution logs, including the exact HTTP Requests and Responses sent over the wire, allowing devs to pinpoint exactly why a test failed without re-running it.
3.  **Machine-Readable Analytics (`test-summary.json`)**:
    *   **Audience**: Automated systems.
    *   **Value**: Raw JSON data that can be ingested by external dashboards like Datadog, Grafana, or Jira/Xray to track quality over time.

## 12. Quality Key Performance Indicators (KPIs)

To ensure the test suite remains a valuable asset rather than a maintenance burden, we track the following engineering KPIs:

*   **Test Execution Time**: Monitored continuously. By utilizing Karate's internal parallel execution (`MasterRunner.java`), the goal is to keep the `@smoke` suite under 2 minutes and the full `@regression` suite under 10 minutes to prevent developer bottlenecking.
*   **Flakiness Rate**: Monitored via CI/CD. Handled proactively by using dynamic data generation (preventing state collisions) and Karate's `retry until` logic for asynchronous data propagation.
*   **Contract Drift**: The rate at which the API deviates from its Swagger spec. Zero drift is enforced by the strict schema validation in `contract-tests.feature`.

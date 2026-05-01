export function extractFlashcards(readmeText, overviewText) {
    var cards = [];
    var source = 'README.md';

    function add(q, a, cat, src) {
        q = q.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
        a = a.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
        cards.push({ question: q, answer: a, category: cat || 'concept', source: src || source });
    }

    var gotchaSection = readmeText.match(/## Gotchas & Lessons Learned([\s\S]*?)(?=## )/);
    if (gotchaSection) {
        var gotchas = gotchaSection[1].match(/### (\d+)\.\s+(.*?)(?:\n|$)([\s\S]*?)(?=\n### |$)/g);
        if (gotchas) {
            gotchas.forEach(function (g) {
                var numM = g.match(/### (\d+)\.\s+(.*?)(?:\n|$)/);
                var body = g.replace(/### .*?\n/, '').trim();
                if (numM) {
                    var title = numM[2].replace(/\*\*/g, '').trim();
                    var sentences = body.split(/\n/).filter(Boolean);
                    var question = title;
                    var answer = sentences.map(function (s) {
                        return s.replace(/^[❌✅#]\s*/, '').replace(/\*\*/g, '').trim();
                    }).filter(Boolean).join('; ');
                    if (answer.length > 200) answer = answer.substring(0, 200) + '…';
                    add(question, answer, 'gotcha', 'README.md — Gotchas');
                }
            });
        }
    }

    var conceptPairs = [
        ['What is `karate-config.js`?', 'The most important script in Karate. It runs once per thread before any feature file, setting environment, global headers, timeouts, retries, and the after-scenario reporting hook.', 'config', 'README.md — Configuration'],
        ['What does `callonce` do?', 'Runs a setup block once per feature file (not per scenario), caching the result across all scenarios in that file regardless of thread count.', 'concept', 'README.md — Lifecycle Hooks'],
        ['What is the difference between `#string` and `##string`?', '`#string` means the field is required and must be a string. `##string` means the field is optional — null or absent values are allowed.', 'gotcha', 'README.md — Gotchas #2'],
        ['What does `TestDataManager` do?', 'A thread-safe LIFO resource registry that prevents orphaned test data. Each thread tracks created resources and cleans them up in reverse creation order.', 'concept', 'README.md — Thread-Safe Test Data Management'],
        ['What is the difference between `copy` and `def` for cloning?', '`def` creates a shallow reference (mutations affect original). `copy` creates a deep clone (mutations are isolated from the original).', 'concept', 'README.md — Advanced Search & Keyword Showcase'],
        ['Why does `text` keyword exist in Karate?', 'Triple-quoted strings starting with `<` trigger XML parsing, causing SAXParseException. The `text` keyword assigns raw multi-line strings without XML parsing.', 'gotcha', 'README.md — Gotchas #5'],
        ['What is the Masterthought report?', 'A rich HTML dashboard generated from Cucumber JSON files after test execution. Provides feature-level breakdowns, tag-based statistics, and build metadata.', 'concept', 'README.md — Reporting'],
        ['What ports are configured on the Mock Server?', 'The mock server (pet-mock.feature) runs on port 9876 by default via Karate\'s Netty server.', 'config', 'README.md — MockRunner'],
        ['How does the framework handle Demo API unreliability?', 'Uses `configure retry` with count: 5 and interval: 2000ms, plus defensive assertions like `##string` to accept null/missing fields.', 'gotcha', 'README.md — Gotchas #10'],
        ['How many parallel threads does MasterRunner use?', 'MasterRunner uses 5 parallel threads (Runner.parallel(5)). SmokeRunner uses 3 threads.', 'config', 'README.md — Runner Classes']
    ];
    conceptPairs.forEach(function (p) { add(p[0], p[1], p[2], p[3]); });

    var bizSrc = 'business_overview.md';

    var verifySection = overviewText.match(/## 3\. What We Verify([\s\S]*?)(?=## \d)/);
    if (verifySection) {
        var subs = verifySection[1].match(/### ([A-Z])\.\s+(.*?)(?:\n|$)([\s\S]*?)(?=\n### |$)/g);
        if (subs) {
            subs.forEach(function (s) {
                var m = s.match(/### ([A-Z])\.\s+(.*?)(?:\n|$)([\s\S]*?)$/);
                if (m) {
                    var q = 'What does "' + m[2].replace(/\*\*/g, '').trim() + '" verify?';
                    var a = m[3].replace(/\*\*(.*?)\*\*/g, '$1').replace(/\n/g, ' ').trim();
                    if (a.length > 250) a = a.substring(0, 250) + '…';
                    add(q, a, 'concept', bizSrc + ' — §3.' + m[1]);
                }
            });
        }
    }

    var apiTables = overviewText.match(/\| \*\*(POST|GET|PUT|DELETE)\*\* \| .*? \|.*? \|.*? \|/g);
    if (apiTables) {
        apiTables.forEach(function (row) {
            var parts = row.split('|').map(function (p) { return p.trim().replace(/\*\*/g, ''); });
            if (parts.length >= 5) {
                var method = parts[1];
                var ep = parts[2];
                var desc = parts[3];
                var codes = parts[4];
                add('What does `' + method + ' ' + ep + '` do?', desc + '. Validated statuses: ' + codes + '.', 'api', bizSrc);
            }
        });
    }

    var profileRows = readmeText.match(/\| `smoke` \| .*? \|.*? \|/g);
    if (profileRows) {
        profileRows.forEach(function (row) {
            var parts = row.split('|').map(function (p) { return p.trim().replace(/\*\*/g, ''); });
            if (parts.length >= 5) {
                var profile = parts[1].replace(/`/g, '');
                var cmd = parts[2].replace(/`/g, '');
                var runner = parts[3].replace(/`/g, '');
                var threads = parts[4];
                var purpose = parts[5] || '';
                add('Which Maven profile uses `' + runner + '` with ' + threads + ' threads?',
                    'The `' + profile + '` profile. Command: `' + cmd + '`. Purpose: ' + purpose + '.',
                    'config', 'README.md — Maven Profiles');
            }
        });
    }

    var tagRows = readmeText.match(/\| `@\w+` \| .*? \|/g);
    if (tagRows) {
        tagRows.forEach(function (row) {
            var parts = row.split('|').map(function (p) { return p.trim(); });
            if (parts.length >= 3) {
                var tag = parts[1].replace(/`/g, '');
                var meaning = parts[2];
                add('What does the `' + tag + '` tag represent?', meaning, 'api', 'README.md — Tagging Strategy');
            }
        });
    }

    return cards;
}

export function extractQuiz(readmeText, overviewText) {
    var items = [];
    var id = 0;

    function add(q, a, src) {
        q = q.replace(/\*\*(.*?)\*\*/g, '$1');
        a = a.replace(/\*\*(.*?)\*\*/g, '$1');
        items.push({ id: ++id, question: q, answer: a, source: src });
    }

    function parseTables(text, sourceName) {
        var tables = text.match(/(?:\|.*\|\n)+/g);
        if (!tables) return;

        tables.forEach(function (tableStr) {
            var lines = tableStr.trim().split('\n');
            if (lines.length < 3) return;

            var headers = lines[0].split('|').map(function (h) { return h.trim().replace(/\*\*/g, '').replace(/`/g, ''); }).filter(Boolean);
            if (headers.length < 2) return;

            if (!lines[1].includes('---')) return;

            for (var i = 2; i < lines.length; i++) {
                var cells = lines[i].split('|').map(function (c) { return c.trim().replace(/\*\*/g, ''); }).filter(Boolean);
                if (cells.length >= 2 && cells[0] && cells[1] && headers[0] && headers[1]) {
                    if (cells[0].length > 50 || cells[1].length > 200) continue;

                    var q = 'Regarding ' + headers[0] + ' `' + cells[0].replace(/`/g, '') + '`, what is its ' + headers[1] + '?';
                    var a = cells[1];
                    add(q, a, sourceName + ' (Auto-Generated)');
                }
            }
        });
    }

    parseTables(readmeText, 'README.md');
    parseTables(overviewText, 'business_overview.md');

    add('What strategy uses `@smoke` tags?', 'Critical path checks on every PR.', 'business_overview.md — §5');
    add('Which verification type uses `karate.match` + JSON Schema?', 'Contract testing — schema validation against JSON definitions.', 'business_overview.md — §5');
    add('What does the Store domain cover?', 'Order placement, inventory analysis, order deletion (E-commerce processing).', 'business_overview.md — §4');
    add('What SLA metric is enforced for the 95th percentile?', 'P95 must be < 5000ms (C.perf.P95_THRESHOLD).', 'README.md — §5 Constants');
    add('Which command runs only smoke-tagged tests?', '`mvn test -Psmoke`', 'README.md — Maven Profiles');
    add('Which profile uses MockRunner?', 'The `mock` profile: `mvn test -Pmock`', 'README.md — Maven Profiles');
    add('How many threads does SmokeRunner use?', '3 parallel threads.', 'README.md — Runner Classes');
    add('Why does `Then status C.http.OK` fail?', 'Karate\'s `Then status` step only accepts integer literals, not expressions. Use `Then status 200` instead.', 'README.md — Gotchas #1');
    add('What happens when you use `replace` on a JSON variable?', 'The variable becomes a raw String. Use `karate.fromString()` to parse it back to JSON before passing to `And request`.', 'README.md — Gotchas #3');
    add('How do you safely assign HTML content in Karate?', 'Use the `text` keyword instead of triple-quoted strings, because strings starting with `<` trigger XML parsing.', 'README.md — Gotchas #5');
    add('Which tag is used for performance benchmarks?', '`@performance`', 'README.md — Tagging Strategy');
    add('Which schema-utils function makes all fields optional?', '`makeOptional(schema)` — converts all `#matcher` to `##matcher`.', 'README.md — Schema Composition Utilities');
    add('What does `karate.match()` return?', 'A result object `{pass, message}` without throwing an exception.', 'README.md — Advanced Search & Keyword Showcase');

    return items;
}

export function extractExercises(readmeText, overviewText) {
    var ex = [];
    var id = 0;

    var codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    var allBlocks = [];
    var match;
    while ((match = codeBlockRegex.exec(readmeText)) !== null) {
        allBlocks.push({ lang: match[1] || 'text', code: match[2].trim() });
    }
    while ((match = codeBlockRegex.exec(overviewText)) !== null) {
        allBlocks.push({ lang: match[1] || 'text', code: match[2].trim() });
    }

    function add(id, title, lang, code, desc, setup, difficulty, hints) {
        ex.push({
            id: id,
            title: title,
            lang: lang,
            code: code,
            description: desc,
            setup: setup || '',
            difficulty: difficulty || 'intermediate',
            hints: hints || []
        });
    }

    add(++id, 'E2E CRUD Scenario', 'gherkin',
        '# Full lifecycle: Create → Read → Update → Delete\n' +
        'Scenario: Full E2E CRUD with Schema Validation\n' +
        '  # CREATE — via reusable helper\n' +
        '  * def newId   = call uniqueId\n' +
        '  * def created = call read(\'classpath:petstore/helpers/utils.feature@createPet\') \\\n' +
        '                  { petId: #(newId), name: \'Buddy\', status: \'available\' }\n' +
        '  # READ & STRICT SCHEMA VALIDATION\n' +
        '  Given path \'pet\', created.createdPetId\n' +
        '  When method get\n' +
        '  Then status 200\n' +
        '  And match response.id   == \'#? _ > 0\'\n' +
        '  And match response.name == \'#string\'\n' +
        '  # UPDATE\n' +
        '  * set updatePayload.name = \'Buddy-Updated\'\n' +
        '  Given path \'pet\'\n' +
        '  And request updatePayload\n' +
        '  When method put\n' +
        '  Then status 200\n' +
        '  # DELETE\n' +
        '  Given path \'pet\', petId\n' +
        '  When method delete\n' +
        '  Then status 200',
        'This is the core CRUD scenario from `pet-crud.feature`. It demonstrates the complete lifecycle of a Pet entity using reusable helpers.',
        'Practice: Try changing the pet name from "Buddy" to your own name and adding a status assertion.',
        'intermediate',
        ['Start by defining a unique pet ID using `call uniqueId`',
            'Use `call read(\'...@createPet\')` to create a pet with a payload containing petId, name, and status',
            'After creating, use `Given path \'pet\', petId` then `When method get` to read it back']
    );

    add(++id, 'MasterRunner — Parallel Test Runner', 'java',
        'import com.intuit.karate.Results;\n' +
        'import com.intuit.karate.Runner;\n' +
        'import net.masterthought.cucumber.Configuration;\n' +
        'import net.masterthought.cucumber.ReportBuilder;\n' +
        'import java.io.File;\n' +
        'import java.util.ArrayList;\n' +
        'import java.util.List;\n' +
        'import static org.junit.jupiter.api.Assertions.assertEquals;\n' +
        '\n' +
        'class MasterRunner {\n' +
        '    @Test\n' +
        '    void testParallel() {\n' +
        '        Results results = Runner\n' +
        '            .path("classpath:petstore/features")\n' +
        '            .tags("~@ignore")\n' +
        '            .outputCucumberJson(true)\n' +
        '            .parallel(5);\n' +
        '        generateReport(results.getReportDir());\n' +
        '        assertEquals(0, results.getFailCount(),\n' +
        '            results.getErrorMessages());\n' +
        '    }\n' +
        '}',
        'The MasterRunner is the default JUnit 5 entry point that runs all features in parallel and generates the Masterthought HTML report.',
        'Practice: Change the thread count to 3 and add a `@smoke` tag filter.',
        'intermediate',
        ['Look at the Runner.path() and .parallel() methods — the thread count is the second argument',
            'Tags use the `@` prefix, so add `.tags("@smoke")` to the Runner chain',
            'Remember to also add a `SmokeRunner` that only runs `@smoke` tagged scenarios']
    );

    add(++id, 'karate-config.js — Global Configuration', 'javascript',
        'var envSettings = {\n' +
        '  dev:     { baseUrl: \'https://petstore.swagger.io/v2\',\n' +
        '             apiKey: \'dev-api-key-00000\' },\n' +
        '  qa:      { baseUrl: \'https://petstore.swagger.io/v2\',\n' +
        '             apiKey: \'qa-api-key-11111\' },\n' +
        '  staging: { baseUrl: \'https://petstore.swagger.io/v2\',\n' +
        '             apiKey: \'staging-api-key-22222\' }\n' +
        '};\n' +
        'var settings = envSettings[env] || envSettings[\'dev\'];\n' +
        '\n' +
        'karate.configure(\'headers\', function() {\n' +
        '  return {\n' +
        '    \'Accept\'       : \'application/json\',\n' +
        '    \'api_key\'      : settings.apiKey,\n' +
        '    \'X-Request-Id\' : \'\' + java.util.UUID.randomUUID(),\n' +
        '    \'X-Timestamp\'  : new Date().toISOString()\n' +
        '  };\n' +
        '});\n' +
        '\n' +
        'karate.configure(\'connectTimeout\', 10000);\n' +
        'karate.configure(\'readTimeout\', 10000);\n' +
        'karate.configure(\'retry\', { count: 3, interval: 2000 });\n' +
        '\n' +
        'config.apiKey = settings.apiKey;\n' +
        'config.baseUrl = settings.baseUrl;',
        'The global config script runs before every feature file. It resolves the environment, sets up headers, configures timeouts and retries.',
        'Practice: Add a new `production` environment with baseUrl \'https://api.petstore.com/v2\' and a production API key.',
        'intermediate',
        ['Look at the `envSettings` object — you need to add a new `production` key',
            'The `config` object is returned at the end of the function — set `config.baseUrl` for production',
            'Don\'t forget to update the API key as well for the production environment']
    );

    add(++id, 'Mock Server — Stateful In-Memory Petstore', 'gherkin',
        'Background:\n' +
        '  * def db  = {}\n' +
        '  * def seq = { next: 9000000 }\n' +
        '\n' +
        'Scenario: pathMatches(\'/v2/pet\') && methodIs(\'post\')\n' +
        '  * def newId = request.id > 0 ? request.id : seq.next++\n' +
        '  * eval db[\'\' + newId] = newPet\n' +
        '  * def responseStatus = 200\n' +
        '\n' +
        'Scenario: pathMatches(\'/v2/pet/{id}\') && methodIs(\'get\')\n' +
        '  * def found = db[\'\' + pathParams.id]\n' +
        '  * def responseStatus = found ? 200 : 404\n' +
        '\n' +
        'Scenario: pathMatches(\'/v2/pet/{id}\') && methodIs(\'delete\')\n' +
        '  * eval if (existed) delete db[id]\n' +
        '  * def responseStatus = existed ? 200 : 404\n' +
        '\n' +
        'Scenario:\n' +
        '  * def responseStatus = 404',
        'This mock server implements a fully stateful in-memory Petstore using Karate\'s Netty server. First-match-wins routing maintains a database across requests.',
        'Practice: Add a new route for `GET /v2/pet/findByStatus` that filters pets by status.',
        'intermediate',
        ['Look at the existing route patterns — each uses `pathMatches()` and `methodIs()` functions',
            'The `Scenario:` header (without a name) acts as a catch-all — add your new route BEFORE it',
            'Use `db` to filter: collect all pets matching a status from the database']
    );

    add(++id, 'Performance Benchmarking — Statistical SLA Gate', 'gherkin',
        '@regression @perf-stats\n' +
        'Scenario: Statistical Benchmark — mean / p50 / p95 / p99\n' +
        '  * def N     = C.perf.ITERATIONS\n' +
        '  * def inputs = (function(){\n' +
        '      var a=[]; for(var i=0;i<N;i++) a.push({i:i}); return a;\n' +
        '    })()\n' +
        '  * def runs  = call read(\'probe.feature@probe\') inputs\n' +
        '  * def times = karate.map(runs, function(r){ return r.elapsed })\n' +
        '  * def mean = helpers.mean(times)\n' +
        '  * def p95  = helpers.percentile(times, 95)\n' +
        '  * def p99  = helpers.percentile(times, 99)\n' +
        '  * assert mean < C.perf.MEAN_THRESHOLD\n' +
        '  * assert p95  < C.perf.P95_THRESHOLD\n' +
        '  * assert p99  < C.perf.P99_THRESHOLD\n' +
        '  * karate.embed(fullHtml, \'text/html\')',
        'The performance benchmark collects N probe request response times, calculates statistical metrics, and asserts against SLA thresholds.',
        'Practice: Add a `stddev` metric calculation and assert it\'s under 2000ms.',
        'intermediate',
        ['You already have `mean`, `p95`, and `p99` — stddev needs the same `times` array',
            'Calculate stddev = sqrt(mean of squared differences from mean) using JavaScript Math functions',
            'Add `* def stddev = helpers.stddev(times)` then `* assert stddev < 2000`']
    );

    add(++id, 'Data-Driven Testing with Scenario Outline', 'gherkin',
        '@data-driven\n' +
        'Scenario Outline: Data-Driven Pet Creation - <name> [<status>]\n' +
        '  Given path \'pet\'\n' +
        '  And request\n' +
        '    """\n' +
        '    {\n' +
        '      "id":     <id>,\n' +
        '      "name":   "<name>",\n' +
        '      "status": "<status>"\n' +
        '    }\n' +
        '    """\n' +
        '  When method post\n' +
        '  Then status 200\n' +
        '  And match response        == schema\n' +
        '  And match response.name   == \'<name>\'\n' +
        '  And match response.status == \'<status>\'\n' +
        '\n' +
        '  Examples:\n' +
        '    | read(\'classpath:petstore/data/pets.csv\') |',
        'Scenario Outline + CSV enables zero-duplication parameterized testing. Each row produces an independent test execution.',
        'Practice: Add a new column `category` to the CSV and update the request/assertions accordingly.',
        'intermediate',
        ['First add the `category` column to the CSV file in `pets.csv`',
            'Then add `<category>` in the request body JSON',
            'Finally add `And match response.category == \'<category>\'` assertion']
    );

    add(++id, 'GitHub Actions CI/CD Pipeline', 'yaml',
        'name: API Tests\n' +
        'on: [push, pull_request]\n' +
        'jobs:\n' +
        '  smoke:\n' +
        '    runs-on: ubuntu-latest\n' +
        '    steps:\n' +
        '      - uses: actions/checkout@v4\n' +
        '      - uses: actions/setup-java@v4\n' +
        '        with:\n' +
        '          java-version: \'17\'\n' +
        '          distribution: \'temurin\'\n' +
        '      - name: Run Smoke Tests\n' +
        '        run: mvn test -Psmoke -Dkarate.env=qa\n' +
        '      - name: Upload Reports\n' +
        '        uses: actions/upload-artifact@v4\n' +
        '        if: always()\n' +
        '        with:\n' +
        '          name: karate-reports\n' +
        '          path: |\n' +
        '            target/karate-reports/\n' +
        '            target/cucumber-html-reports/',
        'The CI/CD pipeline runs smoke tests on every push/PR, then uploads the generated HTML reports as build artifacts.',
        'Practice: Add a `regression` job that runs nightly only on the main branch.',
        'intermediate',
        ['Look at the existing `smoke` job — your new `regression` job has the same structure',
            'Change the trigger to `schedule` with a cron expression like `cron: "0 2 * * *"`',
            'Use a `if: github.ref == \'refs/heads/main\'` condition to restrict to main branch']
    );

    add(++id, 'Advanced Payload Manipulation', 'javascript',
        '# Filter out available dogs using Javascript array operations inside Karate\n' +
        '* def allPets = [\n' +
        '    { name: "Buddy", status: "available", category: "dog" },\n' +
        '    { name: "Mittens", status: "sold", category: "cat" },\n' +
        '    { name: "Rex", status: "available", category: "dog" }\n' +
        '  ]\n' +
        '* def isAvailableDog = function(x){ return x.status == "available" && x.category == "dog" }\n' +
        '* def availableDogs = karate.filter(allPets, isAvailableDog)\n' +
        '* match availableDogs == [{ name: "Buddy", status: "available", category: "dog" }, { name: "Rex", status: "available", category: "dog" }]',
        'Karate natively supports JavaScript execution. You can use karate.filter, karate.map, and karate.forEach to manipulate complex payloads.',
        'Practice: Change the filter logic to find pets that are "sold".',
        'intermediate',
        ['Look at the `isAvailableDog` function — you need to change the status condition',
            'Change `x.status == "available"` to `x.status == "sold"`',
            'Also update the expected match result to only show "Mittens"']
    );

    add(++id, 'Fuzzy Matching & Regex Assertions', 'gherkin',
        '# Validate dynamic data without hardcoding exact values\n' +
        '* def response = {\n' +
        '    id: "550e8400-e29b-41d4-a716-446655440000",\n' +
        '    timestamp: "2023-10-25T14:30:00Z",\n' +
        '    errorMessage: null\n' +
        '  }\n' +
        '* match response == {\n' +
        '    id: "#uuid",\n' +
        '    timestamp: "#regex ^\\\\d{4}-\\\\d{2}-\\\\d{2}T\\\\d{2}:\\\\d{2}:\\\\d{2}Z$",\n' +
        '    errorMessage: "##string"\n' +
        '  }',
        'Fuzzy matchers are essential for validating dynamic data like IDs and dates. ## means the field is optional (can be null or absent).',
        'Practice: Change the timestamp to an invalid string and see what happens.',
        'intermediate',
        ['The `#regex` matcher validates against a regular expression pattern',
            'Try changing `response.timestamp` to "not-a-date" — the `#regex` assertion will fail',
            'Passing means the match ignores the value; failing means the assertion catches it']
    );

    add(++id, 'Contract Testing with Schema Validation', 'gherkin',
        '# Define a reusable base schema in a common file or setup\n' +
        '* def petSchema = { id: "#number", name: "#string", status: "#string" }\n' +
        '* def response = { id: 123, name: "Charlie", status: "available", tags: [] }\n' +
        '\n' +
        '# Use fuzzy match to ensure the response CONTAINS the schema fields\n' +
        '* match response contains petSchema\n' +
        '\n' +
        '# Strict match requires exact schema definition\n' +
        '* def strictPetSchema = { id: "#number", name: "#string", status: "#string", tags: "#array" }\n' +
        '* match response == strictPetSchema',
        'Schema validation ensures API contracts remain unbroken. You can build schemas composably using Karate matchers.',
        'Practice: Modify the schema to make the name field optional.',
        'intermediate',
        ['To make a field optional in Karate matchers, use `##` prefix instead of `#`',
            'Change `name: "#string"` to `name: "##string"` in the schema',
            'Now the assertion will pass even if `name` is null or absent']
    );

    add(++id, 'Conditional Logic & Dynamic Teardowns', 'gherkin',
        '# Execute logic conditionally using Javascript eval\n' +
        '* def petCreated = true\n' +
        '* def petId = 12345\n' +
        '\n' +
        '# Setup a teardown hook that only runs if pet was created\n' +
        '* configure afterScenario = \n' +
        '  """\n' +
        '  function(){\n' +
        '    if (petCreated) {\n' +
        '      karate.log("Cleaning up pet", petId);\n' +
        '      // karate.call("cleanup.feature", { id: petId });\n' +
        '    }\n' +
        '  }\n' +
        '  """',
        'Karate allows conditional logic via JavaScript. The afterScenario hook is perfect for dynamic teardowns of resources created during the test.',
        'Practice: Change petCreated to false and verify the cleanup logic does not run.',
        'intermediate',
        ['Simply change `* def petCreated = true` to `* def petCreated = false`',
            'The `if (petCreated)` check will then skip the karate.log statement',
            'Check the output to confirm the cleanup log does not appear']
    );

    add(++id, 'Data-Driven CSV with Dynamic Headers', 'gherkin',
        '# Data driven tests map CSV columns directly to variables\n' +
        'Scenario Outline: Create user <username>\n' +
        '  * def payload = { user: "<username>", pass: "<password>" }\n' +
        '  * print "Creating:", payload\n' +
        '  \n' +
        '  Examples:\n' +
        '    | username | password |\n' +
        '    | "admin"  | "12345"  |\n' +
        '    | "guest"  | "abcde"  |',
        'Scenario Outlines iterate over data tables or external CSV files, running an isolated scenario for each row.',
        'Practice: Add a role column to the Examples table.',
        'intermediate',
        ['Add a third column header `role` to the Examples table',
            'Add values like `"admin"` and `"user"` in the data rows',
            'Update the payload to include `role: "<role>"` and add a match assertion']
    );

    add(++id, 'Java Interoperability', 'javascript',
        '# You can directly instantiate and call Java code from within Karate\n' +
        '* def MyUtils = Java.type(\'com.example.utils.MyUtils\')\n' +
        '* def result = MyUtils.generateSignature("payload", "secret")\n' +
        '* match result == "#string"',
        'Karate provides seamless Java interoperability using `Java.type()`. This is incredibly useful for custom encryption, database connections, or reusing existing Java utilities.',
        'Practice: Try changing the Java.type to `java.util.UUID` and call `.randomUUID().toString()`.',
        'intermediate',
        ['Replace `Java.type(\'com.example.utils.MyUtils\')` with `Java.type(\'java.util.UUID\')`',
            'Call `MyUtils.randomUUID().toString()` instead of `generateSignature`',
            'The result should still be a string — the `#string` matcher should still pass']
    );

    add(++id, 'GraphQL Query Execution', 'gherkin',
        '# Executing a GraphQL query is just a POST request with a specific payload\n' +
        'Given path \'graphql\'\n' +
        'And request { query: "{ hero { name appearsIn } }" }\n' +
        'When method post\n' +
        'Then status 200\n' +
        'And match response.data.hero.name == "R2-D2"',
        'GraphQL APIs can be tested effortlessly in Karate. The payload is simply a JSON object containing a `query` string (and optional `variables`).',
        'Practice: Modify the query to also request the hero\'s `id`.',
        'intermediate',
        ['Look at the GraphQL query string inside the `query` field',
            'Add `id` to the hero selection: `{ hero { id name appearsIn } }`',
            'You\'ll also want to add a match for `response.data.hero.id`']
    );

    add(++id, 'Polling / Retry until Condition Met', 'gherkin',
        '# Karate can poll an endpoint until a specific assertion passes\n' +
        '* configure retry = { count: 5, interval: 3000 }\n' +
        '\n' +
        'Given path \'jobs\', jobId\n' +
        'And retry until response.status == \'COMPLETED\'\n' +
        'When method get\n' +
        'Then status 200',
        'For asynchronous processes, `retry until <condition>` is a lifesaver. It automatically polls the endpoint, saving you from writing custom looping logic.',
        'Practice: Change the retry configuration to poll 10 times every 1 second.',
        'intermediate',
        ['The `configure retry` object has two properties: `count` and `interval` (in ms)',
            'Change `count: 5` to `count: 10` (10 attempts)',
            'Change `interval: 3000` to `interval: 1000` (1 second = 1000ms)']
    );

    add(++id, 'Reading Files and Type Conversion', 'gherkin',
        '# Read a JSON file and convert it to a string, or parse a string to JSON\n' +
        '* def myJson = read(\'classpath:data/payload.json\')\n' +
        '* def jsonString = karate.toString(myJson)\n' +
        '\n' +
        '* def rawText = \'{"key":"value"}\'\n' +
        '* def parsedJson = karate.fromString(rawText)\n' +
        '* match parsedJson.key == "value"',
        'Karate\'s `read()` automatically detects file types (JSON, XML, YAML, JS, CSV, TXT). You can convert back and forth between strings and JSON using `karate.toString()` and `karate.fromString()`.',
        'Practice: Add a `karate.typeOf(parsedJson)` check to assert it is a map/object.',
        'intermediate',
        ['Use `karate.typeOf()` to check the type of `parsedJson`',
            'Add: `* def typeName = karate.typeOf(parsedJson)` then `* match typeName == \'map\'`',
            'This verifies the parsed object is a Map (JSON object) type']
    );

    add(++id, 'Reusing Features with `call` vs `callonce`', 'gherkin',
        '# `call` executes the target feature file every time it is invoked\n' +
        '* def login1 = call read(\'login.feature\') { user: \'admin\' }\n' +
        '\n' +
        '# `callonce` executes it ONLY ONCE, caching the result for all subsequent calls in the same feature\n' +
        '* def token1 = callonce read(\'get-token.feature\')\n' +
        '* def token2 = callonce read(\'get-token.feature\')\n' +
        '# token2 uses the cached result from token1',
        '`callonce` is crucial for performance (e.g., getting an auth token once per feature file instead of once per scenario). Note: `callonce` cache is per-feature, not global.',
        'Practice: Try writing a scenario that uses `call` inside a loop to create multiple records.',
        'intermediate',
        ['Use a JavaScript `for` loop to call a feature multiple times',
            'Example: `* def ids = [1,2,3]; * def results = karate.map(ids, function(i){ return call read(\'create.feature\') { id: i } })`',
            'This creates 3 records by calling the same feature with different parameters']
    );

    // --- BASIC LEVEL EXERCISES ---
    add(++id, 'Basic GET Request', 'gherkin',
        '# A simple GET request to an endpoint and verifying the HTTP status code\n' +
        'Given url \'https://petstore.swagger.io/v2/pet/1\'\n' +
        'When method get\n' +
        'Then status 200',
        'This is the simplest Karate test. It hits an endpoint and verifies that it returns a 200 OK status. Notice we use `url` here for the full path.',
        'Practice: Change the status code to 404 to see how an assertion failure looks.',
        'basic',
        ['Start by changing `Then status 200` to `Then status 404`',
            'Run the test — it will fail because the API returns 200, not 404',
            'This teaches you how assertion failures look in Karate\'s HTML report']
    );

    add(++id, 'Defining and Using Variables', 'gherkin',
        '# Use the `def` keyword to create variables\n' +
        '* def myName = \'Karate Kid\'\n' +
        '* def myAge = 25\n' +
        '* def myPet = { name: \'Doggo\', type: \'Dog\' }\n' +
        '\n' +
        '# Variables can be printed or used in assertions\n' +
        '* print \'My name is\', myName\n' +
        '* match myPet.name == \'Doggo\'\n' +
        '* match myAge == 25',
        'Variables in Karate are dynamically typed and can hold primitives, JSON objects, or even XML. They are defined using the `def` keyword.',
        'Practice: Create a variable `colors` that holds an array of strings, then assert its first element.',
        'basic',
        ['Use `* def colors = [\'red\', \'green\', \'blue\']` to create the array',
            'Access the first element with `colors[0]`',
            'Add: `* match colors[0] == \'red\'` to verify the first element']
    );

    add(++id, 'Sending a POST Request', 'gherkin',
        '# Sending data in the request body\n' +
        'Given url \'https://petstore.swagger.io/v2/store/order\'\n' +
        'And request { "petId": 123, "quantity": 1, "status": "placed", "complete": true }\n' +
        'When method post\n' +
        'Then status 200\n' +
        'And match response.status == \'placed\'',
        'To send a payload with POST, PUT, or PATCH, use the `request` keyword. Karate automatically sets the `Content-Type` to `application/json` when passing a JSON object.',
        'Practice: Add a header to the request using `And header Authorization = \'Bearer token\'` before the `When` step.',
        'basic',
        ['Add the header line BEFORE the `When method post` step',
            'Use: `And header Authorization = \'Bearer token\'`',
            'The request will then include an Authorization header in the POST']
    );

    add(++id, 'Safe Path and Param Construction', 'gherkin',
        '# Avoid string concatenation like url \'http://api.com/pet?status=\' + status\n' +
        'Given url \'https://petstore.swagger.io/v2\'\n' +
        'And path \'pet\', \'findByStatus\'\n' +
        'And param status = \'available\'\n' +
        'When method get\n' +
        'Then status 200',
        'Using `path` and `param` ensures that your URLs are correctly URL-encoded and slashed. `path` takes comma-separated segments.',
        'Practice: Add another parameter `tags = \'friendly\'` to the request.',
        'basic',
        ['Add a new line after the existing `param` line',
            'Use: `And param tags = \'friendly\'`',
            'The URL will now include both `status=available` and `tags=friendly`']
    );

    add(++id, 'Validating JSON Arrays', 'gherkin',
        '# Using matchers on arrays\n' +
        '* def response = [ { id: 1, name: "Cat" }, { id: 2, name: "Dog" } ]\n' +
        '\n' +
        '# Asserting array size\n' +
        '* match response == \'#[2]\'\n' +
        '\n' +
        '# Validating the exact contents\n' +
        '* match response[0].name == "Cat"\n' +
        '\n' +
        '# Using wildcard [*] to assert every element has an id\n' +
        '* match response[*].id == \'#[2]\'',
        'Karate\'s `#[size]` macro allows you to assert the size of an array. The `[*]` wildcard lets you pluck properties from every object in an array.',
        'Practice: Use a fuzzy matcher to assert that every element in the array has an `id` that is a `#number`.',
        'basic',
        ['Use `match each` to apply a schema matcher to every element',
            'Add: `* match each response == { id: \'#number\', name: \'#string\' }`',
            'This will validate the TYPE of each field for every element']
    );

    // --- ADVANCED LEVEL EXERCISES ---
    add(++id, 'Array Contains and Contains Only', 'gherkin',
        '# Checking if arrays contain specific elements\n' +
        '* def colors = [\'red\', \'green\', \'blue\']\n' +
        '\n' +
        '# The array contains these elements (order does not matter)\n' +
        '* match colors contains [\'blue\', \'red\']\n' +
        '\n' +
        '# The array contains EXACTLY these elements and no others (order does not matter)\n' +
        '* match colors contains only [\'blue\', \'green\', \'red\']',
        'The `contains` keyword is powerful for array validation when you do not care about the order of elements or when the array might contain extra elements you wish to ignore.',
        'Practice: Define an array of objects and use `contains` to check if a specific object exists within it.',
        'advanced',
        ['Create an array of objects: `* def users = [{name:"Alice"}, {name:"Bob"}]`',
            'Use `match users contains [{name:"Alice"}]` to check if Alice exists',
            'The `contains` keyword does an element-wise deep comparison']
    );

    add(++id, 'Response Time Assertion', 'gherkin',
        '# Performance gating in functional tests\n' +
        'Given url \'https://petstore.swagger.io/v2/store/inventory\'\n' +
        'When method get\n' +
        'Then status 200\n' +
        '\n' +
        '# Assert that the API responds in under 1500 milliseconds\n' +
        '* assert responseTime < 1500',
        'The built-in `responseTime` variable holds the duration of the HTTP call in milliseconds. `assert` allows evaluating any JavaScript expression returning a boolean.',
        'Practice: Write an `assert` statement that verifies `response.length == undefined` (since it is an object, not an array).',
        'advanced',
        ['The `response` from GET /store/inventory returns a JSON object, not an array',
            'Objects don\'t have a `.length` property, so `response.length` is `undefined`',
            'Add: `* assert response.length == undefined` after the status assertion']
    );

    add(++id, 'Multi-line Strings and XML', 'gherkin',
        '# Using triple quotes for multi-line JSON or XML\n' +
        '* def myXml = \n' +
        '  """\n' +
        '  <book>\n' +
        '    <title>The Matrix</title>\n' +
        '    <price>19.99</price>\n' +
        '  </book>\n' +
        '  """\n' +
        '# Karate automatically parses XML\n' +
        '* match myXml/book/title == \'The Matrix\'\n' +
        '* match myXml.book.price == \'19.99\'',
        'Karate natively parses both JSON and XML defined inside triple quotes `"""`. You can use XPath-like syntax (`/book/title`) or JSON-path (`book.title`) to traverse XML!',
        'Practice: Create a multi-line JSON object using triple quotes and assert one of its fields.',
        'advanced',
        ['Use `"""` to define a multi-line JSON object: `* def person = """{ "name": "John", "age": 30 }"""`',
            'Karate auto-parses the triple-quoted string as JSON',
            'Add `* match person.name == \'John\'` to assert one of its fields']
    );

    add(++id, 'Early Exit with karate.abort()', 'gherkin',
        '# Stop test execution without failing if a condition is met\n' +
        '* def env = karate.env\n' +
        '* eval if (env == \'prod\') karate.abort()\n' +
        '\n' +
        '* print \'This step will NOT run if environment is prod\'\n' +
        '* match 1 == 1',
        '`karate.abort()` stops the execution of the current scenario immediately, but marks it as PASSED (or skipped). It is useful for test data setup steps that should abort safely if data already exists.',
        'Practice: Write an `eval if` statement that aborts if `responseStatus == 404`.',
        'advanced',
        ['Use `* def responseStatus = 404` to simulate a 404 response',
            'Add: `* eval if (responseStatus == 404) karate.abort()`',
            'The scenario will stop and be marked as passed despite the 404']
    );

    add(++id, 'Schema Validation with Map/Filter Arrays', 'gherkin',
        '# Complex schema validation inside an array\n' +
        '* def response = { pets: [{id: 1, name: "A"}, {id: 2, name: "B"}] }\n' +
        '\n' +
        '# Define the schema for a single pet\n' +
        '* def petSchema = { id: \'#number\', name: \'#string\' }\n' +
        '\n' +
        '# Validate that every element in the array matches the schema\n' +
        '* match each response.pets == petSchema',
        'The `match each` syntax is a lifesaver when an API returns an array of hundreds of objects. It iterates through the array and ensures every single element adheres to your schema.',
        'Practice: Add a `#notnull` constraint to the schema and verify it.',
        'advanced',
        ['Add `type: \'#notnull\'` to the petSchema to ensure the field exists',
            'Updated schema: `* def petSchema = { id: \'#number\', name: \'#string\', type: \'#notnull\' }`',
            '`#notnull` passes if the field exists and is not null, fails if it\'s absent']
    );

    // ─── NEW BASIC EXERCISES ──────────────────────────────────────
    add(++id, 'Using `print` for Debugging', 'gherkin',
        '# Use print to inspect variable values during test execution\n' +
        '* def myValue = { name: \'Fido\', age: 3 }\n' +
        '* print \'The full object is:\', myValue\n' +
        '* print \'Just the name:\', myValue.name\n' +
        '* print \'Is adult?\', myValue.age > 1\n' +
        '\n' +
        '# Print also works for arrays and complex expressions\n' +
        '* def items = [1, 2, 3]\n' +
        '* print \'Double each item:\', karate.map(items, function(x){ return x * 2 })',
        '`print` is Karate\'s built-in logging function. It appears in the HTML report, making it invaluable for debugging test failures. Unlike `karate.log`, it shows in both console and report.',
        'Practice: Add a `print` statement that displays the current `karate.env` value.',
        'basic',
        ['Use `* print \'Current env:\', karate.env` to print the environment',
            'The `karate.env` variable is set via `-Dkarate.env` or in karate-config.js',
            'Run the test and check the HTML report to see your print output']
    );

    add(++id, 'String Concatenation with `+`', 'gherkin',
        '# Strings can be concatenated using the + operator\n' +
        '* def firstName = \'John\'\n' +
        '* def lastName = \'Doe\'\n' +
        '* def fullName = firstName + \' \' + lastName\n' +
        '* print \'Full name is:\', fullName\n' +
        '* match fullName == \'John Doe\'\n' +
        '\n' +
        '# You can also concatenate strings with numbers\n' +
        '* def msg = \'User #\' + 42 + \' logged in\'\n' +
        '* print msg',
        'Karate\'s `+` operator works for string concatenation just like JavaScript. If you concatenate a string with a number, Karate auto-converts the number to a string.',
        'Practice: Create a variable `greeting` that concatenates "Hello, " with a name variable.',
        'basic',
        ['Define `* def name = \'World\'` first',
            'Then `* def greeting = \'Hello, \' + name`',
            'Add `* match greeting == \'Hello, World\'` to verify']
    );

    add(++id, 'Boolean Conditions with `if` and `eval`', 'gherkin',
        '# Use eval to run JavaScript conditional logic\n' +
        '* def count = 5\n' +
        '* eval if (count > 3) { karate.log(\'Count is large!\') }\n' +
        '\n' +
        '# You can also set variables conditionally\n' +
        '* def status = (count > 3) ? \'high\' : \'low\'\n' +
        '* match status == \'high\'',
        'The `eval` keyword executes any JavaScript expression. Combined with `if/else`, it gives you dynamic control over test flow based on runtime conditions.',
        'Practice: Change count to 1 and verify status becomes "low".',
        'basic',
        ['Change `* def count = 5` to `* def count = 1`',
            'Since 1 <= 3, the ternary expression evaluates to \'low\'',
            'Update the match: `* match status == \'low\'`']
    );

    // ─── NEW INTERMEDIATE EXERCISES ──────────────────────────────
    add(++id, 'Embedded Expressions (#{}) in Strings', 'gherkin',
        '# Embedded expressions let you substitute values directly into strings\n' +
        '* def petId = 42\n' +
        '* def petName = \'Buddy\'\n' +
        '\n' +
        '# Use #{} inside a string to inject variables\n' +
        '* def message = \'Pet #{petId} is named #{petName}\'\n' +
        '* match message == \'Pet 42 is named Buddy\'\n' +
        '\n' +
        '# Works in request bodies too\n' +
        '* def requestBody = { id: #(petId), name: \'#(petName)\' }',
        'Embedded expressions `#(variable)` are evaluated at runtime and replaced with the variable\'s value. They work in strings, JSON, XML — anywhere Karate parses text.',
        'Practice: Create a URL string with an embedded path variable: `http://api.com/pet/#(petId)`.',
        'intermediate',
        ['Define `* def baseUrl = \'http://api.com\'` and `* def petId = 123`',
            'Build: `* def url = baseUrl + \'/pet/#{petId}\'`',
            'Note: `#{}` works in strings but `#()` works in JSON/structured data']
    );

    add(++id, 'Custom Tag-Based Runner', 'java',
        'import com.intuit.karate.Results;\n' +
        'import com.intuit.karate.Runner;\n' +
        'import static org.junit.jupiter.api.Assertions.assertEquals;\n' +
        '\n' +
        'class SmokeRunner {\n' +
        '    @Test\n' +
        '    void testSmoke() {\n' +
        '        Results results = Runner.path("classpath:petstore/features")\n' +
        '            .tags("@smoke")\n' +
        '            .tags("~@slow")  // exclude slow tests\n' +
        '            .parallel(3);\n' +
        '        assertEquals(0, results.getFailCount(), results.getErrorMessages());\n' +
        '    }\n' +
        '}',
        'Tag-based runners allow you to compose test suites by including and excluding tags. `.tags("@smoke").tags("~@slow")` means: run @smoke scenarios EXCEPT those tagged @slow.',
        'Practice: Add a `.outputCucumberJson(true)` call to the Runner chain to also generate Cucumber JSON reports.',
        'intermediate',
        ['Add `.outputCucumberJson(true)` between `.tags("~@slow")` and `.parallel(3)`',
            'This generates JSON report files that Masterthought can consume',
            'The report dir defaults to `target/karate-reports`']
    );

    add(++id, 'Cookie Handling and Session Management', 'gherkin',
        '# Karate automatically manages cookies across requests in the same scenario\n' +
        'Given url \'https://httpbin.org/cookies/set\'\n' +
        'And param name = \'session_token\'\n' +
        'And param value = \'abc123\'\n' +
        'When method get\n' +
        'Then status 200\n' +
        '\n' +
        '# The cookie set above is automatically sent in subsequent requests\n' +
        'Given url \'https://httpbin.org/cookies\'\n' +
        'When method get\n' +
        'Then status 200\n' +
        'And match response.cookies.session_token == \'abc123\'',
        'Karate maintains a cookie jar per scenario. Any `Set-Cookie` response header is automatically stored and sent with all subsequent requests — no manual cookie handling needed!',
        'Practice: Add a custom cookie manually using `And header Cookie = \'custom=value\'` before the second request.',
        'intermediate',
        ['Before the second GET, add `And header Cookie = \'custom=value\'`',
            'This sends an ADDITIONAL cookie alongside the auto-stored ones',
            'The response will now reflect both the auto cookies and the manual one']
    );

    // ─── NEW ADVANCED EXERCISES ──────────────────────────────────
    add(++id, 'Thread-Safe Resource Cleanup (TestDataManager)', 'gherkin',
        '# Register resources at creation time for automatic cleanup\n' +
        '* def tdm = callonce TestDataManager.start()\n' +
        '* def pet = call read(\'utils.feature@createPet\') {}\n' +
        '* eval tdm.register(\'pet\', pet.id)\n' +
        '\n' +
        '# After test — iterate LIFO list and clean up\n' +
        '* def cleanup = function(){\n' +
        '  var list = tdm.getRegistry();\n' +
        '  for (var i = list.length - 1; i >= 0; i--) {\n' +
        '    karate.call(\'cleanup.feature\', list[i]);\n' +
        '  }\n' +
        '}\n' +
        '* configure afterScenario = cleanup',
        'The TestDataManager pattern ensures resources are always cleaned up in reverse creation order (LIFO), even when tests fail. This prevents resource leaks in long CI runs.',
        'Practice: Modify the cleanup to log each resource ID before deleting it.',
        'advanced',
        ['Add `karate.log(\'Cleaning up resource:\', list[i])` BEFORE the karate.call line',
            'This adds traceability to see which resources are being cleaned up',
            'The log will appear in both console and HTML report output']
    );

    add(++id, 'Custom HTML Reporter with Embedded Metrics', 'javascript',
        '// Generate a custom HTML report with embedded performance charts\n' +
        'function generateCustomReport(results) {\n' +
        '  var summary = results.getScenarioCounts();\n' +
        '  var total = summary.total;\n' +
        '  var passed = summary.passed;\n' +
        '  var failed = summary.failed;\n' +
        '  var passRate = (passed / total * 100).toFixed(2);\n' +
        '\n' +
        '  var html = \'<html><body>\' +\n' +
        '    \'<h2>Custom Test Report</h2>\' +\n' +
        '    \'<div>Passed: \' + passed + \'</div>\' +\n' +
        '    \'<div>Failed: \' + failed + \'</div>\' +\n' +
        '    \'<div>Pass Rate: \' + passRate + \'%</div>\' +\n' +
        '    \'</body></html>\';\n' +
        '  karate.embed(html, \'text/html\');\n' +
        '}',
        'Karate\'s `karate.embed()` lets you inject arbitrary HTML into the report. This is powerful for creating custom dashboards, embedding screenshots, or attaching diagnostic data.',
        'Practice: Modify the report to also display the total test duration (use `results.getDuration()`).',
        'advanced',
        ['Add a duration variable: `var duration = results.getDuration() / 1000 + \'s\'`',
            'Add to the HTML: `<div>Duration: \' + duration + \'</div>`',
            'The `getDuration()` returns milliseconds, so divide by 1000 for seconds']
    );

    add(++id, 'Gatling Performance Simulation Integration', 'java',
        'import com.intuit.karate.gatling.PreDef._\n' +
        'import io.gatling.core.PreDef._\n' +
        'import io.gatling.http.PreDef._\n' +
        '\n' +
        'class PetstoreSimulation extends Simulation {\n' +
        '  val protocol = karateProtocol(\n' +
        '    "/v2/pet/{id}" -> Nil,\n' +
        '    "/v2/store/order/{id}" -> Nil\n' +
        '  )\n' +
        '  protocol.runner = Runner.path("classpath:petstore/features/pet")\n' +
        '    .tags("@perf")\n' +
        '\n' +
        '  val createPet = scenario("Create Pet")\n' +
        '    .exec(karateFeature("classpath:petstore/features/pet/pet-crud.feature@perf-create"))\n' +
        '\n' +
        '  setUp(\n' +
        '    createPet.inject(rampUsers(10).during(5))\n' +
        '  ).protocols(protocol)\n' +
        '}',
        'Gatling integration converts Karate features into Gatling performance tests. The `karateProtocol` defines which path parameters to capture, and `rampUsers` controls the load pattern.',
        'Practice: Add a second scenario called `findPet` that runs `pet-search.feature@perf-search` with `rampUsers(20).during(10)`.',
        'advanced',
        ['Define a second scenario: `val findPet = scenario("Find Pet").exec(karateFeature("...@perf-search"))`',
            'Add it to `setUp()`: `setUp(createPet.inject(...), findPet.inject(rampUsers(20).during(10)))`',
            'Both scenarios run concurrently during the simulation']
    );

    // ─── NEW BASIC EXERCISES ─────────────────────────────────────────
    add(++id, '`match` Basics — Simple Assertions', 'gherkin',
        '# Match assertions compare values in various ways\n' +
        '* def name = \'Alice\'\n' +
        '* def age = 30\n' +
        '* def tags = [\'java\', \'karate\', \'api\']\n' +
        '\n' +
        '# Exact equality\n' +
        '* match name == \'Alice\'\n' +
        '\n' +
        '# Not equals\n' +
        '* match name != \'Bob\'\n' +
        '\n' +
        '# Array contains — order-independent\n' +
        '* match tags contains [\'karate\', \'api\']\n' +
        '\n' +
        '# Simple type checking\n' +
        '* match age == \'#number\'\n' +
        '* match name == \'#string\'',
        'The `match` keyword is Karate\'s primary assertion mechanism. It supports exact equality (`==`), inequality (`!=`), partial array matching (`contains`), and fuzzy type matchers (`#number`, `#string`).',
        'Practice: Add a boolean variable `* def isActive = true` and assert it equals `true` using `match`.',
        'basic',
        ['Use the `* def` keyword to define a boolean variable: `* def isActive = true`',
            'Add a `match` statement: `* match isActive == true`',
            'Run the test — the assertion will pass since both sides are `true`']
    );

    add(++id, 'Working with JSON Objects', 'gherkin',
        '# Create and access JSON objects\n' +
        '* def person = { id: 1, name: \'Alice\', address: { city: \'NYC\', zip: 10001 } }\n' +
        '\n' +
        '# Access top-level fields with dot notation\n' +
        '* match person.name == \'Alice\'\n' +
        '\n' +
        '# Access nested fields\n' +
        '* match person.address.city == \'NYC\'\n' +
        '\n' +
        '# Modify a field\n' +
        '* set person.name = \'Bob\'\n' +
        '* match person.name == \'Bob\'\n' +
        '\n' +
        '# Add a new field\n' +
        '* set person.phone = \'555-0100\'\n' +
        '* match person.phone == \'555-0100\'',
        'JSON objects are first-class citizens in Karate. You can create them inline with `{}`, access fields with dot notation, and mutate them using the `set` keyword.',
        'Practice: Add a new nested object `person.company` with fields `name` and `role`.',
        'basic',
        ['Use `set person.company = {}` to create the nested object',
            'Then set fields inside it: `set person.company.name = \'Acme\'`',
            'Assert it: `* match person.company.name == \'Acme\'`']
    );

    add(++id, 'The `request` Keyword', 'gherkin',
        '# Sending structured JSON in the request body\n' +
        'Given url \'https://petstore.swagger.io/v2/pet\'\n' +
        'And request { id: 99901, name: \'TestPet\', status: \'available\' }\n' +
        'When method post\n' +
        'Then status 200\n' +
        'And match response.name == \'TestPet\'',
        'The `request` keyword sets the HTTP request body. When you pass a JSON object, Karate automatically sets `Content-Type: application/json` and serializes it.',
        'Practice: Change the pet status to "sold" and verify it in the response.',
        'basic',
        ['Change `status: \'available\'` to `status: \'sold\'` in the request object',
            'Add a response assertion: `And match response.status == \'sold\'`',
            'The API should return the updated status in the response body']
    );

    add(++id, '`Then status` with Different Codes', 'gherkin',
        '# Verify different HTTP status codes\n' +
        '\n' +
        '# 200 OK — standard success\n' +
        'Given url \'https://petstore.swagger.io/v2/pet/1\'\n' +
        'When method get\n' +
        'Then status 200\n' +
        '\n' +
        '# 404 Not Found — resource does not exist\n' +
        'Given url \'https://petstore.swagger.io/v2/pet/99999999\'\n' +
        'When method get\n' +
        'Then status 404\n' +
        '\n' +
        '# 201 Created — resource successfully created\n' +
        'Given url \'https://petstore.swagger.io/v2/store/order\'\n' +
        'And request { petId: 1, quantity: 1, status: \'placed\' }\n' +
        'When method post\n' +
        'Then status 200  # Petstore returns 200, not 201',
        'Different HTTP status codes communicate different outcomes. 200 = OK, 201 = Created, 404 = Not Found. Karate\'s `Then status` only accepts integer literals — you cannot use variables here.',
        'Practice: Try to use `Then status 201` on the POST and observe the failure message.',
        'basic',
        ['Change `Then status 200` to `Then status 201` on the POST request',
            'The test will fail because the Petstore API returns 200, not 201',
            'Read the error in the HTML report — it shows the actual vs expected status']
    );

    add(++id, 'Using `And header` for Custom Headers', 'gherkin',
        '# Setting custom HTTP headers on a request\n' +
        'Given url \'https://httpbin.org/headers\'\n' +
        'And header Authorization = \'Bearer my-secret-token\'\n' +
        'And header X-Correlation-Id = \'req-abc-123\'\n' +
        'When method get\n' +
        'Then status 200\n' +
        'And match response.headers.Authorization == \'Bearer my-secret-token\'\n' +
        'And match response.headers.X-Correlation-Id == \'req-abc-123\'',
        'Use `And header <name> = <value>` to set custom HTTP headers. Headers set this way apply to the immediate next HTTP call only. For global headers, use `karate.configure(\'headers\', ...)` in config.',
        'Practice: Add a third custom header `X-Requested-With: XMLHttpRequest` and verify it.',
        'basic',
        ['Add another `And header` line before `When method get`: `And header X-Requested-With = \'XMLHttpRequest\'`',
            'Add a match assertion: `And match response.headers.X-Requested-With == \'XMLHttpRequest\'`',
            'httpbin.org echoes back all received headers for verification']
    );

    // ─── NEW INTERMEDIATE EXERCISES ──────────────────────────────────
    add(++id, 'Tag Composition — AND/OR/NOT', 'gherkin',
        '# Runners can compose tags using AND/OR/NOT logic\n' +
        '# AND — scenario must have ALL specified tags\n' +
        'Runner.path("classpath:features")\n' +
        '    .tags("@smoke", "@crud")  # BOTH @smoke AND @crud\n' +
        '\n' +
        '# OR — scenario can match ANY tag\n' +
        'Runner.path("classpath:features")\n' +
        '    .tags("@smoke")  # default is OR within same .tags()\n' +
        '\n' +
        '# NOT — exclude scenarios with a tag prefix\n' +
        'Runner.path("classpath:features")\n' +
        '    .tags("@smoke")\n' +
        '    .tags("~@slow")  # @smoke scenarios EXCEPT @slow ones\n' +
        '\n' +
        '# Practical: PR gate runs @smoke but skips @slow\n' +
        '# Same as: Runner.path(...).tags("@smoke").tags("~@slow")',
        'Karate tag composition lets you build precise test suites. Multiple tags in one `.tags()` call = AND. Multiple `.tags()` calls = OR. Prefix `~` = NOT (exclude). This is critical for CI/CD pipeline orchestration.',
        'Practice: Write a runner filter that runs tests tagged @regression OR @contract but excludes @slow.',
        'intermediate',
        ['Use `.tags("@regression", "@contract")` — this requires BOTH tags (AND)',
            'For OR logic, use separate `.tags()` calls or a single tag that covers both',
            'Add `.tags("~@slow")` to exclude slow scenarios from the suite']
    );

    add(++id, 'Deep Clone with `copy` vs `def` Reference', 'gherkin',
        '# `def` creates a reference — mutations affect the original!\n' +
        '* def original = { name: \'Buddy\', tags: [{ name: \'alpha\' }] }\n' +
        '* def ref = original\n' +
        '* set ref.name = \'Charlie\'\n' +
        '* match original.name == \'Charlie\'  # original was mutated!\n' +
        '\n' +
        '# `copy` creates a deep clone — mutations are isolated\n' +
        '* copy clone = original\n' +
        '* set clone.name = \'Delta\'\n' +
        '* match original.name == \'Charlie\'  # unchanged\n' +
        '* match clone.name == \'Delta\'       # independent\n' +
        '\n' +
        '# `copy` also handles nested objects and arrays\n' +
        '* set clone.tags[0].name = \'beta\'\n' +
        '* match original.tags[0].name == \'alpha\'  # nested also unchanged',
        'Understanding the difference between `def` (reference) and `copy` (deep clone) is crucial for avoiding hard-to-find bugs where shared state gets mutated. `copy` recursively clones the entire object graph.',
        'Practice: Create an array of objects, `def` a reference, and show that `set` on the reference mutates the original array.',
        'intermediate',
        ['Create an array: `* def items = [{x: 1}, {x: 2}]`',
            'Assign by reference: `* def ref = items` then `set ref[0].x = 99`',
            'Check original: `* match items[0].x == 99` — the original changed!']
    );

    add(++id, '`callSingle` Shared Session Pattern', 'javascript',
        '// karate-config.js excerpt — callSingle caches across ALL threads\n' +
        'var session = karate.callSingle(\n' +
        '  \'classpath:petstore/helpers/auth.feature@auth\', config\n' +
        ');\n' +
        'config.session = session;\n' +
        '\n' +
        '// Without callSingle — each thread calls auth separately:\n' +
        '// var session = call read(\'auth.feature@auth\') config\n' +
        '\n' +
        '// With callSingle — ONE call, cached for all threads:\n' +
        '// var session = karate.callSingle(\'auth.feature@auth\', config)\n' +
        '\n' +
        '// NOTE: Variables captured via closure are NOT shared\n' +
        '// across parallel threads. Always expose on config:\n' +
        '// config.apiKey = settings.apiKey;  // ✅ shared\n' +
        '// var _apiKey = settings.apiKey;    // ❌ not shared',
        '`karate.callSingle()` executes a feature file once per JVM and caches the result for all parallel threads. This is the recommended pattern for OAuth token exchange, shared session setup, or any expensive one-time initialization.',
        'Practice: Modify the pattern to call a `setup.feature@init` instead of `auth.feature@auth` and store a `baseUrl` override on the config.',
        'intermediate',
        ['Change the feature path from `auth.feature@auth` to `setup.feature@init`',
            'The called feature should return an object with a `baseUrl` field',
            'Assign: `config.baseUrl = session.baseUrl` to override the base URL for all features']
    );

    // ─── NEW ADVANCED EXERCISES ─────────────────────────────────────
    add(++id, 'Programmatic `karate.match()`', 'gherkin',
        '# karate.match() returns { pass: boolean, message: string } without throwing\n' +
        '* def schema = { id: \'#number\', name: \'#string\' }\n' +
        '* def goodResp = { id: 1, name: \'Alice\' }\n' +
        '* def badResp = { id: \'not-a-number\', name: \'Bob\' }\n' +
        '\n' +
        '# Programmatic match — does NOT throw on failure\n' +
        '* def result1 = karate.match(goodResp, schema)\n' +
        '* match result1.pass == true\n' +
        '\n' +
        '* def result2 = karate.match(badResp, schema)\n' +
        '* match result2.pass == false\n' +
        '* match result2.message == \'#string\'\n' +
        '\n' +
        '# Useful for conditional logic based on validation\n' +
        '* eval if (!karate.match(response, schema).pass) {\n' +
        '    karate.log(\'Schema validation failed, applying fallback\')\n' +
        '  }',
        'Unlike `match` which throws immediately on failure, `karate.match()` returns a result object. This is invaluable for conditional validation, fallback logic, and accumulating multiple validation errors without aborting the scenario.',
        'Practice: Use `karate.match()` to validate an array — return `{ pass, message }` for each element and count the failures.',
        'advanced',
        ['Loop over the array with `karate.forEach()` or a for loop',
            'Call `karate.match(element, schema)` on each element',
            'Count failures: `* def failures = karate.filter(results, function(r){ return !r.pass })`']
    );

    add(++id, 'Schema Composition with `schema-utils.js`', 'javascript',
        '// schema-utils.js provides pure functions for runtime schema manipulation\n' +
        '// All functions return NEW objects — inputs are never mutated\n' +
        '\n' +
        '// merge(base, override) — shallow merge, override wins on collision\n' +
        'var merged = schemaUtils.merge(\n' +
        '  { id: "#number", name: "#string" },\n' +
        '  { name: "#regex ^[A-Z].+", status: "#string" }\n' +
        ');\n' +
        '// → { id: "#number", name: "#regex ^[A-Z].+", status: "#string" }\n' +
        '\n' +
        '// pick(schema, [\'field1\', \'field2\']) — minimal schema with only listed fields\n' +
        'var v1Contract = schemaUtils.pick(strictSchema, [\'id\', \'name\']);\n' +
        '\n' +
        '// makeOptional(schema) — converts #matcher → ##matcher (allows null)\n' +
        'var relaxed = schemaUtils.makeOptional(strictSchema);\n' +
        '\n' +
        '// withField(schema, key, matcher) — add/override a single field\n' +
        'var extended = schemaUtils.withField(strictSchema, \'name\', \'#? _.length >= 3\');',
        'Schema composition utilities let you build validation schemas at runtime — perfect for API versioning, consumer-driven contracts, and environment-specific assertions. All functions are pure (no side effects).',
        'Practice: Use `without()` to remove the `tags` field from a pet schema, then validate a response against the stripped schema.',
        'advanced',
        ['Call `schemaUtils.without(petSchema, [\'tags\'])` to remove the tags field',
            'Use the result with `match response == strippedSchema`',
            'The assertion passes even if the original schema required tags']
    );

    add(++id, 'The `text` Keyword — Raw String Assignment', 'gherkin',
        '# Triple-quoted strings starting with < are parsed as XML — BEWARE!\n' +
        '* def htmlBlock =\n' +
        '  """\n' +
        '  <table>\n' +
        '    <tr><td>Cell</td></tr>\n' +
        '  </table>\n' +
        '  """\n' +
        '# ⚠️ The above causes SAXParseException — Karate tries to parse as XML!\n' +
        '\n' +
        '# ✅ Use the `text` keyword to bypass XML parsing\n' +
        '* text htmlBlock =\n' +
        '  """\n' +
        '  <table>\n' +
        '    <tr><td>Cell</td></tr>\n' +
        '  </table>\n' +
        '  """\n' +
        '# htmlBlock is now a raw string — no XML parsing\n' +
        '* match karate.typeOf(htmlBlock) == \'string\'\n' +
        '* match htmlBlock contains \'<table>\'',
        'Karate auto-detects triple-quoted strings: if the first non-whitespace character is `<`, it parses as XML. Use the `text` keyword to force raw string assignment when dealing with HTML, SVG, or any text starting with `<`.',
        'Practice: Write a `text` block containing an SVG image tag and assert it contains `viewBox`.',
        'advanced',
        ['Use `text svg = """` and paste an SVG snippet like `<svg viewBox="0 0 100 100">...</svg>`',
            'Assert: `* match svg contains \'viewBox\'`',
            'Try with `def` instead of `text` first to see the XML parsing error']
    );

    add(++id, '`karate.fromString()` after `replace`', 'gherkin',
        '# The `replace` keyword leaves the variable as a raw String\n' +
        '* def suffix = \'Smith\'\n' +
        '* def users =\n' +
        '  """\n' +
        '  [ { "username": "<sfx>", "role": "admin" } ]\n' +
        '  """\n' +
        '* replace users/<sfx> = suffix\n' +
        '# users is now a String — NOT a JSON array!\n' +
        '* match karate.typeOf(users) == \'string\'\n' +
        '\n' +
        '# ✅ Parse back to JSON before use\n' +
        '* def users = karate.fromString(users)\n' +
        '* match karate.typeOf(users) == \'list\'\n' +
        '* match users[0].username == \'Smith\'',
        'A critical gotcha: `replace` always produces a String. If you pass it to `And request`, Karate sends `text/plain` (HTTP 415). Always call `karate.fromString()` to convert back to JSON after using `replace`.',
        'Practice: Extend the pattern to replace TWO placeholders — `<sfx>` for username and `<role>` for role.',
        'advanced',
        ['Add a second placeholder in the template: `"role": "<role>"`',
            'Define a variable: `* def role = \'editor\'`',
            'Add `replace users/<role> = role` then parse with `karate.fromString()`']
    );

    add(++id, 'Nightly Regression CI/CD Runner', 'yaml',
        'name: Nightly Regression\n' +
        '\n' +
        'on:\n' +
        '  schedule:\n' +
        '    - cron: \'0 2 * * *\'   # Runs at 2:00 AM UTC every day\n' +
        '  workflow_dispatch:        # Allow manual trigger too\n' +
        '\n' +
        'jobs:\n' +
        '  regression:\n' +
        '    runs-on: ubuntu-latest\n' +
        '    if: github.ref == \'refs/heads/main\'\n' +
        '    steps:\n' +
        '      - uses: actions/checkout@v4\n' +
        '      - uses: actions/setup-java@v4\n' +
        '        with:\n' +
        '          java-version: \'17\'\n' +
        '          distribution: \'temurin\'\n' +
        '      - name: Run Regression Suite\n' +
        '        run: mvn test -Pregression -Dkarate.env=staging\n' +
        '      - name: Upload Reports\n' +
        '        uses: actions/upload-artifact@v4\n' +
        '        if: always()\n' +
        '        with:\n' +
        '          name: regression-reports\n' +
        '          path: target/',
        'Nightly regression pipelines run the full test suite against staging environments. The `schedule` event with cron syntax triggers automatically. `workflow_dispatch` allows manual triggering for debugging. This pattern complements the smoke-test-only CI/CD from the earlier exercise.',
        'Practice: Add a `timeout-minutes: 60` constraint to the regression job and a `slack-notify` step on failure.',
        'advanced',
        ['Add `timeout-minutes: 60` to the regression job (same indentation as `runs-on`)',
            'Add a notification step after the run: `- name: Notify on Failure if: failure() uses: ...`',
            'The `if: failure()` condition ensures notifications only fire when tests fail']
    );

    add(++id, '`configure retry` + Defensive Assertions', 'gherkin',
        '# The public Petstore demo API can be unreliable\n' +
        '# Use defensive patterns to handle intermittent failures\n' +
        '\n' +
        '# 1. Retry transient failures\n' +
        '* configure retry = { count: 5, interval: 2000 }\n' +
        '\n' +
        '# 2. Use retry until condition before asserting\n' +
        'Given url \'https://petstore.swagger.io/v2/pet/1\'\n' +
        'And retry until responseStatus == 200\n' +
        'When method get\n' +
        'Then status 200\n' +
        '\n' +
        '# 3. Use ##string instead of #string for unreliable fields\n' +
        '* match response.name == \'##string\'  # allows null/absent\n' +
        '\n' +
        '# 4. Defensive filtering — only validate well-formed items\n' +
        '* def validPets = karate.filter(response, function(p){ return p.name != null })\n' +
        '* match each validPets contains { id: \'#number\', name: \'#string\' }',
        'Real-world API testing requires defensive patterns. The `configure retry` + `retry until` combination handles transient network issues. `##string` (optional) vs `#string` (required) lets you decide strictness. Always filter noisy data before strict validation.',
        'Practice: Combine `configure retry` with a `karate.abort()` fallback — if the API is down after retries, abort gracefully instead of failing.',
        'advanced',
        ['After `configure retry`, add a check: `* eval if (responseStatus != 200) karate.abort()`',
            'This pattern is useful for non-critical assertions in long regression suites',
            'The scenario will pass (marked as skipped) instead of failing the entire suite']
    );

    return ex;
}

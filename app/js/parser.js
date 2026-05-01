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
        
        tables.forEach(function(tableStr) {
            var lines = tableStr.trim().split('\n');
            if (lines.length < 3) return;
            
            var headers = lines[0].split('|').map(function(h) { return h.trim().replace(/\*\*/g, '').replace(/`/g, ''); }).filter(Boolean);
            if (headers.length < 2) return;
            
            if (!lines[1].includes('---')) return;
            
            for (var i = 2; i < lines.length; i++) {
                var cells = lines[i].split('|').map(function(c) { return c.trim().replace(/\*\*/g, ''); }).filter(Boolean);
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

    function add(id, title, lang, code, desc, setup) {
        ex.push({
            id: id,
            title: title,
            lang: lang,
            code: code,
            description: desc,
            setup: setup || ''
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
        'Practice: Try changing the pet name from "Buddy" to your own name and adding a status assertion.'
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
        'Practice: Change the thread count to 3 and add a `@smoke` tag filter.'
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
        'Practice: Add a new `production` environment with baseUrl \'https://api.petstore.com/v2\' and a production API key.'
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
        'Practice: Add a new route for `GET /v2/pet/findByStatus` that filters pets by status.'
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
        'Practice: Add a `stddev` metric calculation and assert it\'s under 2000ms.'
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
        'Practice: Add a new column `category` to the CSV and update the request/assertions accordingly.'
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
        'Practice: Add a `regression` job that runs nightly only on the main branch.'
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
        'Practice: Change the filter logic to find pets that are "sold".'
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
        'Practice: Change the timestamp to an invalid string and see what happens.'
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
        'Practice: Modify the schema to make the name field optional.'
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
        'Practice: Change petCreated to false and verify the cleanup logic does not run.'
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
        'Practice: Add a role column to the Examples table.'
    );

    add(++id, 'Java Interoperability', 'javascript',
        '# You can directly instantiate and call Java code from within Karate\n' +
        '* def MyUtils = Java.type(\'com.example.utils.MyUtils\')\n' +
        '* def result = MyUtils.generateSignature("payload", "secret")\n' +
        '* match result == "#string"',
        'Karate provides seamless Java interoperability using `Java.type()`. This is incredibly useful for custom encryption, database connections, or reusing existing Java utilities.',
        'Practice: Try changing the Java.type to `java.util.UUID` and call `.randomUUID().toString()`.'
    );

    add(++id, 'GraphQL Query Execution', 'gherkin',
        '# Executing a GraphQL query is just a POST request with a specific payload\n' +
        'Given path \'graphql\'\n' +
        'And request { query: "{ hero { name appearsIn } }" }\n' +
        'When method post\n' +
        'Then status 200\n' +
        'And match response.data.hero.name == "R2-D2"',
        'GraphQL APIs can be tested effortlessly in Karate. The payload is simply a JSON object containing a `query` string (and optional `variables`).',
        'Practice: Modify the query to also request the hero\'s `id`.'
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
        'Practice: Change the retry configuration to poll 10 times every 1 second.'
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
        'Practice: Add a `karate.typeOf(parsedJson)` check to assert it is a map/object.'
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
        'Practice: Try writing a scenario that uses `call` inside a loop to create multiple records.'
    );

    // --- BASIC LEVEL EXERCISES ---
    add(++id, 'Basic GET Request', 'gherkin',
        '# A simple GET request to an endpoint and verifying the HTTP status code\n' +
        'Given url \'https://petstore.swagger.io/v2/pet/1\'\n' +
        'When method get\n' +
        'Then status 200',
        'This is the simplest Karate test. It hits an endpoint and verifies that it returns a 200 OK status. Notice we use `url` here for the full path.',
        'Practice: Change the status code to 404 to see how an assertion failure looks.'
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
        'Practice: Create a variable `colors` that holds an array of strings, then assert its first element.'
    );

    add(++id, 'Sending a POST Request', 'gherkin',
        '# Sending data in the request body\n' +
        'Given url \'https://petstore.swagger.io/v2/store/order\'\n' +
        'And request { "petId": 123, "quantity": 1, "status": "placed", "complete": true }\n' +
        'When method post\n' +
        'Then status 200\n' +
        'And match response.status == \'placed\'',
        'To send a payload with POST, PUT, or PATCH, use the `request` keyword. Karate automatically sets the `Content-Type` to `application/json` when passing a JSON object.',
        'Practice: Add a header to the request using `And header Authorization = \'Bearer token\'` before the `When` step.'
    );

    add(++id, 'Safe Path and Param Construction', 'gherkin',
        '# Avoid string concatenation like url \'http://api.com/pet?status=\' + status\n' +
        'Given url \'https://petstore.swagger.io/v2\'\n' +
        'And path \'pet\', \'findByStatus\'\n' +
        'And param status = \'available\'\n' +
        'When method get\n' +
        'Then status 200',
        'Using `path` and `param` ensures that your URLs are correctly URL-encoded and slashed. `path` takes comma-separated segments.',
        'Practice: Add another parameter `tags = \'friendly\'` to the request.'
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
        'Practice: Use a fuzzy matcher to assert that every element in the array has an `id` that is a `#number`.'
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
        'Practice: Define an array of objects and use `contains` to check if a specific object exists within it.'
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
        'Practice: Write an `assert` statement that verifies `response.length == undefined` (since it is an object, not an array).'
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
        'Practice: Create a multi-line JSON object using triple quotes and assert one of its fields.'
    );

    add(++id, 'Early Exit with karate.abort()', 'gherkin',
        '# Stop test execution without failing if a condition is met\n' +
        '* def env = karate.env\n' +
        '* eval if (env == \'prod\') karate.abort()\n' +
        '\n' +
        '* print \'This step will NOT run if environment is prod\'\n' +
        '* match 1 == 1',
        '`karate.abort()` stops the execution of the current scenario immediately, but marks it as PASSED (or skipped). It is useful for test data setup steps that should abort safely if data already exists.',
        'Practice: Write an `eval if` statement that aborts if `responseStatus == 404`.'
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
        'Practice: Add a `#notnull` constraint to the schema and verify it.'
    );

    return ex;
}

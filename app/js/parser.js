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
        ['How many parallel threads does MasterRunner use?', 'MasterRunner uses 5 parallel threads (Runner.parallel(5)). SmokeRunner uses 3 threads.', 'config', 'README.md — Runner Classes'],
        ['How do you select all names from an array of objects using JSONPath?', 'Use the wildcard operator: `response[*].name`.', 'api', 'JSONPath Basics'],
        ['What is the difference between `$` and `@` in JSONPath?', '`$` represents the root object/document. `@` represents the current element being processed in a filter expression (e.g., `[?(@.id==1)]`).', 'api', 'JSONPath Basics'],
        ['How do you filter an array using JSONPath to find an item with id=5?', 'Use a filter expression: `response[?(@.id==5)]`.', 'api', 'JSONPath Basics'],
        ['How do you call a JavaScript function in Karate?', 'Define it as a variable using `def` and call it: `* def myFunc = function(){ return "hello" }` then `* def result = myFunc()`.', 'concept', 'JavaScript Interop'],
        ['Can Karate execute Java code directly?', 'Yes, using `Java.type()`. Example: `* def UUID = Java.type("java.util.UUID")` allows calling Java methods directly.', 'concept', 'JavaScript Interop'],
        ['What happens if you use string concatenation `+` with a JSON object in Karate?', 'Karate will implicitly convert the JSON object to a string format, which may break subsequent JSON operations unless parsed back.', 'gotcha', 'Karate Gotchas'],
        ['How do you handle a JSON response where a field name contains a hyphen (e.g., "first-name")?', 'Use bracket notation instead of dot notation: `response["first-name"]`.', 'gotcha', 'Karate Gotchas'],
        ['Why might `match response contains { id: 1 }` fail if the response is an array?', 'You should use `match each response contains { id: 1 }` if you want to check every element, or `match response contains [{ id: 1 }]` to check if the array contains that specific object.', 'gotcha', 'Karate Gotchas'],
        ['How do you start a UI automation session in Karate?', 'Use the `driver` keyword followed by the URL: `Given driver "https://example.com"`.', 'api', 'UI Automation'],
        ['What keyword is used to click an element in Karate UI?', 'The `click()` function on an element or the `click()` keyword: `And click("button.submit")`.', 'api', 'UI Automation'],
        ['How do you type text into an input field in Karate UI?', 'Use the `input()` keyword: `And input("input[name=username]", "myuser")`.', 'api', 'UI Automation'],
        ['How do you wait for an element to appear in Karate UI?', 'Use the `waitFor()` keyword: `And waitFor("#success-message")`.', 'api', 'UI Automation'],
        ['What does the `karate.abort()` function do?', 'It immediately stops the execution of the current scenario, but marks it as Passed. Useful for conditional logic.', 'concept', 'Karate Gotchas'],
        ['How do you assert that a string matches a regular expression?', 'Use the `#regex` fuzzy matcher: `match response.date == "#regex ^\\\\d{4}-\\\\d{2}-\\\\d{2}$"`.', 'api', 'API Assertions']
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

    function addMCQ(question, code, options, correctIndex, explanation, source) {
        items.push({
            id: ++id,
            question: question,
            code: code,
            options: options,
            correctIndex: correctIndex,
            explanation: explanation,
            source: source || 'Karate Advanced Concepts'
        });
    }

    addMCQ(
        "You need to fetch an auth token once and share it across all parallel threads to avoid rate limits. Which approach is correct?",
        "// A\n* def token = call read('auth.feature')\n\n// B\n* def token = callonce read('auth.feature')\n\n// C\nvar token = karate.callSingle('auth.feature', config);",
        [
            "Option A: use `call`",
            "Option B: use `callonce` in the feature file",
            "Option C: use `karate.callSingle()` in karate-config.js",
            "Option D: none of the above, threads cannot share data"
        ],
        2,
        "`callonce` only caches within a single feature file. To share data across ALL parallel threads in the JVM, you must use `karate.callSingle()` in `karate-config.js`.",
        "Performance & Parallel Execution"
    );

    addMCQ(
        "What is the fatal flaw in the following Karate code snippet?",
        "* def userTemplate = \n\"\"\"\n{\n  \"username\": \"<user>\",\n  \"role\": \"admin\"\n}\n\"\"\"\n* replace userTemplate/<user> = 'john_doe'\n* request userTemplate\n* method post",
        [
            "The `replace` keyword uses incorrect syntax.",
            "`userTemplate` is sent as a raw String (text/plain) instead of JSON.",
            "`<user>` cannot be used as a replacement token inside JSON.",
            "The `request` keyword must come after `method post`."
        ],
        1,
        "The `replace` keyword ALWAYS results in a raw String. If you pass a string to `request`, Karate sends `text/plain`. You MUST use `karate.fromString(userTemplate)` to convert it back to JSON before making the request.",
        "Gotchas #3"
    );

    addMCQ(
        "You want to assert that an array in the response contains EXACTLY the elements 'apple' and 'banana', and no other elements, regardless of order. Which assertion is correct?",
        "* match response ??? ['apple', 'banana']",
        [
            "contains",
            "==",
            "contains only",
            "contains any"
        ],
        2,
        "`contains` allows extra elements. `==` strictly enforces array order. `contains only` ensures exactly those elements exist (ignoring order) with no extras.",
        "API Assertions"
    );

    addMCQ(
        "Your API intermittently returns a 503 error due to cold starts. You want Karate to retry the request up to 5 times. What is the correct syntax?",
        "Given url 'https://api.example.com/data'\n# MISSING CODE\nWhen method get",
        [
            "And retry 5 times",
            "And retry until responseStatus == 200",
            "And configure retry = { count: 5 }",
            "You must use both `configure retry` AND `retry until <condition>`"
        ],
        3,
        "Retrying requires two steps: globally configuring the retry parameters (`configure retry = { count: 5, interval: 1000 }`), and then declaring the retry condition using `And retry until ...` BEFORE the `method` step.",
        "Advanced Flow Control"
    );

    addMCQ(
        "Which schema assertion correctly verifies that a field named 'status' is EITHER a string OR completely absent/null?",
        null,
        [
            "status: '#string'",
            "status: '##string'",
            "status: '#? ...'",
            "status: '#ignore'"
        ],
        1,
        "The double-hash `##` prefix designates a field as optional. It will pass if the field is the specified type, if the field is null, or if the field is missing entirely.",
        "Schema Validation"
    );

    addMCQ(
        "Look at the following code. What will be the value of `original.name` at the end of the script?",
        "* def original = { name: 'Alpha' }\n* def reference = original\n* set reference.name = 'Beta'",
        [
            "'Alpha'",
            "'Beta'",
            "null",
            "The script will throw an error"
        ],
        1,
        "`def` assigns by reference for JSON objects. Mutating `reference` also mutates `original`. To avoid this, use the `copy` keyword for deep cloning.",
        "Gotchas"
    );

    addMCQ(
        "How do you assign an HTML snippet to a variable in Karate WITHOUT triggering XML parsing errors?",
        "* def snippet = \n\"\"\"\n<div>\n  <p>Hello</p>\n</div>\n\"\"\"",
        [
            "Change `def` to `text`",
            "Change `def` to `string`",
            "Escape the brackets like `<\\/div>`",
            "You cannot assign HTML in Karate"
        ],
        0,
        "If a triple-quoted string begins with `<`, Karate assumes it is XML and will throw a SAXParseException if it's malformed HTML. Using the `text` keyword bypasses XML parsing and stores it as a raw string.",
        "Gotchas #5"
    );

    addMCQ(
        "What does the following JSONPath expression do?\n`response[*]?(@.price < 10)`",
        null,
        [
            "Extracts the first item with a price less than 10",
            "Returns a boolean indicating if any item has a price less than 10",
            "Filters the array and returns all objects where the price is less than 10",
            "This is invalid JSONPath syntax"
        ],
        2,
        "The `[?(@.condition)]` syntax is a JSONPath filter expression. It evaluates the condition against every element (`@`) in the array and returns a new array containing all matching elements.",
        "JSONPath Basics"
    );

    addMCQ(
        "You are writing a Data-Driven test using a Scenario Outline. How do you inject the column 'userId' into the request body?",
        "Scenario Outline: Update User\nGiven url '...'\nAnd request { id: ??? }",
        [
            "#(userId)",
            "<userId>",
            "${userId}",
            "userId"
        ],
        1,
        "In Scenario Outlines, values from the `Examples:` table are injected using angle brackets `<column_name>`. These are replaced via simple string substitution BEFORE the scenario is evaluated.",
        "Data-Driven Testing"
    );

    addMCQ(
        "You want to stop the execution of the current scenario gracefully (marking it as Passed) if the environment is 'prod'. Which is correct?",
        null,
        [
            "* eval if (karate.env == 'prod') karate.stop()",
            "* eval if (karate.env == 'prod') karate.abort()",
            "* eval if (karate.env == 'prod') karate.fail('skipping')",
            "* return (karate.env != 'prod')"
        ],
        1,
        "`karate.abort()` stops the execution of the current scenario immediately without marking it as failed. It is heavily used in conditional teardowns or skipping tests dynamically.",
        "Execution Control"
    );

    addMCQ(
        "You want to assert that EVERY element in an array conforms to a specific schema. Which syntax is most efficient?",
        "* def petSchema = { id: '#number', name: '#string' }\n* def response = [{id: 1, name: 'A'}, {id: 2, name: 'B'}]",
        [
            "* match response == '#[2] petSchema'",
            "* match response == petSchema",
            "* match each response == petSchema",
            "* match response[*] == petSchema"
        ],
        2,
        "`match each` iterates through the array and ensures every single element adheres to the specified schema, which is perfect for validating large lists of objects.",
        "Schema Validation"
    );

    addMCQ(
        "What is the difference between setting headers via `karate.configure('headers', {...})` versus the `header` keyword?",
        "// A\n* configure headers = { Authorization: 'Bearer token' }\n\n// B\n* header Authorization = 'Bearer token'",
        [
            "A sets it globally for all subsequent requests in the JVM; B sets it only for the current feature.",
            "A sets it for all subsequent requests in the scenario; B sets it ONLY for the immediate next HTTP request.",
            "There is no difference, both set headers for the current scenario.",
            "B is deprecated in Karate v1.0+"
        ],
        1,
        "`configure headers` applies the headers to all HTTP calls that follow it in the context. The `header` keyword applies the header ONLY to the very next HTTP call (e.g., the next `method get`), and is then cleared.",
        "HTTP Headers"
    );

    addMCQ(
        "You want to validate that a timestamp strictly matches the ISO-8601 format (e.g., '2023-10-25T14:30:00Z'). Which matcher should you use?",
        null,
        [
            "#date",
            "#regex ^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$",
            "#string? _.length == 20",
            "#time"
        ],
        1,
        "Karate uses `#regex` for validating string patterns. The `^` and `$` anchor the regex to ensure the entire string matches the exact ISO-8601 layout.",
        "Fuzzy Matchers"
    );

    addMCQ(
        "When using `schemaUtils.merge(base, override)`, what happens if both the base and override schemas contain the same key?",
        "var base = { status: '#string' }\nvar override = { status: '#number' }",
        [
            "It throws a merge conflict error.",
            "The base schema wins (`#string`).",
            "The override schema wins (`#number`).",
            "It creates an array: `status: ['#string', '#number']`"
        ],
        2,
        "In a shallow merge, properties from the override object overwrite properties with the same keys in the base object. This is useful for creating strict schemas from relaxed base ones.",
        "Schema Utils"
    );

    addMCQ(
        "How many times does the `Background:` block execute in a feature file?",
        "Background:\n  * def id = call uuid\n\nScenario: One\n...\nScenario: Two\n...",
        [
            "Once per feature file, before the first scenario.",
            "Before every single `Scenario:` and `Scenario Outline:` in the file.",
            "Only if explicitly called within a scenario.",
            "After `karate-config.js` but before parallel execution starts."
        ],
        1,
        "The `Background:` section executes entirely from top to bottom before EVERY `Scenario` or `Scenario Outline` iteration in the file, ensuring a fresh state.",
        "Karate Core Concepts"
    );

    addMCQ(
        "You need to verify if an unknown JSON payload is an Array or an Object. What is the correct way to do this in Karate?",
        "* def unknown = ...",
        [
            "* match unknown == '#array'",
            "* match karate.typeOf(unknown) == 'list'",
            "* match typeof unknown == 'array'",
            "* match unknown.length != undefined"
        ],
        1,
        "`karate.typeOf()` returns 'list' for JSON arrays and 'map' for JSON objects. Standard JS `typeof` returns 'object' for both, which is not helpful.",
        "Data Types"
    );

    addMCQ(
        "You want to generate a custom HTML report displaying SLA metrics at the end of a performance test scenario. Which function do you use?",
        "var html = '<h1>Performance Results</h1><p>P95: 120ms</p>';",
        [
            "karate.report(html)",
            "karate.log(html)",
            "karate.embed(html, 'text/html')",
            "karate.write(html, 'report.html')"
        ],
        2,
        "`karate.embed(content, mimeType)` injects arbitrary files or strings (like HTML, images, or JSON) directly into the generated Cucumber/Masterthought HTML report for that scenario.",
        "Custom Reporting"
    );

    addMCQ(
        "In a Karate Mock Server feature, what is the difference between `pathMatches('/api/pets')` and `pathStartsWith('/api/pets')`?",
        null,
        [
            "`pathMatches` requires an exact match; `pathStartsWith` acts as a wildcard prefix.",
            "`pathMatches` supports `{id}` variables; `pathStartsWith` does not.",
            "There is no difference, they are aliases.",
            "Both A and B are true."
        ],
        3,
        "`pathMatches('/api/pets/{id}')` supports path parameter extraction into the `pathParams` object and requires a strict pattern match. `pathStartsWith` simply checks the URL prefix and is useful for catch-all proxying.",
        "Mock Server Routing"
    );

    addMCQ(
        "What happens to variables defined via `def` inside a feature file that is invoked using the `call` keyword?",
        "* def result = call read('helper.feature')",
        [
            "They are isolated and completely inaccessible to the calling feature.",
            "They are returned as properties on the resulting object (e.g., `result.myVar`).",
            "They overwrite variables in the calling feature globally.",
            "They trigger an error if the calling feature has a variable with the same name."
        ],
        1,
        "When you `call` a feature, all variables created inside it are collected into a JSON object and returned to the caller. This is how you pass data back from helper features.",
        "Feature Calls"
    );

    addMCQ(
        "You need to filter an array of users to find all active admins. Which is the correct usage of `karate.filter`?",
        "* def users = [{role: 'admin', active: true}, {role: 'user', active: true}]",
        [
            "* def admins = karate.filter(users, function(x){ return x.role == 'admin' && x.active })",
            "* def admins = users.filter(x => x.role == 'admin')",
            "* def admins = karate.filter(users, '$.role == \"admin\"')",
            "* def admins = karate.map(users, function(x){ return x.role == 'admin' })"
        ],
        0,
        "`karate.filter(array, function)` evaluates the javascript function against every element. Standard JS array methods like `.filter()` do not work reliably on Karate Java Lists under the hood, and `karate.map` is for transformations, not filtering.",
        "JavaScript Interop"
    );

    addMCQ(
        "A `Scenario Outline` has 100 rows in the `Examples` table. How many times does the `Background:` block run?",
        "Background:\n  * def token = callonce read('auth.feature')\n\nScenario Outline: test <id>\n  * match id == '#number'\n  Examples:\n    | id  |\n    | ... | (100 rows)",
        [
            "Once — `callonce` prevents repetition.",
            "Twice — once before the first scenario, once before the last.",
            "100 times — once before each Scenario Outline iteration.",
            "0 times — the `Background:` only runs for plain `Scenario:` blocks."
        ],
        2,
        "The `Background:` runs before EVERY scenario iteration, including all 100 Scenario Outline rows. The `callonce` inside only caches within that feature execution, but the block itself still executes 100 times.",
        "Karate Core Concepts"
    );

    addMCQ(
        "Your test creates a pet and stores its ID in `createdId`. The test then fails unexpectedly mid-scenario. The pet is never deleted. What pattern prevents this resource leak?",
        "* def created = call read('create.feature')\n* def createdId = created.id\n# ... test fails here ...\n* call read('delete.feature') { id: #(createdId) }",
        [
            "Use `try/catch` in JavaScript to wrap the test logic.",
            "Use `configure afterScenario` to register a cleanup function before creation.",
            "Use `callonce` for deletion so it always fires.",
            "The test runner automatically rolls back test data on failure."
        ],
        1,
        "`configure afterScenario` registers a cleanup hook that fires regardless of whether the scenario passes or fails. By defining it BEFORE the resource is created, you guarantee cleanup even on unexpected failures.",
        "Test Data Management"
    );

    addMCQ(
        "You have `* def x = 5`. You then use `* eval x = 10`. What is the value of `x`?",
        "* def x = 5\n* eval x = 10\n* match x == ???",
        [
            "5 — `def` variables are immutable once set.",
            "10 — `eval` mutates the existing variable.",
            "null — `eval` does not set variables, only runs expressions.",
            "This causes a compile error in Karate."
        ],
        1,
        "`eval` executes a JavaScript expression in the current scope. Assigning to an existing variable with `eval` mutates it. `def` simply declares a new variable (or re-declares it if the name already exists).",
        "Variable Scope"
    );

    addMCQ(
        "What is the correct way to pass an argument to a called feature file?",
        "// goal: pass petId = 42 to 'get-pet.feature'\n// Which call syntax is correct?",
        [
            "* call read('get-pet.feature') petId",
            "* call read('get-pet.feature') { petId: 42 }",
            "* call read('get-pet.feature'), 42",
            "* call read('get-pet.feature@getPet') (petId: 42)"
        ],
        1,
        "Arguments to a called feature must be passed as a JSON object (`{ key: value }`). Inside the called feature, the passed keys become available as variables (e.g., `petId` is accessible directly).",
        "Feature Calls"
    );

    addMCQ(
        "A test runner uses `Runner.path('classpath:features').tags('@smoke').parallel(5)`. Your feature has BOTH `@smoke` and `@slow` tags. Does it run?",
        "@smoke @slow\nScenario: critical path with delay\n  ...",
        [
            "Yes — `@smoke` matches the tag filter.",
            "No — the scenario has two tags, which causes ambiguity.",
            "Only if `@slow` is also listed in the `.tags()` call.",
            "It depends on the `karate.env` setting."
        ],
        0,
        "Tag filters are inclusive by default. `.tags('@smoke')` means 'run scenarios that HAVE the @smoke tag'. A scenario with both `@smoke` and `@slow` still qualifies because it has `@smoke`. To exclude `@slow`, you would add `.tags('~@slow')`.",
        "Tag-Based Filtering"
    );

    addMCQ(
        "Which of the following is NOT a valid way to read external data in Karate?",
        null,
        [
            "* def data = read('classpath:data/users.json')",
            "* def data = read('classpath:data/config.yaml')",
            "* def data = read('classpath:data/records.csv')",
            "* def data = read('classpath:data/payload.xml') as json"
        ],
        3,
        "`read()` automatically detects and parses JSON, YAML, CSV, JS, and XML based on file extension. There is no `as json` conversion syntax — if you read an XML file, it becomes an XML object automatically, not JSON.",
        "File I/O"
    );

    addMCQ(
        "What does `* configure connectTimeout = 5000` do?",
        null,
        [
            "Sets the maximum time (ms) a request body can take to upload.",
            "Sets the maximum time (ms) to wait to establish an HTTP connection.",
            "Sets the maximum time (ms) to wait for the full response to arrive after connecting.",
            "Sets the maximum time (ms) before a retry attempt is triggered."
        ],
        1,
        "`connectTimeout` controls how long Karate will wait for the TCP/HTTP connection to be established. `readTimeout` separately controls how long Karate waits for the server to send a response after connecting. Both default to 30 seconds.",
        "Configuration"
    );

    addMCQ(
        "Spot the bug: the following parallel runner generates no Masterthought report. Why?",
        "Results results = Runner\n  .path('classpath:features')\n  .parallel(5);\nassertEquals(0, results.getFailCount());",
        [
            "`.parallel(5)` is too many threads for Masterthought.",
            "`.outputCucumberJson(true)` is missing, so no JSON files are generated for the report.",
            "`assertEquals` should come before `.parallel(5)`.",
            "The path should be `classpath:features/*.feature`, not a directory."
        ],
        1,
        "Masterthought (and other Cucumber report tools) require Cucumber-compatible JSON output files. You must explicitly enable this with `.outputCucumberJson(true)` on the Runner chain. Without it, no JSON files are generated and `generateReport()` has nothing to process.",
        "CI/CD & Reporting"
    );

    addMCQ(
        "You need to assert a response field is a positive integer greater than 0. Which is the most concise correct matcher?",
        "* def response = { petId: 42 }",
        [
            "* match response.petId == '#number'",
            "* match response.petId == '#? _ > 0'",
            "* assert response.petId > 0",
            "Both B and C are correct."
        ],
        3,
        "Both `#? _ > 0` (inline fuzzy expression) and `assert` (standalone JS boolean check) correctly validate that `petId` is positive. `#number` alone does not verify the sign — it only checks the type.",
        "API Assertions"
    );

    addMCQ(
        "What is the key difference between `karate.callSingle()` and `callonce`?",
        null,
        [
            "`callonce` caches across all features in the JVM; `karate.callSingle()` caches per-feature.",
            "`karate.callSingle()` caches the result for the entire JVM run (across all threads and features); `callonce` caches only within a single feature file.",
            "They are identical — `callonce` is just syntactic sugar for `karate.callSingle()`.",
            "`karate.callSingle()` can only be used in `karate-config.js`; `callonce` works anywhere."
        ],
        1,
        "`karate.callSingle()` is the most powerful caching mechanism — the result is shared across all features and parallel threads for the entire JVM session. `callonce` is scoped only to the feature file it appears in. Use `karate.callSingle()` in `karate-config.js` for auth tokens.",
        "Performance & Parallel Execution"
    );

    addMCQ(
        "You have a JSON response and want to extract only the `id` field from each object. Which is correct?",
        "* def pets = [{id: 1, name: 'A'}, {id: 2, name: 'B'}]",
        [
            "* def ids = pets.id",
            "* def ids = karate.jsonPath(pets, '$[*].id')",
            "* def ids = pets[*].id",
            "* def ids = karate.map(pets, 'id')"
        ],
        1,
        "`karate.jsonPath(object, expression)` evaluates a JSONPath expression and returns the result. `$[*].id` plucks the `id` field from every element in the root array. `karate.map()` requires a function, not a field name string.",
        "JSONPath & Data Extraction"
    );

    addMCQ(
        "Your CI pipeline runs `mvn test -Psmoke`. The `smoke` Maven profile is defined but the `SmokeRunner.java` class is inside `src/main/java` instead of `src/test/java`. What happens?",
        null,
        [
            "Maven finds it automatically since it scans all source directories.",
            "The tests run normally but reports are placed in `main/` output.",
            "Maven's Surefire plugin will NOT discover the runner because it only scans `src/test/java` by default.",
            "The runner runs but Karate cannot find feature files."
        ],
        2,
        "Maven Surefire (which executes JUnit tests) only scans `src/test/java` by default. A runner class placed in `src/main/java` is invisible to Surefire and will never be executed by `mvn test`, regardless of the Maven profile.",
        "Maven & Project Structure"
    );

    addMCQ(
        "You have a feature file with 3 scenarios. Scenario 2 sets `* def sharedData = 'hello'`. Can Scenario 3 read `sharedData`?",
        "Scenario: One\n  * def x = 1\n\nScenario: Two\n  * def sharedData = 'hello'\n\nScenario: Three\n  * match sharedData == 'hello'   # ??",
        [
            "Yes — variables are shared within the same feature file.",
            "Yes — but only if using `callonce`.",
            "No — each Scenario gets a completely fresh variable scope.",
            "Only if `sharedData` is defined in the `Background:` block."
        ],
        2,
        "Each `Scenario` in Karate runs in complete isolation with its own variable scope. Variables defined in Scenario 2 are NOT visible in Scenario 3. Use `Background:` or `callonce` to share setup data across scenarios in the same file.",
        "Variable Scope & Isolation"
    );

    addMCQ(
        "You make a GET request and the server returns `Content-Type: application/xml`. What does `response` contain in Karate?",
        "Given url 'https://api.example.com/data'\nWhen method get\nThen status 200\n# response is now...?",
        [
            "A raw string — Karate never auto-parses XML.",
            "An XML object — Karate auto-parses it based on Content-Type.",
            "A JSON object — Karate always converts XML to JSON.",
            "null — you must explicitly call `karate.fromString(responseString)`."
        ],
        1,
        "Karate inspects the `Content-Type` header. For `application/xml` or `text/xml`, it automatically parses the response body into an XML object. You can then use XPath-style paths like `response/root/element` to navigate it.",
        "Response Handling"
    );

    addMCQ(
        "What is the purpose of the `@ignore` tag in Karate?",
        "@ignore\nScenario: This scenario is work in progress\n  * match 1 == 2",
        [
            "It marks the scenario as expected-to-fail (like xfail in pytest).",
            "It completely skips the scenario from execution by all runners.",
            "It still executes but suppresses the failure from the final report.",
            "It is a Karate convention only — it has no built-in effect unless filtered."
        ],
        1,
        "The `@ignore` tag is a Karate convention with built-in support. The default `Runner` automatically excludes scenarios tagged `@ignore` when using `.tags('~@ignore')`, which is the recommended pattern in all runner classes.",
        "Tags & Execution Control"
    );

    addMCQ(
        "You want to assert that a JSON field `price` is a number BETWEEN 10 and 100 inclusive. Which is correct?",
        "* def response = { price: 55 }",
        [
            "* match response.price == '#number? _ >= 10 && _ <= 100'",
            "* match response.price between 10 and 100",
            "* assert response.price >= 10 && response.price <= 100",
            "Both A and C are valid."
        ],
        3,
        "Both approaches work. `#? expression` is a fuzzy inline assertion that can contain any JS truthy expression using `_` as the value. `assert` is a standalone JS expression check. Both correctly validate the range.",
        "Advanced Assertions"
    );

    addMCQ(
        "In a parallel test run with 5 threads, two scenarios both try to create a pet with `id: 9999`. What is the likely outcome?",
        "// Thread 1 and Thread 2 both run:\n* def payload = { id: 9999, name: 'Test' }\nGiven path 'pet'\nAnd request payload\nWhen method post\nThen status 200",
        [
            "Karate handles thread safety automatically — no issue.",
            "One thread will create the pet, the other will get a 409 Conflict or overwrite it, causing potential false failures.",
            "Both scenarios fail because parallel threads share a global variable lock on `payload`.",
            "Karate queues parallel requests, so only one runs at a time anyway."
        ],
        1,
        "Parallel threads run fully independently with no coordination. If two scenarios use the same hardcoded ID, they can interfere on the server side (conflict, overwrite, or race conditions). Always use unique IDs per thread using `call uniqueId` or `java.util.UUID.randomUUID()`.",
        "Parallel Execution & Test Isolation"
    );

    addMCQ(
        "You want to verify that a DELETE request returns either 200 OR 204. Which assertion handles this correctly?",
        "Given path 'pet', petId\nWhen method delete\nThen ???",
        [
            "Then status 200 or 204",
            "* match responseStatus == 200 || responseStatus == 204",
            "Then status 200\nAnd match responseStatus <= 204",
            "Then match status in [200, 204]"
        ],
        1,
        "`Then status` only accepts a single integer literal. To accept multiple valid status codes, use `* match responseStatus == 200 || responseStatus == 204` after the `method` step, which uses JavaScript boolean logic.",
        "HTTP Status Validation"
    );

    addMCQ(
        "You call a mock server scenario for `POST /pet`. The mock scenario sets `* def response = { id: 1 }`. How does the client receive this?",
        "// Mock feature:\nScenario: pathMatches('/pet') && methodIs('post')\n  * def response = { id: 1 }\n  * def responseStatus = 201",
        [
            "The client receives the raw variable as a Java object, not JSON.",
            "The client receives `{ id: 1 }` as JSON with HTTP 201.",
            "You must also set `* def responseBody = karate.toString(response)`.",
            "The mock only works if `responseStatus` is set to 200."
        ],
        1,
        "In a Karate mock server, setting `* def response = <json>` and `* def responseStatus = <code>` are the two magic variable names the Netty server looks for. It automatically serializes `response` to JSON and sends it with the specified status code.",
        "Mock Server Internals"
    );

    addMCQ(
        "A scenario uses `configure ssl = true`. What does this do?",
        null,
        [
            "Enables HTTPS for all requests — without this, Karate only supports HTTP.",
            "Disables SSL certificate validation, allowing self-signed certificates.",
            "Forces TLS 1.3 for all connections.",
            "Automatically redirects HTTP requests to HTTPS."
        ],
        1,
        "`configure ssl = true` tells Karate's HTTP client to trust ALL SSL certificates, including self-signed and expired ones. This is essential for testing against local dev environments or internal staging servers that use self-signed certs.",
        "SSL & Security"
    );

    addMCQ(
        "You need to build a request URL dynamically. Which approach is safest and most idiomatic?",
        "* def petId = 42\n* def status = 'available dogs'",
        [
            "Given url 'https://api.com/pet/' + petId + '?status=' + status",
            "Given url 'https://api.com'\nAnd path 'pet', petId\nAnd param status = status",
            "Given url 'https://api.com/pet/#(petId)?status=#(status)'",
            "Given url 'https://api.com/pet/#{petId}?status=#{status}'"
        ],
        1,
        "Using `path` and `param` is the safest approach — Karate automatically handles URL encoding, forward slash insertion, and special character escaping. String concatenation (Option A) can produce malformed URLs if values contain spaces or special characters.",
        "URL Construction"
    );

    addMCQ(
        "After `mvn test`, where are the Karate HTML reports generated by default?",
        null,
        [
            "In the project root under `/reports`",
            "In `src/test/resources/reports`",
            "In `target/karate-reports`",
            "In `target/surefire-reports`"
        ],
        2,
        "Karate generates its own HTML reports in `target/karate-reports/`. The Masterthought (Cucumber) reports go into `target/cucumber-html-reports/` if you call `generateReport()`. Surefire reports are for plain JUnit tests and are less detailed.",
        "Reporting & Artifacts"
    );

    addMCQ(
        "You want to run ONLY the scenarios inside a specific feature file section tagged `@createPet`. Which `call` syntax is correct?",
        "// In pet-crud.feature:\n@createPet\nScenario: create a pet\n  ...",
        [
            "* call read('pet-crud.feature') { tag: '@createPet' }",
            "* call read('pet-crud.feature@createPet')",
            "* call read('pet-crud.feature') '@createPet'",
            "* call read('pet-crud.feature#createPet')"
        ],
        1,
        "The `@tag` suffix syntax `read('file.feature@tagName')` is Karate's built-in way to invoke only scenarios with a specific tag within a called feature file. This is heavily used for reusable helper scenarios.",
        "Feature Tags & Targeted Calls"
    );

    addMCQ(
        "What is the output of `karate.sizeOf([1, 2, 3])` in Karate?",
        "* def arr = [1, 2, 3]\n* def len = karate.sizeOf(arr)\n* match len == ???",
        [
            "This throws an error — use `arr.length` instead.",
            "3",
            "null — `karate.sizeOf` only works on JSON objects, not arrays.",
            "'list' — it returns the type, not the size."
        ],
        1,
        "`karate.sizeOf(collection)` returns the number of elements in a List or the number of keys in a Map. For an array of 3 elements, it returns `3`. It's safer than `.length` which can be unreliable on Java Lists.",
        "JavaScript API"
    );

    addMCQ(
        "You need to send a multipart/form-data request (file upload). Which Karate keywords do you use?",
        "// Goal: Upload a file at '/upload' endpoint",
        [
            "And header Content-Type = 'multipart/form-data'\nAnd request { file: read('test.pdf') }",
            "And multipart file file = { read: 'classpath:test.pdf', filename: 'test.pdf', contentType: 'application/pdf' }\nWhen method post",
            "And request multipart({ file: 'test.pdf' })\nWhen method post",
            "And header Content-Type = 'application/octet-stream'\nAnd request read('classpath:test.pdf')"
        ],
        1,
        "Karate has dedicated `multipart file`, `multipart field`, and `multipart entity` keywords for multipart requests. Setting the Content-Type header manually is incorrect — Karate manages the multipart boundary automatically when you use these keywords.",
        "HTTP & Multipart"
    );

    addMCQ(
        "A test scenario must only run on the `staging` environment. What is the most Karate-idiomatic way to enforce this?",
        "// karate.env is set to 'dev' in this run",
        [
            "Add an `if` statement inside the test: `* if (karate.env != 'staging') throw 'wrong env'`",
            "Use a Maven profile that sets `-Dkarate.env=staging` and add `@staging` tag to the scenario, then filter by tag in the runner.",
            "Wrap the whole scenario in `eval if (karate.env == 'staging') { ... }`",
            "Use `* configure abort = (karate.env != 'staging')` at the top of the scenario."
        ],
        1,
        "The most robust approach is to tag environment-specific scenarios (e.g., `@staging`) and create a dedicated runner or CI job that filters by that tag AND sets `-Dkarate.env=staging`. This keeps test logic clean and aligns with the CI pipeline.",
        "Environment Management"
    );

    addMCQ(
        "You have a response with a deeply nested field: `response.data.user.address.city`. The intermediate fields `data`, `user`, and `address` may or may not be present. What matcher safely handles this?",
        "* def response = { data: null }",
        [
            "* match response.data.user.address.city == '##string'",
            "* match response..city == '##string'",
            "* def city = response.data?.user?.address?.city\n* match city == '##string'",
            "* match response == '##deep'"
        ],
        2,
        "JavaScript optional chaining `?.` safely short-circuits to `undefined` when intermediate objects are null. After extracting with `def`, using `##string` allows the value to be null or absent. Direct deep dot-notation on a null intermediate throws a NullPointerException.",
        "Defensive Assertions"
    );

    addMCQ(
        "What does `* url 'https://api.com'` do differently from `* def baseUrl = 'https://api.com'`?",
        "// Option A:\n* url 'https://api.com'\n\n// Option B:\n* def baseUrl = 'https://api.com'",
        [
            "Nothing — both are equivalent ways to set the base URL.",
            "`url` sets the HTTP base URL that Karate will prepend to all subsequent `path` calls; `def` just stores a string variable.",
            "`url` only works in `Background:` blocks; `def` works anywhere.",
            "`url` must always be a full URL including path; `def` allows relative paths."
        ],
        1,
        "The `url` keyword (or `Given url`) sets the active HTTP URL context that Karate uses for the next request. `def` simply creates a variable holding a string — Karate won't use it for HTTP unless you explicitly reference it via `Given url baseUrl`.",
        "URL & Request Configuration"
    );

    addMCQ(
        "Which of the following correctly aborts the scenario without failing it, but ONLY when running in production?",
        "* def env = karate.env",
        [
            "* if (env == 'prod') throw new Error('skip')",
            "* eval if (env == 'prod') karate.abort()",
            "* configure abort = (env == 'prod')",
            "* match env != 'prod'"
        ],
        1,
        "`karate.abort()` inside an `eval if` block gracefully stops the scenario and marks it as Passed. This is the correct pattern for environment-aware conditional skipping without introducing test failures.",
        "Execution Control"
    );

    addMCQ(
        "You want to assert that NONE of the pets in a response array have the status 'sold'. Which is the correct approach?",
        "* def pets = [{name:'A', status:'available'}, {name:'B', status:'sold'}]",
        [
            "* match pets !contains { status: 'sold' }",
            "* def soldPets = karate.filter(pets, function(p){ return p.status == 'sold' })\n* match soldPets == []",
            "* match each pets != { status: 'sold' }",
            "* assert pets.every(p => p.status != 'sold')"
        ],
        1,
        "Filtering with `karate.filter` and then asserting the result is an empty list `[]` is the most readable approach. `match !contains` is not valid Karate syntax. `match each !=` doesn't work as expected because `!=` on objects compares identity. Standard JS `.every()` can be unreliable on Java Lists.",
        "Array Validation Patterns"
    );

    addMCQ(
        "In a feature called with `* def result = call read('helper.feature') { id: 42 }`, how do you access the variable `createdName` that was set inside `helper.feature`?",
        "// Inside helper.feature:\n* def createdName = 'Buddy'",
        [
            "* match createdName == 'Buddy'  // directly accessible",
            "* match result.createdName == 'Buddy'",
            "* match result['createdName'] == 'Buddy'",
            "Both B and C work — they are equivalent."
        ],
        3,
        "When a feature is invoked via `call`, all its `def` variables are returned as a JSON map. You access them via `result.variableName` (dot notation) or `result['variableName']` (bracket notation). Both are functionally identical in Karate.",
        "Feature Return Values"
    );

    addMCQ(
        "You define `* configure charset = null` in your scenario. What effect does this have?",
        null,
        [
            "Karate sends requests with no character encoding header at all.",
            "Karate disables UTF-8 encoding and falls back to ASCII.",
            "Karate stops appending '; charset=UTF-8' to the Content-Type header.",
            "This is invalid — `charset` cannot be set to null."
        ],
        2,
        "By default, Karate appends `; charset=UTF-8` to the Content-Type header (e.g., `application/json; charset=UTF-8`). Setting `configure charset = null` removes this suffix, which is sometimes required by strict APIs that reject the extra charset parameter.",
        "HTTP Configuration Gotchas"
    );

    addMCQ(
        "You have `* def items = [1, 2, 3]` and you do `* def items = [4, 5, 6]`. What is the final value of `items`?",
        "* def items = [1, 2, 3]\n* def items = [4, 5, 6]\n* match items == ???",
        [
            "[1, 2, 3, 4, 5, 6] — `def` appends to arrays.",
            "This throws a 'variable already defined' error.",
            "[4, 5, 6] — `def` re-declares and replaces the previous value.",
            "[1, 2, 3] — the second `def` is silently ignored."
        ],
        2,
        "`def` in Karate is not truly 'declare' — it both declares AND assigns. Re-defining a variable with `def` simply replaces its value. There is no immutability or error for re-definition.",
        "Variable Re-definition"
    );

    addMCQ(
        "A scenario is tagged `@flaky`. You want your nightly regression runner to SKIP flaky tests but your weekly full-suite runner to INCLUDE them. How do you configure this?",
        null,
        [
            "Use `* configure skip = true` inside each @flaky scenario.",
            "Nightly runner: `.tags('~@flaky')` | Weekly runner: no `~@flaky` exclusion.",
            "Create a `flaky.properties` file that controls execution.",
            "Tag flaky tests with `@ignore` for nightly and remove for weekly."
        ],
        1,
        "Tag-based filtering at the runner level is the correct approach. The nightly runner adds `.tags('~@flaky')` to exclude flaky scenarios. The weekly full-suite runner omits this filter, naturally including everything. No changes to the feature files needed.",
        "CI/CD Strategy"
    );

    addMCQ(
        "What is the result of `* def x = { a: 1 }` followed by `* set x.b = 2`?",
        "* def x = { a: 1 }\n* set x.b = 2\n* match x == ???",
        [
            "{ a: 1 } — `set` creates a separate variable, not modifying `x`.",
            "{ a: 1, b: 2 } — `set` mutates the JSON object in-place.",
            "This throws an error — `set` only works on string variables.",
            "{ b: 2 } — `set` replaces the entire object."
        ],
        1,
        "The `set` keyword mutates a JSON object by adding or updating a field path. After `set x.b = 2`, the object `x` has both fields: `{ a: 1, b: 2 }`. This is how you build up request payloads dynamically.",
        "JSON Mutation"
    );

    addMCQ(
        "A performance test collects 100 response times. You need to find the 95th percentile (P95). Which `helpers.percentile()` call is correct?",
        "* def times = [/* 100 numbers */]\n* def p95 = helpers.percentile(times, ???)",
        [
            "helpers.percentile(times, 0.95)",
            "helpers.percentile(times, 95)",
            "helpers.percentile(times, '95th')",
            "helpers.percentile(95, times)"
        ],
        1,
        "The custom `helpers.percentile(array, N)` function in this framework expects `N` as the percentile number (e.g., `95` for P95, `99` for P99). `0.95` would be treated as a tiny sub-1st percentile value, giving a completely wrong result.",
        "Performance Testing"
    );

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
    add(++id, 'Custom Java Authentication Provider', 'java',
        '// You can write a custom Java class to generate tokens\n' +
        'package com.example.auth;\n' +
        'public class TokenProvider {\n' +
        '    public static String getToken(String secret) {\n' +
        '        return "Bearer " + java.util.Base64.getEncoder().encodeToString(secret.getBytes());\n' +
        '    }\n' +
        '}\n' +
        '\n' +
        '// In Karate:\n' +
        '* def AuthGen = Java.type("com.example.auth.TokenProvider")\n' +
        '* def token = AuthGen.getToken("my-secret")\n' +
        '* match token == "Bearer bXktc2VjcmV0"',
        'When standard authentication methods are too complex or use proprietary algorithms, writing a small Java utility and invoking it from Karate is the cleanest solution.',
        'Practice: Change the java class method to accept two parameters (clientId and secret) and update the Karate call.',
        'advanced',
        ['Update Java method: `public static String getToken(String id, String secret)`',
            'Update Karate call: `* def token = AuthGen.getToken("client123", "secret")`']
    );

    add(++id, 'Reading and Parsing CSV Files', 'gherkin',
        '# Karate automatically parses CSV files into a JSON array of objects\n' +
        '* def csvData = read("classpath:data/users.csv")\n' +
        '\n' +
        '# You can then use it in data-driven tests or assertions\n' +
        '* match csvData[0].username == "admin"\n' +
        '\n' +
        '# Or use karate.filter to find specific rows\n' +
        '* def admins = karate.filter(csvData, function(row){ return row.role == "admin" })\n' +
        '* match admins[0].username == "admin"',
        'CSV files are great for managing large sets of tabular test data. Karate parses them effortlessly into a list of JSON objects, where the first row becomes the keys.',
        'Practice: Write a `karate.map` to extract only the usernames from the CSV data into a new array.',
        'advanced',
        ['Use `* def usernames = karate.map(csvData, function(row){ return row.username })`',
            'This creates a flat array of strings',
            'Add an assertion: `* match usernames contains "admin"`']
    );

    add(++id, 'Mock Server: Simulating Delays and Errors', 'gherkin',
        '# In your mock server feature:\n' +
        'Scenario: pathMatches("/api/timeout")\n' +
        '  * def responseStatus = 200\n' +
        '  # Add a delay of 5 seconds to simulate a slow endpoint\n' +
        '  * def delay = function(ms) { java.lang.Thread.sleep(ms) }\n' +
        '  * eval delay(5000)\n' +
        '  * def response = { message: "Sorry for the wait!" }\n' +
        '\n' +
        'Scenario: pathMatches("/api/flakey")\n' +
        '  # Return 500 error 50% of the time\n' +
        '  * def isError = java.lang.Math.random() < 0.5\n' +
        '  * def responseStatus = isError ? 500 : 200\n' +
        '  * def response = isError ? { error: "Internal Error" } : { success: true }',
        'A good mock server shouldn\'t just return happy-path data. Simulating timeouts, latency, and intermittent failures allows you to test your client\'s retry logic and timeout configurations.',
        'Practice: Modify the flakey endpoint to only return an error on the FIRST call, then succeed on subsequent calls (Hint: use a global counter in the Background).',
        'advanced',
        ['In the `Background:` section, add `* def state = { calls: 0 }`',
            'In the scenario: `* eval state.calls++`',
            'Set status based on calls: `* def responseStatus = state.calls == 1 ? 500 : 200`']
    );

    // ─── NEW BASIC EXERCISES ─────────────────────────────────────────
    add(++id, 'Checking Response Headers', 'gherkin',
        '# The `responseHeaders` map contains all response headers\n' +
        'Given url \'https://httpbin.org/get\'\n' +
        'When method get\n' +
        'Then status 200\n' +
        '\n' +
        '# Check the Content-Type response header\n' +
        '* match responseHeaders[\'Content-Type\'][0] contains \'application/json\'\n' +
        '\n' +
        '# You can also check a specific header value\n' +
        '* def contentType = responseHeaders[\'Content-Type\'][0]\n' +
        '* print \'Content-Type is:\', contentType',
        'Every HTTP response includes headers. Karate exposes them via `responseHeaders` as a map where each key is a header name and each value is a LIST of strings (a header can appear multiple times).',
        'Practice: After the GET request, assert that the `Server` header exists and contains the string "gunicorn".',
        'basic',
        ['`responseHeaders` is a map — access values with bracket notation: `responseHeaders["Server"][0]`',
            'Use `contains` for partial matching: `match responseHeaders["Server"][0] contains "gunicorn"`',
            'Note the `[0]` — header values are always a list, even if only one value exists']
    );

    add(++id, 'Deleting a Resource (DELETE)', 'gherkin',
        '# Step 1: Create a resource\n' +
        'Given url \'https://petstore.swagger.io/v2/store/order\'\n' +
        'And request { petId: 1, quantity: 1, status: \'placed\', complete: true }\n' +
        'When method post\n' +
        'Then status 200\n' +
        '* def orderId = response.id\n' +
        '\n' +
        '# Step 2: Delete the resource using its ID\n' +
        'Given url \'https://petstore.swagger.io/v2/store/order/\' + orderId\n' +
        'When method delete\n' +
        'Then status 200\n' +
        '\n' +
        '# Step 3: Verify it is gone — expect 404\n' +
        'Given url \'https://petstore.swagger.io/v2/store/order/\' + orderId\n' +
        'When method get\n' +
        'Then status 404',
        'A complete Create → Delete → Verify-Deleted lifecycle. This pattern ensures you are truly testing the DELETE operation and not just getting a 200 on a resource that still exists.',
        'Practice: Refactor the URL construction to use `Given url baseUrl` + `And path "store", "order", orderId` instead of string concatenation.',
        'basic',
        ['Define `* def baseUrl = "https://petstore.swagger.io/v2"` in a Background block',
            'Replace the URL string with `Given url baseUrl` + `And path "store", "order", orderId`',
            'This is more idiomatic and handles URL encoding automatically']
    );

    add(++id, 'Updating a Resource (PUT)', 'gherkin',
        '# Create a pet first\n' +
        '* def petId = 10101\n' +
        'Given url \'https://petstore.swagger.io/v2/pet\'\n' +
        'And request { id: #(petId), name: \'OldName\', status: \'available\' }\n' +
        'When method post\n' +
        'Then status 200\n' +
        '\n' +
        '# Update the pet — PUT requires the full object\n' +
        'Given url \'https://petstore.swagger.io/v2/pet\'\n' +
        'And request { id: #(petId), name: \'NewName\', status: \'sold\' }\n' +
        'When method put\n' +
        'Then status 200\n' +
        '\n' +
        '# Verify the update was saved\n' +
        'Given url \'https://petstore.swagger.io/v2/pet\'\n' +
        'And path petId\n' +
        'When method get\n' +
        'Then status 200\n' +
        'And match response.name == \'NewName\'\n' +
        'And match response.status == \'sold\'',
        'PUT replaces the entire resource. Notice we must send ALL fields — only sending `name` without `status` would erase `status`. This is different from PATCH, which only updates specified fields.',
        'Practice: After the PUT, add an assertion that verifies the `id` is still the same as `petId`.',
        'basic',
        ['After the final GET, add: `And match response.id == petId`',
            'Note: `petId` is a number, so use `==` not `contains`',
            'This verifies the update did not accidentally change the resource ID']
    );

    // ─── NEW INTERMEDIATE EXERCISES ──────────────────────────────────
    add(++id, 'Multipart File Upload', 'gherkin',
        '# Sending a multipart/form-data request with a file\n' +
        'Given url \'https://httpbin.org/post\'\n' +
        '\n' +
        '# Attach a file from the classpath\n' +
        'And multipart file file = { read: \'classpath:data/sample.pdf\', filename: \'document.pdf\', contentType: \'application/pdf\' }\n' +
        '\n' +
        '# You can also attach form fields alongside the file\n' +
        'And multipart field uploadedBy = \'test-user\'\n' +
        'And multipart field category = \'documents\'\n' +
        '\n' +
        'When method post\n' +
        'Then status 200\n' +
        '# httpbin echoes the form data back in the response\n' +
        'And match response.files.file == \'#notnull\'',
        'Karate has dedicated `multipart file` and `multipart field` keywords that automatically set the correct Content-Type boundary. Never set `Content-Type: multipart/form-data` manually — Karate manages the boundary.',
        'Practice: Add a second file attachment using another `multipart file` line and assert both files appear in the response.',
        'intermediate',
        ['Add: `And multipart file image = { read: "classpath:data/photo.png", filename: "photo.png", contentType: "image/png" }`',
            'After the POST, assert: `And match response.files.image == "#notnull"`',
            'Both files will be part of the same multipart request body']
    );

    add(++id, 'OAuth2 Bearer Token Flow', 'gherkin',
        '# Step 1: Obtain an access token from the auth server\n' +
        'Given url \'https://auth.example.com/oauth/token\'\n' +
        'And form field grant_type = \'client_credentials\'\n' +
        'And form field client_id = \'my-client-id\'\n' +
        'And form field client_secret = \'my-client-secret\'\n' +
        'When method post\n' +
        'Then status 200\n' +
        '* def accessToken = response.access_token\n' +
        '* match accessToken == \'#string\'\n' +
        '\n' +
        '# Step 2: Use the token to call the protected API\n' +
        'Given url \'https://api.example.com/protected-resource\'\n' +
        'And header Authorization = \'Bearer \' + accessToken\n' +
        'When method get\n' +
        'Then status 200',
        'A real-world OAuth2 client credentials flow: fetch a token, then use it. In production Karate frameworks, the token fetch is done in `karate-config.js` using `karate.callSingle()` so all tests share one token.',
        'Practice: Refactor the token fetch to a separate `get-token.feature` file and call it using `callonce`.',
        'intermediate',
        ['Create `get-token.feature` with the POST to the auth server',
            'In your main feature: `* def tokenData = callonce read("get-token.feature")`',
            'Then use `tokenData.access_token` for the Authorization header']
    );

    add(++id, 'Asserting Against an External JSON Schema File', 'gherkin',
        '# Read a JSON schema from the classpath into a variable\n' +
        '* def petSchema = read(\'classpath:schemas/pet-schema.json\')\n' +
        '\n' +
        '# petSchema file contains:\n' +
        '# { "id": "#number", "name": "#string", "status": "##string", "tags": "##array" }\n' +
        '\n' +
        '# Make the API call\n' +
        'Given url \'https://petstore.swagger.io/v2/pet/1\'\n' +
        'When method get\n' +
        'Then status 200\n' +
        '\n' +
        '# Validate response strictly against the external schema\n' +
        '* match response == petSchema\n' +
        '\n' +
        '# For arrays of pets, validate each element\n' +
        '* def pets = [response]\n' +
        '* match each pets == petSchema',
        'Externalizing schemas into `.json` files makes them reusable across multiple feature files and allows non-technical team members to maintain the contract definitions. Karate`s `read()` works seamlessly with schema files.',
        'Practice: Add a new field `photoUrls` as `"##array"` to the schema file and see if the existing assertion still passes.',
        'intermediate',
        ['Add `"photoUrls": "##array"` to `classpath:schemas/pet-schema.json`',
            'The `##array` means the field is optional — so it passes if present or absent',
            'Run the test — the assertion should still pass because ##array allows null']
    );

    add(++id, 'Sending GraphQL Queries', 'gherkin',
        '# GraphQL uses POST with a JSON body containing the query string\n' +
        'Given url \'https://countries.trevorblades.com/graphql\'\n' +
        'And request\n' +
        '  """\n' +
        '  {\n' +
        '    "query": "{ countries { name code capital } }"\n' +
        '  }\n' +
        '  """\n' +
        'When method post\n' +
        'Then status 200\n' +
        '\n' +
        '# Response data is nested under response.data\n' +
        '* def countries = response.data.countries\n' +
        '* match countries == \'#array\'\n' +
        '* match countries[0] == { name: \'#string\', code: \'#string\', capital: \'##string\' }\n' +
        '\n' +
        '# Find a specific country using karate.filter\n' +
        '* def vietnam = karate.filter(countries, function(c){ return c.code == \'VN\' })\n' +
        '* match vietnam[0].name == \'Vietnam\'',
        'GraphQL is just a POST request with a JSON body containing a `query` string. Karate treats it like any other HTTP call — no special GraphQL library needed. The response is always under `response.data`.',
        'Practice: Add a `variables` field to the request body and write a parameterized query using `$code: String!`.',
        'intermediate',
        ['Add: `"variables": { "code": "VN" }` to the request JSON body',
            'Update query to: `"query": "query GetCountry($code: String!) { country(code: $code) { name capital } }"`',
            'This is the real-world way to avoid hardcoding values in GraphQL queries']
    );

    add(++id, 'Table-Driven Assertions with `match table`', 'gherkin',
        '# match table validates an array of objects against a table format\n' +
        '* def users = [\n' +
        '    { id: 1, role: \'admin\',  active: true  },\n' +
        '    { id: 2, role: \'user\',   active: true  },\n' +
        '    { id: 3, role: \'guest\',  active: false }\n' +
        '  ]\n' +
        '\n' +
        '# Instead of asserting each field manually, use match table\n' +
        '* match users[*].role == [\'admin\', \'user\', \'guest\']\n' +
        '\n' +
        '# Or validate specific extracted columns\n' +
        '* def activeFlags = karate.jsonPath(users, \'$[*].active\')\n' +
        '* match activeFlags == [true, true, false]\n' +
        '\n' +
        '# Count how many are active\n' +
        '* def activeUsers = karate.filter(users, function(u){ return u.active })\n' +
        '* match karate.sizeOf(activeUsers) == 2',
        'When a response returns a list, you often need to verify multiple fields across multiple objects. `match users[*].role` extracts all roles as an array for a clean ordered comparison. `karate.jsonPath` and `karate.filter` give you further processing power.',
        'Practice: Extract all user IDs using `karate.map` and assert they form an ascending sequence.',
        'intermediate',
        ['Use `karate.map(users, function(u){ return u.id })`',
            'This gives you `[1, 2, 3]`',
            'Assert with `* match ids == [1, 2, 3]`']
    );

    // ─── NEW ADVANCED EXERCISES ──────────────────────────────────────
    add(++id, 'Contract Testing — Consumer-Driven Schema Validation', 'gherkin',
        '# Base schema — the minimum contract all API versions must honour\n' +
        '* def baseSchema = { id: \'#number\', name: \'#string\' }\n' +
        '\n' +
        '# V1 contract — stricter, adds required status\n' +
        '* def v1Schema = karate.merge(baseSchema, { status: \'#string\' })\n' +
        '\n' +
        '# V2 contract — relaxes status (optional) and adds pagination\n' +
        '* def v2Schema = karate.merge(baseSchema, { status: \'##string\', page: \'##number\' })\n' +
        '\n' +
        '# Test against the API\n' +
        'Given url \'https://petstore.swagger.io/v2/pet/1\'\n' +
        'When method get\n' +
        'Then status 200\n' +
        '\n' +
        '# The response should always satisfy the base contract\n' +
        '* match response contains baseSchema\n' +
        '\n' +
        '# Programmatic validation — does NOT throw on failure\n' +
        '* def v1Result = karate.match(response, v1Schema)\n' +
        '* def v2Result = karate.match(response, v2Schema)\n' +
        '* print \'V1 passes:\', v1Result.pass, \'V2 passes:\', v2Result.pass',
        'Consumer-Driven Contract Testing verifies that producers honour the minimum schema their consumers depend on. Using `karate.merge` to compose schemas from a base ensures backwards compatibility. `karate.match()` lets you check multiple schemas without aborting on the first failure.',
        'Practice: Write a helper function `checkAllContracts(response, schemas)` that returns an array of `{schema, pass, message}` objects.',
        'advanced',
        ['Define: `* def checkAllContracts = function(resp, schemas){ var results = []; schemas.forEach(function(s){ var r = karate.match(resp, s); results.push({pass: r.pass, msg: r.message}); }); return results; }`',
            'Call it: `* def results = checkAllContracts(response, [baseSchema, v1Schema, v2Schema])`',
            'Assert: `* match each results == { pass: \'#boolean\', msg: \'##string\' }`']
    );

    add(++id, 'Dynamic Test Data Generation with Java UUID', 'gherkin',
        '# Use Java interop to generate truly unique IDs every test run\n' +
        '* def UUID = Java.type(\'java.util.UUID\')\n' +
        '* def Random = Java.type(\'java.util.Random\')\n' +
        '* def rng = new Random()\n' +
        '\n' +
        '# Generate unique identifiers\n' +
        '* def requestId = UUID.randomUUID().toString()\n' +
        '* def correlationId = \'TEST-\' + UUID.randomUUID().toString().substring(0, 8).toUpperCase()\n' +
        '* def randomPetId = Math.abs(rng.nextInt()) % 900000 + 100000\n' +
        '\n' +
        '* print \'Request ID:\', requestId\n' +
        '* print \'Correlation ID:\', correlationId\n' +
        '* print \'Pet ID:\', randomPetId\n' +
        '\n' +
        '# Use in the request with embedded expressions\n' +
        'Given url \'https://petstore.swagger.io/v2/pet\'\n' +
        'And header X-Request-Id = requestId\n' +
        'And header X-Correlation-Id = correlationId\n' +
        'And request { id: #(randomPetId), name: \'DynamicPet\', status: \'available\' }\n' +
        'When method post\n' +
        'Then status 200\n' +
        'And match response.id == randomPetId',
        'Never hardcode test IDs in parallel tests — two threads using the same ID will conflict on the server. `Java.type("java.util.UUID")` is the most reliable way to generate unique identifiers in Karate without external libraries.',
        'Practice: Extract this pattern into a `utils/generate-ids.feature` file with a named scenario `@generateIds`, and `callonce` it from the Background.',
        'advanced',
        ['Create the feature with: `@generateIds`, `Scenario: generate test IDs`, and define the UUID/correlationId variables',
            'In your Background: `* def ids = callonce read("utils/generate-ids.feature@generateIds")`',
            'Access via: `ids.requestId`, `ids.correlationId`, `ids.randomPetId`']
    );

    add(++id, 'Stateful Mock — Shopping Cart Simulation', 'gherkin',
        '# Mock server Background — in-memory cart per session\n' +
        'Background:\n' +
        '  * def carts = {}\n' +
        '\n' +
        '# POST /cart/:sessionId/add\n' +
        'Scenario: pathMatches(\'/cart/{sessionId}/add\') && methodIs(\'post\')\n' +
        '  * def sid = pathParams.sessionId\n' +
        '  * eval if (!carts[sid]) carts[sid] = []\n' +
        '  * eval carts[sid].push(request)\n' +
        '  * def responseStatus = 200\n' +
        '  * def response = { sessionId: #(sid), itemCount: #(carts[sid].length) }\n' +
        '\n' +
        '# GET /cart/:sessionId\n' +
        'Scenario: pathMatches(\'/cart/{sessionId}\') && methodIs(\'get\')\n' +
        '  * def sid = pathParams.sessionId\n' +
        '  * def responseStatus = carts[sid] ? 200 : 404\n' +
        '  * def response = carts[sid] ? { items: #(carts[sid]) } : { error: \'Cart not found\' }\n' +
        '\n' +
        '# DELETE /cart/:sessionId\n' +
        'Scenario: pathMatches(\'/cart/{sessionId}\') && methodIs(\'delete\')\n' +
        '  * def sid = pathParams.sessionId\n' +
        '  * eval delete carts[sid]\n' +
        '  * def responseStatus = 204',
        'A stateful mock that simulates a multi-session shopping cart. Each `sessionId` has its own cart that persists across requests within the same mock server instance. This pattern demonstrates how to model real stateful services for integration testing.',
        'Practice: Add a `DELETE /cart/:sessionId/items/:itemIndex` route that removes a specific item from the cart.',
        'advanced',
        ['Add a new Scenario: `pathMatches("/cart/{sessionId}/items/{itemIndex}") && methodIs("delete")`',
            'Get the index: `* def idx = pathParams.itemIndex`',
            'Remove: `* eval carts[pathParams.sessionId].splice(idx, 1)` then set responseStatus 200']
    );

    add(++id, 'WebSocket / Async API Testing with Polling', 'gherkin',
        '# Pattern: Submit an async job, then poll for completion\n' +
        '\n' +
        '# Step 1: Trigger the async job\n' +
        'Given url \'https://api.example.com/jobs\'\n' +
        'And request { type: \'data-export\', format: \'csv\' }\n' +
        'When method post\n' +
        'Then status 202  # Accepted — not yet complete\n' +
        '* def jobId = response.jobId\n' +
        '* print \'Job submitted:\', jobId\n' +
        '\n' +
        '# Step 2: Poll the status endpoint until the job is DONE\n' +
        '* configure retry = { count: 10, interval: 3000 }\n' +
        'Given url \'https://api.example.com/jobs\'\n' +
        'And path jobId\n' +
        'And retry until response.status == \'COMPLETED\'\n' +
        'When method get\n' +
        'Then status 200\n' +
        '* match response.status == \'COMPLETED\'\n' +
        '\n' +
        '# Step 3: Download the result\n' +
        'Given url response.downloadUrl\n' +
        'When method get\n' +
        'Then status 200\n' +
        '* match responseHeaders[\'Content-Type\'][0] contains \'text/csv\'',
        'Many modern APIs are asynchronous — they return 202 Accepted and process in the background. `retry until <condition>` is Karate\'s built-in polling mechanism, eliminating the need for manual sleep/loop logic.',
        'Practice: Add a timeout guard — if the job is still PENDING after 10 retries, call `karate.abort()` instead of failing.',
        'advanced',
        ['After the `retry until` block, add: `* eval if (response.status == "PENDING") karate.abort()`',
            'This gracefully aborts instead of crashing the test suite on a hung job',
            'The scenario will be marked as Passed (skipped) rather than Failed']
    );

    add(++id, 'Performance SLA Gating with Statistical Analysis', 'gherkin',
        '# Run N probe requests and collect response times\n' +
        '* def N = 20\n' +
        '* def inputs = (function(){ var a=[]; for(var i=0; i<N; i++) a.push({iter:i}); return a; })()\n' +
        '\n' +
        '# Each probe call returns an `elapsed` field\n' +
        '* def runs = call read(\'probe.feature@probe\') inputs\n' +
        '* def times = karate.map(runs, function(r){ return r.elapsed })\n' +
        '\n' +
        '# Calculate statistics\n' +
        '* def total = karate.reduce(times, function(acc, t){ return acc + t }, 0)\n' +
        '* def mean = total / N\n' +
        '* def sorted = times.slice().sort(function(a,b){ return a-b })\n' +
        '* def p50 = sorted[Math.floor(N * 0.50)]\n' +
        '* def p95 = sorted[Math.floor(N * 0.95)]\n' +
        '* def p99 = sorted[Math.floor(N * 0.99)]\n' +
        '\n' +
        '* print \'Mean:\', mean, \'ms | P50:\', p50, \'ms | P95:\', p95, \'ms | P99:\', p99, \'ms\'\n' +
        '\n' +
        '# SLA gates — these FAIL the test if thresholds are exceeded\n' +
        '* assert mean < 1000\n' +
        '* assert p95  < 3000\n' +
        '* assert p99  < 5000',
        'Performance testing inside Karate: collect N response times, calculate P50/P95/P99 using JavaScript array sorting, then gate the build using `assert`. This approach integrates performance checks directly into your functional test suite — no separate Gatling run needed for basic SLA validation.',
        'Practice: Calculate the standard deviation and add an `assert stddev < 500` gate.',
        'advanced',
        ['Variance = mean of squared differences: `var variance = karate.reduce(times, function(acc, t){ return acc + (t - mean)*(t - mean) }, 0) / N`',
            'Stddev = square root of variance: `var stddev = Math.sqrt(variance)`',
            'Add: `* assert stddev < 500` — a high stddev means inconsistent response times']
    );

    // ─── BATCH 4: BASIC ─────────────────────────────────────────────
    add(++id, 'Asserting Nested JSON Fields', 'gherkin',
        '# Access deeply nested JSON using dot notation\n' +
        '* def order = {\n' +
        '    id: 1001,\n' +
        '    customer: {\n' +
        '        name: "Alice",\n' +
        '        address: {\n' +
        '            city: "Hanoi",\n' +
        '            country: "VN"\n' +
        '        }\n' +
        '    },\n' +
        '    items: [{ sku: "A1", qty: 2 }, { sku: "B2", qty: 1 }]\n' +
        '  }\n' +
        '\n' +
        '# Navigate deeply with dot notation\n' +
        '* match order.customer.address.city == "Hanoi"\n' +
        '* match order.customer.address.country == "VN"\n' +
        '\n' +
        '# Access array elements by index\n' +
        '* match order.items[0].sku == "A1"\n' +
        '* match order.items[1].qty == 1\n' +
        '\n' +
        '# Get count of items in the array\n' +
        '* match order.items == "#[2]"',
        'Karate uses dot notation to navigate JSON objects and bracket notation with integers to index into arrays. The `#[N]` matcher checks that an array has exactly N elements.',
        'Practice: Add an assertion that `order.items[*].sku` contains both "A1" and "B2" (in any order).',
        'basic',
        ['Use: `* match order.items[*].sku contains ["A1", "B2"]`',
            '`[*]` is a wildcard that plucks the `sku` field from every element',
            '`contains` asserts the specified elements exist in the result (order-independent)']
    );

    add(++id, 'Reading External JSON Data File', 'gherkin',
        '# Karate can read JSON files from the classpath directly\n' +
        '# Assume classpath:data/pet-payload.json contains:\n' +
        '# { "id": 12345, "name": "Fluffy", "status": "available" }\n' +
        '\n' +
        '* def payload = read("classpath:data/pet-payload.json")\n' +
        '* match payload.name == "Fluffy"\n' +
        '* match payload == { id: 12345, name: "Fluffy", status: "available" }\n' +
        '\n' +
        '# Use the file data directly in a request\n' +
        'Given url "https://petstore.swagger.io/v2/pet"\n' +
        'And request payload\n' +
        'When method post\n' +
        'Then status 200\n' +
        'And match response.name == payload.name',
        'Externalizing test data into JSON files keeps feature files clean and makes payloads reusable. `read("classpath:...")` works for JSON, YAML, CSV, XML, JS, and plain text — Karate auto-detects the format.',
        'Practice: Modify `payload.name` after loading the file and verify the change propagates to the request.',
        'basic',
        ['After `* def payload = read(...)`, add: `* set payload.name = "NewName"`',
            'Then add an assertion: `And match response.name == "NewName"`',
            'Note: `set` mutates the JSON object in place — the file on disk is unchanged']
    );

    add(++id, 'Working with Query Parameters', 'gherkin',
        '# Use `param` to add query string parameters cleanly\n' +
        'Given url "https://petstore.swagger.io/v2/pet/findByStatus"\n' +
        'And param status = "available"\n' +
        'When method get\n' +
        'Then status 200\n' +
        '* match response == "#array"\n' +
        '\n' +
        '# Multiple params build into ?key1=val1&key2=val2\n' +
        'Given url "https://httpbin.org/get"\n' +
        'And param name = "Karate"\n' +
        'And param version = "1.4"\n' +
        'And param env = "test"\n' +
        'When method get\n' +
        'Then status 200\n' +
        '# httpbin echoes back the args\n' +
        'And match response.args.name == "Karate"\n' +
        'And match response.args.version == "1.4"',
        'The `param` keyword URL-encodes values automatically — no need to manually encode spaces as `%20`. This prevents common bugs from manual string concatenation like `url + "?status=" + status`.',
        'Practice: Add `And param tags = "sale friendly"` and verify the space is correctly encoded in the echoed URL.',
        'basic',
        ['Add: `And param tags = "sale friendly"` before `When method get`',
            'httpbin will echo it back as `response.args.tags == "sale friendly"`',
            'Karate handles the `%20` encoding automatically']
    );

    // ─── BATCH 4: INTERMEDIATE ────────────────────────────────────────
    add(++id, 'Chained API Calls — Order Workflow', 'gherkin',
        '# Real-world workflow: Create Pet → Create Order → Check Inventory\n' +
        '* def petId = 55501\n' +
        '\n' +
        '# Step 1: Create the pet\n' +
        'Given url "https://petstore.swagger.io/v2/pet"\n' +
        'And request { id: #(petId), name: "ChainPet", status: "available" }\n' +
        'When method post\n' +
        'Then status 200\n' +
        '\n' +
        '# Step 2: Place an order for the pet\n' +
        'Given url "https://petstore.swagger.io/v2/store/order"\n' +
        'And request { petId: #(petId), quantity: 1, status: "placed", complete: false }\n' +
        'When method post\n' +
        'Then status 200\n' +
        '* def orderId = response.id\n' +
        '* match response.petId == petId\n' +
        '* match response.status == "placed"\n' +
        '\n' +
        '# Step 3: Verify the order exists\n' +
        'Given url "https://petstore.swagger.io/v2/store/order"\n' +
        'And path orderId\n' +
        'When method get\n' +
        'Then status 200\n' +
        'And match response.id == orderId',
        'Real business workflows span multiple API endpoints. Chaining calls by passing response data (like `orderId`) forward is the foundation of integration testing. Each step validates its own contract before proceeding.',
        'Practice: Add a Step 4 that deletes the order and verifies a subsequent GET returns 404.',
        'intermediate',
        ['After Step 3, add `Given url "https://petstore.swagger.io/v2/store/order"` then `And path orderId`',
            'Use `When method delete` then `Then status 200`',
            'Then make another GET with the same orderId and assert `Then status 404`']
    );

    add(++id, 'Environment-Driven Configuration', 'javascript',
        '// In karate-config.js — runs once before every feature\n' +
        'function fn() {\n' +
        '  var env = karate.env || "dev";\n' +
        '\n' +
        '  var config = {\n' +
        '    dev: {\n' +
        '      baseUrl: "https://petstore.swagger.io/v2",\n' +
        '      apiKey: "dev-key-00000",\n' +
        '      timeout: 15000\n' +
        '    },\n' +
        '    staging: {\n' +
        '      baseUrl: "https://staging-api.petstore.com/v2",\n' +
        '      apiKey: "staging-key-11111",\n' +
        '      timeout: 10000\n' +
        '    },\n' +
        '    prod: {\n' +
        '      baseUrl: "https://api.petstore.com/v2",\n' +
        '      apiKey: "prod-key-22222",\n' +
        '      timeout: 5000\n' +
        '    }\n' +
        '  };\n' +
        '\n' +
        '  var settings = config[env] || config.dev;\n' +
        '\n' +
        '  karate.configure("connectTimeout", settings.timeout);\n' +
        '  karate.configure("readTimeout", settings.timeout);\n' +
        '\n' +
        '  return {\n' +
        '    baseUrl: settings.baseUrl,\n' +
        '    apiKey: settings.apiKey,\n' +
        '    env: env\n' +
        '  };\n' +
        '}',
        'A production-ready `karate-config.js` that supports multiple environments selected via `-Dkarate.env=staging`. All feature files receive `baseUrl`, `apiKey`, and `env` as global variables without any extra setup.',
        'Practice: Add a `qa` environment with its own URL, API key, and a 12 second timeout.',
        'intermediate',
        ['Add `qa: { baseUrl: "https://qa-api.petstore.com/v2", apiKey: "qa-key-33333", timeout: 12000 }` to the `config` map',
            'Run with: `mvn test -Dkarate.env=qa` — Karate will pick the `qa` block',
            'All feature files receive `baseUrl` and `apiKey` automatically as global vars']
    );

    add(++id, 'Running Scenarios in a Loop with `karate.repeat`', 'gherkin',
        '# Create 5 pets using a loop and collect their IDs\n' +
        '* def createdIds = []\n' +
        '\n' +
        '* def createPet = function(i) {\n' +
        '    var petId = 70000 + i;\n' +
        '    var res = karate.call("classpath:petstore/helpers/create-pet.feature",\n' +
        '                         { id: petId, name: "LoopPet-" + i, status: "available" });\n' +
        '    createdIds.push(petId);\n' +
        '    return res;\n' +
        '  }\n' +
        '\n' +
        '# karate.repeat executes the function N times\n' +
        '* def results = karate.repeat(5, createPet)\n' +
        '* match createdIds == "#[5]"\n' +
        '\n' +
        '# Verify all pets exist\n' +
        '* def verifyPet = function(id) {\n' +
        '    var r = karate.call("classpath:petstore/helpers/get-pet.feature", { id: id });\n' +
        '    return r.found;\n' +
        '  }\n' +
        '* def checks = karate.map(createdIds, verifyPet)\n' +
        '* match each checks == true',
        '`karate.repeat(N, fn)` calls a function N times passing the iteration index (0-based). This is cleaner than a JavaScript for-loop when you need to call feature files iteratively. Results are collected into an array.',
        'Practice: Add a cleanup loop after verification that deletes all created pets using `karate.map`.',
        'intermediate',
        ['Define: `* def deletePet = function(id) { karate.call("delete-pet.feature", { id: id }); return id; }`',
            'Run: `* def deleted = karate.map(createdIds, deletePet)`',
            'Assert: `* match deleted == createdIds` — all IDs were processed']
    );

    add(++id, 'Negative Testing — Validating Error Responses', 'gherkin',
        '# Always test what your API says when things go WRONG\n' +
        '\n' +
        '# 1. Missing required field — expect 400 Bad Request\n' +
        'Given url "https://petstore.swagger.io/v2/pet"\n' +
        'And request { status: "available" }  # missing required "name"\n' +
        'When method post\n' +
        '# Note: real APIs may return different codes — validate what yours actually returns\n' +
        'Then status 400\n' +
        'And match response.message contains "#string"\n' +
        '\n' +
        '# 2. Non-existent resource — expect 404\n' +
        'Given url "https://petstore.swagger.io/v2/pet/99999999999"\n' +
        'When method get\n' +
        'Then status 404\n' +
        'And match response.message contains "#string"\n' +
        '\n' +
        '# 3. Invalid data type — expect 4xx\n' +
        'Given url "https://petstore.swagger.io/v2/pet/abc"  # ID must be a number\n' +
        'When method get\n' +
        '* def code = responseStatus\n' +
        '* assert code >= 400 && code < 500',
        'Negative testing verifies your API gracefully handles bad inputs. A robust test suite covers error paths equally to happy paths. Note: some demo APIs (like Petstore) return unexpected codes — always validate against YOUR actual API behaviour.',
        'Practice: Add a test for an unauthorized request (no API key) and assert it returns 401 or 403.',
        'intermediate',
        ['Remove the `api_key` header using `configure headers = {}`',
            'Make a GET request and assert: `* def code = responseStatus`',
            '`* assert code == 401 || code == 403`']
    );

    add(++id, 'Parallel Feature Calling with `karate.map`', 'gherkin',
        '# karate.map over an array calls a function for each element\n' +
        '* def petIds = [1001, 1002, 1003, 1004, 1005]\n' +
        '\n' +
        '# Function that fetches a pet and returns key fields\n' +
        '* def fetchPet = function(id) {\n' +
        '    var r = karate.call(\n' +
        '        "classpath:petstore/helpers/get-pet.feature",\n' +
        '        { petId: id }\n' +
        '    );\n' +
        '    return { id: id, name: r.petName, found: r.found };\n' +
        '  }\n' +
        '\n' +
        '# Process all IDs — returns array of result objects\n' +
        '* def results = karate.map(petIds, fetchPet)\n' +
        '* match results == "#[5]"\n' +
        '\n' +
        '# Count how many were found\n' +
        '* def foundPets = karate.filter(results, function(r){ return r.found })\n' +
        '* print "Found", karate.sizeOf(foundPets), "of", karate.sizeOf(results), "pets"',
        '`karate.map(array, fn)` transforms every element using the function and returns a new array. Combining `map` (transform) with `filter` (select) gives you SQL-like data processing power inside your tests.',
        'Practice: Use `karate.reduce` to build a lookup map `{ petId: petName }` from the results array.',
        'intermediate',
        ['`* def lookup = karate.reduce(results, function(acc, r){ acc[r.id] = r.name; return acc; }, {})`',
            'Then: `* print lookup`',
            'Access by ID: `* match lookup[1001] == "#string"`']
    );

    // ─── BATCH 4: ADVANCED ───────────────────────────────────────────
    add(++id, 'JWT Token Decoding and Validation', 'javascript',
        '// Decode a JWT token (header + payload) without a library\n' +
        '// JWT format: base64Header.base64Payload.signature\n' +
        '\n' +
        '* def token = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyMTIzIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzAwMDAwMDAwfQ.signature"\n' +
        '\n' +
        '# Split the token into its three parts\n' +
        '* def parts = token.split(".")\n' +
        '* def Base64 = Java.type("java.util.Base64")\n' +
        '* def decoder = Base64.getDecoder()\n' +
        '\n' +
        '# Decode the payload (middle part)\n' +
        '* def payloadBytes = decoder.decode(parts[1])\n' +
        '* def payloadStr = new java.lang.String(payloadBytes, "UTF-8")\n' +
        '* def payload = karate.fromString(payloadStr)\n' +
        '\n' +
        '# Validate JWT claims\n' +
        '* match payload.sub == "user123"\n' +
        '* match payload.role == "admin"\n' +
        '* assert payload.exp > 0\n' +
        '* print "Token subject:", payload.sub, "| Role:", payload.role',
        'Using `Java.type("java.util.Base64")` you can decode JWT tokens without any third-party library. This is powerful for validating that your auth server embeds the correct claims in tokens before using them in downstream tests.',
        'Practice: Add an expiry check — assert the token is not expired by comparing `payload.exp` to the current time in seconds.',
        'advanced',
        ['Get current epoch: `* def now = java.lang.System.currentTimeMillis() / 1000`',
            'Assert: `* assert payload.exp > now`',
            'If `payload.exp < now`, the token is expired and your tests should fail']
    );

    add(++id, 'Request/Response Logging Interceptor Pattern', 'javascript',
        '// Add rich logging to every HTTP call using configure afterScenario\n' +
        '// and configure headers with dynamic timestamps\n' +
        '\n' +
        '// In karate-config.js:\n' +
        'karate.configure("headers", function() {\n' +
        '  return {\n' +
        '    "X-Request-Id":   java.util.UUID.randomUUID().toString(),\n' +
        '    "X-Timestamp":    new java.util.Date().toISOString(),\n' +
        '    "X-Test-Session": karate.properties["test.session"] || "local"\n' +
        '  };\n' +
        '});\n' +
        '\n' +
        '// In-scenario audit log\n' +
        '* def auditLog = []\n' +
        '* def logRequest = function(label) {\n' +
        '    auditLog.push({\n' +
        '        step:   label,\n' +
        '        status: responseStatus,\n' +
        '        time:   responseTime,\n' +
        '        url:    requestUrlBase\n' +
        '    });\n' +
        '  }\n' +
        '\n' +
        '// After each request, log it\n' +
        'Given url "https://petstore.swagger.io/v2/pet/1"\n' +
        'When method get\n' +
        'Then status 200\n' +
        '* logRequest("GET Pet 1")\n' +
        '\n' +
        '* print "Audit log:", auditLog',
        'Production-grade Karate frameworks add correlation IDs, timestamps, and audit trails to every request. The `configure headers` function runs before EACH HTTP call, injecting dynamic values. An in-scenario `auditLog` array lets you post-process timing and status data.',
        'Practice: At the end of the scenario, embed the auditLog as HTML into the report using `karate.embed`.',
        'advanced',
        ['Build an HTML table: `* def html = "<table>" + karate.map(auditLog, function(e){ return "<tr><td>" + e.step + "</td><td>" + e.status + "</td><td>" + e.time + "ms</td></tr>" }).join("") + "</table>"`',
            'Embed it: `* karate.embed(html, "text/html")`',
            'Open the Masterthought report and see the custom table inside the scenario']
    );

    add(++id, 'Database Seeding via Java JDBC', 'javascript',
        '// Direct database interaction from Karate using Java JDBC\n' +
        '// Useful for seeding test data that cannot be created via API\n' +
        '\n' +
        '* def DriverManager = Java.type("java.sql.DriverManager")\n' +
        '* def conn = DriverManager.getConnection(\n' +
        '    "jdbc:postgresql://localhost:5432/testdb",\n' +
        '    "testuser",\n' +
        '    "testpass"\n' +
        '  )\n' +
        '\n' +
        '# Seed a pet record directly into the database\n' +
        '* def stmt = conn.prepareStatement(\n' +
        '    "INSERT INTO pets (id, name, status) VALUES (?, ?, ?) ON CONFLICT DO NOTHING"\n' +
        '  )\n' +
        '* stmt.setInt(1, 99901)\n' +
        '* stmt.setString(2, "DBPet")\n' +
        '* stmt.setString(3, "available")\n' +
        '* stmt.executeUpdate()\n' +
        '* stmt.close()\n' +
        '\n' +
        '# Teardown — delete after test\n' +
        '* def cleanup = function() {\n' +
        '    var s = conn.prepareStatement("DELETE FROM pets WHERE id = ?")\n' +
        '    s.setInt(1, 99901)\n' +
        '    s.executeUpdate()\n' +
        '    s.close()\n' +
        '    conn.close()\n' +
        '  }\n' +
        '* configure afterScenario = cleanup',
        'When APIs do not expose data seeding endpoints, go directly to the database via JDBC. Karate`s Java interop makes this seamless. Always register cleanup via `configure afterScenario` before seeding so the data is deleted even on test failure.',
        'Practice: After seeding, make an API GET request for the pet and verify it returns the DB-seeded data.',
        'advanced',
        ['After the DB seed, add a GET: `Given url "https://api.petstore.com/v2/pet/99901"`',
            'Assert: `And match response.name == "DBPet"`',
            'This verifies the API layer reads from the same database you seeded']
    );

    add(++id, 'Custom Assertion Function Library', 'javascript',
        '// Build a reusable assertion library in a JS file\n' +
        '// File: classpath:helpers/assertions.js\n' +
        'function assertISODate(value) {\n' +
        '  var pattern = /^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z?)?$/;\n' +
        '  if (!pattern.test(value)) throw "Not a valid ISO date: " + value;\n' +
        '}\n' +
        '\n' +
        'function assertPositiveInt(value) {\n' +
        '  if (typeof value !== "number" || value <= 0 || value % 1 !== 0)\n' +
        '    throw "Expected positive integer, got: " + value;\n' +
        '}\n' +
        '\n' +
        'function assertNonEmptyString(value) {\n' +
        '  if (typeof value !== "string" || value.trim().length === 0)\n' +
        '    throw "Expected non-empty string, got: " + value;\n' +
        '}\n' +
        '\n' +
        '// In your feature file:\n' +
        '* def asserts = call read("classpath:helpers/assertions.js")\n' +
        '\n' +
        'Given url "https://petstore.swagger.io/v2/pet/1"\n' +
        'When method get\n' +
        'Then status 200\n' +
        '\n' +
        '* eval asserts.assertPositiveInt(response.id)\n' +
        '* eval asserts.assertNonEmptyString(response.name)',
        'Centralising complex validation logic into a JS helper file keeps feature files readable. Throwing a string from inside a JS function causes Karate to fail the step with your custom message — much clearer than a cryptic match failure.',
        'Practice: Add an `assertStatus` function that only accepts "available", "pending", or "sold".',
        'advanced',
        ['`function assertStatus(v) { var valid = ["available","pending","sold"]; if (valid.indexOf(v) < 0) throw "Invalid status: " + v; }`',
            'Call it: `* eval asserts.assertStatus(response.status)`',
            'Test with a hardcoded bad value: `* eval asserts.assertStatus("discontinued")` — should throw']
    );

    add(++id, 'CI/CD Matrix — Multi-Environment Smoke Runner', 'java',
        'import com.intuit.karate.Results;\n' +
        'import com.intuit.karate.Runner;\n' +
        'import org.junit.jupiter.params.ParameterizedTest;\n' +
        'import org.junit.jupiter.params.provider.ValueSource;\n' +
        'import static org.junit.jupiter.api.Assertions.assertEquals;\n' +
        '\n' +
        'class MultiEnvSmokeRunner {\n' +
        '\n' +
        '    // Run the same smoke suite against multiple environments\n' +
        '    @ParameterizedTest\n' +
        '    @ValueSource(strings = { "dev", "staging", "qa" })\n' +
        '    void runSmokeAgainstEnv(String env) {\n' +
        '        System.setProperty("karate.env", env);\n' +
        '\n' +
        '        Results results = Runner\n' +
        '            .path("classpath:petstore/features")\n' +
        '            .tags("@smoke")\n' +
        '            .outputCucumberJson(true)\n' +
        '            .parallel(3);\n' +
        '\n' +
        '        assertEquals(0, results.getFailCount(),\n' +
        '            "[" + env + "] " + results.getErrorMessages());\n' +
        '    }\n' +
        '}',
        'JUnit 5 `@ParameterizedTest` with `@ValueSource` runs the same test method multiple times with different arguments. This creates an environment matrix test — the same smoke suite runs against dev, staging, and qa in a single `mvn test` command.',
        'Practice: Add a "prod" environment to the `@ValueSource` list but gate it — skip prod if `System.getenv("ALLOW_PROD_TESTS")` is not set.',
        'advanced',
        ['Before setting karate.env, add: `if ("prod".equals(env) && System.getenv("ALLOW_PROD_TESTS") == null) { return; }`',
            'This prevents accidental prod runs unless the environment variable is explicitly set',
            'In GitHub Actions, add `env: ALLOW_PROD_TESTS: "true"` only to the nightly workflow']
    );

    // ─── BATCH 5: Based on real project patterns ─────────────────────
    add(++id, 'Using constants.js — Typed C.* References', 'gherkin',
        '# Load the shared constants file (already global via karate-config.js as C)\n' +
        '* def C = read("classpath:common/constants.js")\n' +
        '\n' +
        '# Use C.paths.* instead of hardcoding strings\n' +
        'Given url baseUrl\n' +
        'And path C.paths.PET_FIND_STATUS\n' +
        'And param status = C.petStatus.AVAILABLE\n' +
        'When method get\n' +
        'Then status 200\n' +
        '\n' +
        '# SLA assertion using typed constant — never hardcode ms values\n' +
        '* assert responseTime < C.sla.SLOW\n' +
        '\n' +
        '# Every element must have the correct status\n' +
        'And match each response contains { status: "#(C.petStatus.AVAILABLE)" }',
        'The `C` constants object from `common/constants.js` gives you typed, refactor-safe references to URLs, statuses, HTTP codes, and SLA thresholds. If a path changes, you update it in ONE place.',
        'Practice: Assert `Then status C.http.OK` — then check why that fails and fix it.',
        'basic',
        ['`Then status` only accepts an integer literal, NOT an expression like `C.http.OK`',
            'Fix: use `* match responseStatus == C.http.OK` AFTER the method step',
            'This is Gotcha #1 — status must be a literal integer']
    );

    add(++id, 'callSingle Auth Bootstrap Pattern', 'gherkin',
        '# This is what karate-config.js does once per JVM run:\n' +
        '# var session = karate.callSingle("classpath:petstore/helpers/auth.feature@auth", config)\n' +
        '\n' +
        '# Inside auth.feature the session object is built and returned:\n' +
        '# * def session = { apiKey: "#(apiKey)", env: "#(env)", bootstrappedAt: "...", validated: true }\n' +
        '\n' +
        '# In every feature, session is available as a global variable\n' +
        '* print "Session API key (first 4 chars):", session.apiKey.substring(0, 4) + "***"\n' +
        '* match session.validated == true\n' +
        '* match session.env == "#string"\n' +
        '\n' +
        '# Use the session key in a header\n' +
        'Given url baseUrl\n' +
        'And path "store/inventory"\n' +
        'And header api_key = session.apiKey\n' +
        'When method get\n' +
        'Then status 200',
        'The `karate.callSingle()` pattern in `karate-config.js` runs `auth.feature@auth` ONCE and caches the result as `session`. All features share the same auth object — zero re-authentication overhead across parallel threads.',
        'Practice: Assert that `session.bootstrappedAt` is a valid ISO-8601 date string.',
        'intermediate',
        ['Add: `* match session.bootstrappedAt == "#regex \\\\d{4}-\\\\d{2}-\\\\d{2}T.*"`',
            'Or simpler: `* match session.bootstrappedAt == "#string"` then verify it is non-empty',
            'The timestamp is set with `new Date().toISOString()` inside auth.feature']
    );

    add(++id, 'callonce Feature-Level Setup with runId', 'gherkin',
        '# callonce runs the target scenario exactly ONCE per feature file\n' +
        '# and caches the result for all scenarios in that file\n' +
        'Background:\n' +
        '  * url baseUrl\n' +
        '  * def C = read("classpath:common/constants.js")\n' +
        '  * def setup = callonce read("classpath:common/hooks.feature@setup")\n' +
        '  * print "[feature] runId:", setup.runId\n' +
        '\n' +
        'Scenario: Use setup data in test\n' +
        '  # setup.runId is available in every scenario in this feature\n' +
        '  * match setup.runId == "#string"\n' +
        '  * match setup.runId == "#regex [A-Z0-9-]+"\n' +
        '\n' +
        '  Given path C.paths.PET\n' +
        '  And path setup.testPetId\n' +
        '  When method get\n' +
        '  Then status 200',
        'Unlike `karate.callSingle()` which is JVM-wide, `callonce` is scoped to the feature file. All scenarios in the same file share the result. Use it to create shared test data (like a testPetId) that is cleaned up in `@teardown`.',
        'Practice: Create a second `Scenario` below and verify `setup.runId` is the same value (proving caching works).',
        'intermediate',
        ['Add `Scenario: Verify caching` with `* match setup.runId == "#string"`',
            'Both scenarios reference the same `setup` object — it was created only once',
            'Add `* print "runId in Scenario 2:", setup.runId` to confirm the identical value']
    );

    add(++id, 'DSL Showcase — copy, set, remove, replace', 'gherkin',
        '# Taken from pet-search.feature @keyword-showcase\n' +
        '\n' +
        '# copy: deep-clone so mutations do not bleed into original\n' +
        '* def original = { id: 42, name: "OriginalPet", tags: [{ id: 1, name: "alpha" }] }\n' +
        '* copy cloned  = original\n' +
        '* set cloned.name = "ClonedPet"\n' +
        'And match original.name == "OriginalPet"   # original is unchanged\n' +
        'And match cloned.name   == "ClonedPet"\n' +
        '\n' +
        '# set: mutate a deeply nested field\n' +
        '* set cloned.tags[0].name = "beta"\n' +
        'And match original.tags[0].name == "alpha"  # deep-clone verified\n' +
        '\n' +
        '# remove: delete a field\n' +
        '* remove cloned.id\n' +
        'And match cloned !contains { id: "#present" }\n' +
        '\n' +
        '# replace: string-template substitution (table form)\n' +
        '* def tpl = "Pet <petName> has status <petStatus>."\n' +
        '* replace tpl\n' +
        '  | token       | value       |\n' +
        '  | <petName>   | "Buddy"     |\n' +
        '  | <petStatus> | "available" |\n' +
        'And match tpl == "Pet Buddy has status available."',
        'These four keywords are critical for test data management. `copy` prevents accidental mutation of shared objects. `set` does deep path updates. `remove` deletes keys cleanly. `replace` is the safest way to do string templating (avoids the `fromString()` gotcha).',
        'Practice: After `remove cloned.id`, try to access `cloned.id` — what does Karate return?',
        'basic',
        ['Add: `* print cloned.id` — Karate prints `null` for missing fields',
            'Try: `* match cloned.id == null` — this assertion passes',
            'Use `!contains { id: "#present" }` for the most precise "field does not exist" assertion']
    );

    add(++id, 'karate.sort(), karate.distinct(), match each + regex', 'gherkin',
        '# Based on pet-search.feature @regression @search\n' +
        '\n' +
        'Given url baseUrl\n' +
        'And path "pet/findByStatus"\n' +
        'And param status = "available"\n' +
        'And param status = "pending"\n' +
        'When method get\n' +
        'Then status 200\n' +
        '\n' +
        '# Extract all statuses and verify each is one of the two requested values\n' +
        '* def statuses = karate.map(response, function(p){ return p.status })\n' +
        'And match each statuses == "#regex (available|pending)"\n' +
        '\n' +
        '# karate.distinct: see which statuses actually came back\n' +
        '* def unique = karate.distinct(statuses)\n' +
        '* print "Unique statuses returned:", unique\n' +
        '\n' +
        '# karate.sort: sort pets by id, then verify id range is valid\n' +
        '* def sorted  = karate.sort(response, function(a, b){ return a.id - b.id })\n' +
        '* def firstId = sorted[0].id\n' +
        '* def lastId  = sorted[sorted.length - 1].id\n' +
        '* assert firstId <= lastId',
        '`karate.sort(array, comparator)` returns a NEW sorted array (non-mutating). `karate.distinct(array)` deduplicates. Combined with `match each` + `#regex`, these let you validate bulk data without looping manually.',
        'Practice: Sort by `name` alphabetically and assert the first name comes before the last alphabetically.',
        'intermediate',
        ['Sort: `* def byName = karate.sort(response, function(a,b){ return a.name < b.name ? -1 : 1 })`',
            'Assert: `* assert byName[0].name <= byName[byName.length - 1].name`',
            'Note: JS string comparison with `<` is lexicographic — works for alphabetical sorting']
    );

    add(++id, 'Java Interop — TestUtils Static Methods', 'gherkin',
        '# Java.type() gives access to any class on the test classpath\n' +
        '* def Utils = Java.type("petstore.runners.TestUtils")\n' +
        '\n' +
        '# maskSensitive: safe logging of API keys in reports\n' +
        '* def masked = Utils.maskSensitive(session.apiKey, 3)\n' +
        '* print "Masked key:", masked\n' +
        'And match masked == "#string"\n' +
        'And match masked contains "***"\n' +
        '\n' +
        '# areClose: numeric proximity validation (useful for performance checks)\n' +
        '* def closeResult    = Utils.areClose(1000000, 1000005, 10)\n' +
        '* def notCloseResult = Utils.areClose(1000000, 1000020, 10)\n' +
        'And match closeResult    == true\n' +
        'And match notCloseResult == false\n' +
        '\n' +
        '# reverse: verify string transformation\n' +
        '* def rev = Utils.reverse("karate")\n' +
        'And match rev == "etarak"\n' +
        '\n' +
        '# isValidEmail: call a Java validation method\n' +
        '* def valid = Utils.isValidEmail("tester@example.com")\n' +
        'And match valid == true',
        'Any static method on the test classpath is callable via `Java.type("fully.qualified.ClassName")`. This is how you reuse existing Java validation, encryption, or utility logic inside Gherkin without duplicating it in JavaScript.',
        'Practice: Add a call to `Utils.isValidEmail("not-an-email")` and assert it returns `false`.',
        'intermediate',
        ['Add: `* def bad = Utils.isValidEmail("not-an-email")`',
            'Assert: `And match bad == false`',
            'Extend: try `Utils.isValidEmail(null)` — observe whether it throws or returns false gracefully']
    );

    add(++id, 'responseType, match header, and responseHeaders', 'gherkin',
        '# From pet-search.feature @smoke @search — header validation patterns\n' +
        '\n' +
        'Given url baseUrl\n' +
        'And path "pet/findByStatus"\n' +
        'And param status = "available"\n' +
        'When method get\n' +
        'Then status 200\n' +
        '\n' +
        '# responseType — "json" | "xml" | "html" | "stream" | "string"\n' +
        'And match responseType == "json"\n' +
        '\n' +
        '# match header — shorthand for a single response header check\n' +
        'And match header Content-Type contains "application/json"\n' +
        '\n' +
        '# responseHeaders — full map; keys may be lowercase on some servers\n' +
        '* def ct = responseHeaders["content-type"] ? responseHeaders["content-type"][0] : responseHeaders["Content-Type"][0]\n' +
        '* print "Content-Type:", ct\n' +
        'And match ct contains "application/json"\n' +
        '\n' +
        '# assert response time SLA\n' +
        '* def C = read("classpath:common/constants.js")\n' +
        '* assert responseTime < C.sla.SLOW',
        '`responseType` is set automatically by Karate based on the Content-Type header. `match header` is a convenient shorthand. `responseHeaders` gives the full map — always use lowercase keys for safety since HTTP/2 mandates lowercase headers.',
        'Practice: After the GET, assert that no `X-Powered-By` header is present (security best practice).',
        'intermediate',
        ['`* def powered = responseHeaders["x-powered-by"] || responseHeaders["X-Powered-By"]`',
            'Assert: `* match powered == null`',
            'If a server exposes `X-Powered-By`, it leaks implementation details — this is a security test']
    );

    add(++id, 'Schema Validation with External pet-schema.json', 'gherkin',
        '# Load the external schema — the same one used in production tests\n' +
        '* def schema = read("classpath:petstore/schemas/pet-schema.json")\n' +
        '\n' +
        'Given url baseUrl\n' +
        'And path "pet", 1\n' +
        'When method get\n' +
        'Then status 200\n' +
        '\n' +
        '# Validate the single pet response against the schema\n' +
        '* match response == schema\n' +
        '\n' +
        '# For list endpoints — validate each element\n' +
        'Given url baseUrl\n' +
        'And path "pet/findByStatus"\n' +
        'And param status = "available"\n' +
        'When method get\n' +
        'Then status 200\n' +
        '* match each response == schema\n' +
        '\n' +
        '# Soft validation — check without throwing\n' +
        '* def result = karate.match(response[0], schema)\n' +
        '* print "Schema valid:", result.pass, "| Message:", result.message',
        'Externalising the schema to `pet-schema.json` means ALL feature files validate against the same contract. A single schema change cascades to every test automatically. `karate.match()` allows soft validation — check without aborting the scenario.',
        'Practice: Temporarily break the schema by removing a required field, run the test, and observe the error message.',
        'advanced',
        ['Edit `pet-schema.json` to change `"id": "#number"` to `"id": "#string"`',
            'Re-run the test — `match response == schema` will throw a detailed mismatch error',
            'Revert the change — this teaches you to read schema assertion failures']
    );

    add(++id, 'Build a Full Smoke Suite with @smoke Tags', 'gherkin',
        '# A production smoke feature — fast, critical-path only\n' +
        '@petstore @smoke\n' +
        'Feature: Petstore Smoke Suite\n' +
        '\n' +
        'Background:\n' +
        '  * url baseUrl\n' +
        '  * def C = read("classpath:common/constants.js")\n' +
        '\n' +
        '@smoke\n' +
        'Scenario: GET /store/inventory returns a non-empty object\n' +
        '  Given path C.paths.STORE_INVENTORY\n' +
        '  And header api_key = session.apiKey\n' +
        '  When method get\n' +
        '  Then status 200\n' +
        '  And match response == "#object"\n' +
        '  * assert responseTime < C.sla.NORMAL\n' +
        '\n' +
        '@smoke\n' +
        'Scenario: GET /pet/findByStatus available returns an array\n' +
        '  Given path C.paths.PET_FIND_STATUS\n' +
        '  And param status = C.petStatus.AVAILABLE\n' +
        '  When method get\n' +
        '  Then status 200\n' +
        '  And match response == "#[] #object"\n' +
        '  * assert responseTime < C.sla.SLOW\n' +
        '\n' +
        '# Run this smoke suite with: mvn test -Psmoke',
        'Smoke suites run on every PR commit. They must be: FAST (< 30s), CRITICAL PATH ONLY (no edge cases), and TAGGED with `@smoke` so the SmokeRunner can discover them via `.tags("@smoke")`.',
        'Practice: Add a third @smoke scenario that validates POST /pet returns 200 with a valid id.',
        'advanced',
        ['Add: `@smoke` then `Scenario: POST /pet creates a pet`',
            'Request: `{ id: 77701, name: "SmokePet", status: "available" }`',
            'Assert: `Then status 200` and `And match response.id == 77701`']
    );

    add(++id, 'Mock Server — Stateful Inventory with pathParams', 'gherkin',
        '# A mock that tracks pet inventory state across calls\n' +
        'Background:\n' +
        '  * def inventory = { available: 10, pending: 3, sold: 2 }\n' +
        '\n' +
        '# GET /store/inventory — return live inventory\n' +
        'Scenario: pathMatches("/store/inventory") && methodIs("get")\n' +
        '  * def responseStatus = 200\n' +
        '  * def response = inventory\n' +
        '\n' +
        '# POST /store/order — place an order, decrement available count\n' +
        'Scenario: pathMatches("/store/order") && methodIs("post")\n' +
        '  * eval inventory.available = inventory.available - request.quantity\n' +
        '  * eval inventory.sold      = inventory.sold      + request.quantity\n' +
        '  * def responseStatus = 200\n' +
        '  * def response = { id: 9001, petId: request.petId, status: "placed" }\n' +
        '\n' +
        '# GET /v2/store/order/{orderId} — retrieve order\n' +
        'Scenario: pathMatches("/store/order/{orderId}") && methodIs("get")\n' +
        '  * def responseStatus = 200\n' +
        '  * def response = { id: pathParams.orderId, status: "placed", petId: 1 }',
        'This mock simulates a stateful inventory service. The `Background:` `inventory` object persists across all calls to the mock server instance. Each POST order decrements `available` and increments `sold` — exactly like a real database would.',
        'Practice: Add a check in the POST handler that returns `{ error: "Out of stock" }` with status 409 if `inventory.available < request.quantity`.',
        'advanced',
        ['Before setting responseStatus in the POST handler, add: `* def hasStock = inventory.available >= request.quantity`',
            '`* def responseStatus = hasStock ? 200 : 409`',
            '`* def response = hasStock ? { id: 9001, status: "placed" } : { error: "Out of stock" }`']
    );

    return ex;
}

@store
Feature: Store API — Advanced Karate Patterns

  # ============================================================================
  # This feature file is the advanced-capabilities showcase.  Each scenario
  # is tagged so it can be executed independently:
  #
  #   mvn test -Dkarate.options="--tags @smoke"
  #   mvn test -Dkarate.options="--tags @regression"
  #   mvn test -Dkarate.options="--tags @performance"
  #
  # Advanced techniques demonstrated:
  #   • karate.keysOf / karate.sizeOf              — map/collection introspection
  #   • match contains / match !contains           — partial object assertions
  #   • match contains deep                        — deep partial object match
  #   • karate.map / karate.filter / karate.forEach — functional array transforms
  #   • match each                                 — assert every element in array
  #   • table keyword                              — inline data table (not CSV)
  #   • Batch call with array argument             — call feature N times in one line
  #   • retry until                                — polling with automatic backoff
  #   • responseTime                               — performance gate assertion
  #   • karate.embed                               — attach custom HTML to report
  #   • karate.abort                               — conditional scenario skip
  #   • karate.set / karate.get                    — cross-step variable mutation
  #   • print keyword                              — structured console output
  #   • karate.jsonPath                            — JsonPath over response
  # ============================================================================

  Background:
    * url baseUrl
    * def orderSchema = read('classpath:petstore/schemas/order-schema.json')

  # ============================================================================
  # SMOKE | PERFORMANCE
  # GET /store/inventory — validates map shape, keysOf introspection,
  # contains/!contains assertions, and a hard response-time gate.
  # ============================================================================
  @smoke @performance
  Scenario: Inventory Map - Shape Validation, Key Introspection, and Response Time Gate

    Given path 'store/inventory'
    When method get
    Then status 200

    # Inventory is a free-form map of { statusLabel → count }.
    And match response == '#object'

    # ── match contains: response must contain AT LEAST these keys (others ok) ─
    And match response contains { available: '#number' }

    # ── match !contains: assert an unexpected error key is absent ─────────────
    And match response !contains { error: '#present' }

    # ── karate.keysOf: introspect the map at runtime ──────────────────────────
    * def keys   = karate.keysOf(response)
    * def counts = karate.sizeOf(response)
    * print 'Inventory status labels:', keys
    * print 'Total inventory buckets:', counts

    # ── Hard performance gate: fail if API exceeds 5 seconds ─────────────────
    * assert responseTime < 5000
    * print 'Inventory response time:', responseTime, 'ms'

    # ── karate.embed: attach a formatted inventory summary to the HTML report ─
    * def summary = '<b>Inventory snapshot</b><br>Buckets: ' + counts + ' | Response: ' + responseTime + 'ms'
    * karate.embed(summary, 'text/html')

  # ============================================================================
  # SMOKE | ORDER
  # Full order lifecycle: prerequisite pet → create order → read back →
  # match contains deep → delete → verify 404.
  # Demonstrates:  match contains deep, responseTime, karate.set/karate.get.
  # ============================================================================
  @smoke @order
  Scenario: Order Lifecycle - Create, Read with Deep Match, Delete, and Verify 404

    # ── Pre-condition: create a pet to attach to the order ───────────────────
    * def petId   = call uniqueId
    * def created = call read('classpath:petstore/helpers/utils.feature@createPet') { petId: #(petId), name: 'OrderPet', status: 'available' }
    * def orderId = call uniqueId

    # ── CREATE ORDER ──────────────────────────────────────────────────────────
    Given path 'store/order'
    And request helpers.order(orderId, petId)
    When method post
    Then status 200

    # Full schema validation
    And match response == orderSchema
    # match contains: verify just the fields we care about, ignore shipDate etc.
    And match response contains { petId: '#(petId)', status: 'placed', complete: false }
    # match contains deep: nested objects also matched partially
    # (order doesn't have nested, but we demonstrate on the whole response)
    And match response contains deep { id: '#number', quantity: '#number' }

    * def confirmedOrderId = response.id
    # karate.set: mutate a variable mid-scenario (useful after complex branching)
    * karate.set('lastOrderId', confirmedOrderId)
    * print 'Order created, ID:', confirmedOrderId

    # ── READ ORDER — performance gate ─────────────────────────────────────────
    Given path 'store/order', confirmedOrderId
    When method get
    Then status 200
    And match response           == orderSchema
    And match response.id        == confirmedOrderId
    And match response.petId     == petId
    And match response.status    == '#regex (placed|approved|delivered)'
    * assert responseTime < 3000
    * print 'Order read response time:', responseTime, 'ms'

    # karate.get: retrieve the value stored by karate.set above
    * def storedId = karate.get('lastOrderId')
    * assert storedId == confirmedOrderId

    # ── DELETE ORDER ──────────────────────────────────────────────────────────
    Given path 'store/order', confirmedOrderId
    When method delete
    Then status 200

    # ── VERIFY 404 AFTER DELETE ───────────────────────────────────────────────
    Given path 'store/order', confirmedOrderId
    When method get
    Then status 404

    # ── CLEAN UP: remove the pet ─────────────────────────────────────────────
    * call read('classpath:petstore/helpers/utils.feature@deletePet') { petId: #(petId) }

  # ============================================================================
  # REGRESSION | FUNCTIONAL
  # GET /pet/findByStatus → karate.map, karate.filter, karate.forEach,
  # karate.jsonPath, match each, and conditional abort.
  # ============================================================================
  @regression @functional
  Scenario: Functional Collection Transforms - map, filter, forEach, jsonPath

    Given path 'pet/findByStatus'
    And param status = 'available'
    When method get
    Then status 200
    And match response == '#[] #object'

    # ── Conditional abort: skip the rest if the API returns an empty list ─────
    * if (response.length === 0) karate.abort()

    # ── karate.map: extract a single field from every element ─────────────────
    * def petIds   = karate.map(response, function(p){ return p.id })
    * def petNames = karate.map(response, function(p){ return p.name })
    And match petIds   == '#[] #number'
    And match petNames == '#[] #string'
    * print 'Total available pets:', petIds.length

    # ── karate.filter: keep only pets whose name is non-empty ─────────────────
    * def namedPets = karate.filter(response, function(p){ return p.name && p.name.length > 0 })
    * print 'Pets with non-empty names:', namedPets.length
    And match namedPets == '#[] #object'

    # ── karate.forEach: side-effect — log first 3 pets ───────────────────────
    * def loggedCount = 0
    * karate.forEach(response, function(p, i){ if (i < 3) karate.log('[forEach] #' + i, '→ id:', p.id, 'name:', p.name) })

    # ── match each: every element in the array must satisfy this shape ────────
    And match each response contains { id: '#number', name: '#string', status: '#string' }

    # ── karate.jsonPath: select all pet names via JSONPath ────────────────────
    * def namesViaPath = karate.jsonPath(response, '$[*].name')
    And match namesViaPath == '#[] #string'

    # ── All statuses must be 'available' since we filtered by that status ─────
    * def statuses = karate.map(response, function(p){ return p.status })
    And match each statuses == 'available'

    # ── Embed summary into the Masterthought report ────────────────────────────
    * def html = '<b>findByStatus=available</b><br>Total: ' + response.length + ' | Named: ' + namedPets.length
    * karate.embed(html, 'text/html')

  # ============================================================================
  # REGRESSION | TABLE
  # Inline `table` keyword → karate.map for type conversion →
  # batch `call` with array → cleanup with batch call.
  # This is more efficient than a Scenario Outline for setup/teardown patterns.
  # ============================================================================
  @regression @table
  Scenario: Batch Pet Creation from Inline Table then Bulk Teardown

    # ── table keyword: inline data (values are always strings — convert below) ─
    * table petRows
      | id    | name       | status    |
      | 30001 | TablePet1  | available |
      | 30002 | TablePet2  | pending   |
      | 30003 | TablePet3  | sold      |
      | 30004 | TablePet4  | available |

    # ── karate.map: convert id strings to integers before passing to API ──────
    * def toCreate = karate.map(petRows, function(r){ return { petId: parseInt(r.id), name: r.name, status: r.status } })

    # ── Batch call: Karate calls @createPet once per element, in parallel ─────
    * def results = call read('classpath:petstore/helpers/utils.feature@createPet') toCreate

    # ── Validate every result object ─────────────────────────────────────────
    And match results          == '#[] #object'
    And match each results contains { createdPetId: '#number' }
    * print 'Batch created', results.length, 'pets'

    # ── Bulk teardown via another batch call ──────────────────────────────────
    * def deleteArgs = karate.map(results, function(r){ return { petId: r.createdPetId } })
    * call read('classpath:petstore/helpers/utils.feature@deletePet') deleteArgs
    * print 'Bulk teardown complete'

  # ============================================================================
  # REGRESSION | RETRY
  # Demonstrates `retry until` — Karate re-issues the request automatically
  # until the condition is true or the retry count (from configure retry) is
  # exhausted.  Real-world use: poll an async job endpoint until status='done'.
  # ============================================================================
  @regression @retry
  Scenario: Polling with retry until - Confirm Pet Status After Creation

    * def petId   = call uniqueId
    * def created = call read('classpath:petstore/helpers/utils.feature@createPet') { petId: #(petId), name: 'RetryPet', status: 'available' }
    * print '[retry] Created pet ID:', petId

    # ── retry until: re-issue GET until the status field matches ──────────────
    # configure retry (set globally in karate-config.js) controls max attempts.
    # The condition is evaluated AFTER each response; request is retried if false.
    Given path 'pet', petId
    And retry until response.status == 'available'
    When method get
    Then status 200
    And match response.status == 'available'
    And match response.id     == petId
    * print '[retry] Status confirmed after', responseTime, 'ms'

    * call read('classpath:petstore/helpers/utils.feature@deletePet') { petId: #(petId) }

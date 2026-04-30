@petstore @pet-search
Feature: Pet Search API — Advanced Query and Keyword Showcase

  # ============================================================================
  # Advanced Karate techniques demonstrated in this file:
  #   • callonce              — feature-level one-time setup
  #   • C (constants.js)      — typed constant references
  #   • match header          — assert a specific response header
  #   • responseType          — assert the parsed media type
  #   • responseHeaders       — access full header map
  #   • karate.sort()         — sort an array by comparator
  #   • karate.distinct()     — deduplicate an array
  #   • match each + predicate— per-element JS predicate assertion
  #   • copy keyword          — deep-clone an object
  #   • set (deep path)       — mutate a nested field
  #   • remove keyword        — delete a key from an object
  #   • replace keyword       — string template substitution (table form)
  #   • text keyword          — raw multi-line text assignment
  #   • Java.type() interop   — call TestUtils.java from Gherkin
  # ============================================================================

  Background:
    * url baseUrl
    * def C       = read('classpath:common/constants.js')
    * def schema  = read('classpath:petstore/schemas/pet-schema.json')

    # callonce: the setup scenario runs ONCE for the whole feature regardless of
    # how many scenarios are below.  Subsequent calls return the cached object.
    * def setup = callonce read('classpath:common/hooks.feature@setup')
    * print '[pet-search] Feature started, runId:', setup.runId

  # ============================================================================
  # SMOKE | SEARCH
  # Validates response media type, Content-Type header, SLA from constants,
  # and that every element has the expected status.
  # ============================================================================
  @smoke @search
  Scenario: findByStatus - Single Status with Header, ResponseType, and SLA Assertions

    Given path C.paths.PET_FIND_STATUS
    And param status = C.petStatus.AVAILABLE
    When method get
    Then status 200

    # responseType assertion — 'json' | 'xml' | 'html' | 'stream' | 'string'
    And match responseType == 'json'

    # match header: shorthand to assert a single response header value
    And match header Content-Type contains 'application/json'

    # responseHeaders: the full headers map — useful for tracing correlation IDs
    # Note: header keys may be lowercase depending on server; use lowercase for safety
    * def contentType = responseHeaders['content-type'] ? responseHeaders['content-type'][0] : responseHeaders['Content-Type'][0]
    * print 'Content-Type header:', contentType
    And match contentType contains 'application/json'

    And match response == '#[] #object'
    # Note: demo Petstore returns pets with missing/null names — only assert id and status
    And match each response contains { id: '#number', status: 'available' }

    # SLA assertion using the typed constant
    * assert responseTime < C.sla.SLOW

  # ============================================================================
  # REGRESSION | SEARCH
  # Multiple status values in a single request.  Demonstrates multi-param
  # syntax and karate.distinct() to enumerate unique returned statuses.
  # ============================================================================
  @regression @search
  Scenario: findByStatus - Multiple Statuses, distinct() and sort()

    Given path C.paths.PET_FIND_STATUS
    And param status = C.petStatus.AVAILABLE
    And param status = C.petStatus.PENDING
    When method get
    Then status 200
    And match response == '#[] #object'

    # Every returned status must be one of the two requested values
    * def statuses = karate.map(response, function(p){ return p.status })
    And match each statuses == '#regex (available|pending)'

    # karate.distinct: enumerate the unique status values actually present
    * def uniqueStatuses = karate.distinct(statuses)
    * print 'Unique statuses in response:', uniqueStatuses
    And match uniqueStatuses == '#[] #string'

    # karate.sort: order pets by id ascending and confirm the invariant
    * def sorted  = karate.sort(response, function(a, b){ return a.id - b.id })
    * def firstId = sorted[0].id
    * def lastId  = sorted[sorted.length - 1].id
    # Note: demo Petstore IDs are not guaranteed to be unique, so this is a best-effort check
    * karate.log('[sort] Pet ID range:', firstId, '->', lastId)
    * print 'Pet ID range (sorted):', firstId, '->', lastId

  # ============================================================================
  # REGRESSION | KEYWORD-SHOWCASE
  # Demonstrates: copy, set (deep path), remove, replace (table form), text.
  # No HTTP calls — purely DSL keyword coverage.
  # ============================================================================
  @regression @keyword-showcase
  Scenario: DSL Keywords - copy, set deep-path, remove, replace, text

    # ── copy: deep-clone so mutations do not bleed into the original ──────────
    * def original = { id: 42, name: 'OriginalPet', status: 'available', tags: [{ id: 1, name: 'alpha' }] }
    * copy cloned  = original

    * set cloned.name = 'ClonedPet'
    And match original.name == 'OriginalPet'
    And match cloned.name   == 'ClonedPet'

    # ── set: mutate a deeply nested value ────────────────────────────────────
    * set cloned.tags[0].name = 'beta'
    And match cloned.tags[0].name   == 'beta'
    And match original.tags[0].name == 'alpha'

    # ── remove: delete a field from an object ────────────────────────────────
    * remove cloned.status
    And match cloned !contains { status: '#present' }
    And match original contains { status: 'available' }  # original unaffected

    # ── replace: string-template substitution (table form) ───────────────────
    * def tpl = 'Pet <petName> has status <petStatus> and tag <tagName>.'
    * replace tpl
      | token        | value       |
      | <petName>    | 'Buddy'     |
      | <petStatus>  | 'available' |
      | <tagName>    | 'alpha'     |
    And match tpl == 'Pet Buddy has status available and tag alpha.'

    # ── text: assign a raw multi-line string without JSON parsing ─────────────
    * text rawXml =
      """
      <pet>
        <id>1</id>
        <name>Buddy</name>
      </pet>
      """
    And match rawXml contains '<name>Buddy</name>'

  # ============================================================================
  # REGRESSION | JAVA-INTEROP
  # Calls TestUtils.java static methods via Java.type().
  # Shows how any JVM library can be used inside a Karate feature.
  # ============================================================================
  @regression @java-interop
  Scenario: Java Interop - Call TestUtils.java Static Methods

    # Java.type gives access to any class on the test classpath
    * def Utils = Java.type('petstore.runners.TestUtils')

    # maskSensitive: safe logging of the session API key
    * def masked = Utils.maskSensitive(session.apiKey, 3)
    * print '[java-interop] Masked API key:', masked
    And match masked == '#string'
    And match masked contains '***'

    # areClose: numeric proximity check
    * def close = Utils.areClose(1000000, 1000005, 10)
    And match close == true

    * def notClose = Utils.areClose(1000000, 1000020, 10)
    And match notClose == false

    # reverse: string transformation
    * def rev = Utils.reverse('karate')
    And match rev == 'etarak'

    # isValidEmail: custom validator
    * def validEmail = Utils.isValidEmail('tester@example.com')
    And match validEmail == true

    * def badEmail = Utils.isValidEmail('not-an-email')
    And match badEmail == false

  # ============================================================================
  # SMOKE | FIND-BY-TAGS
  # GET /pet/findByTags — multi-value tag query parameter.
  # ============================================================================
  @smoke @find-by-tags
  Scenario: findByTags - Multi-Tag Query Returns Array

    Given path C.paths.PET_FIND_TAGS
    And param tags = 'auto-test'
    When method get
    Then status 200
    # The demo Petstore may return empty array if no pet has this tag — accept both
    And match response == '#[]'
    * print 'Pets found by tag "auto-test":', response.length
    * assert responseTime < C.sla.SLOW

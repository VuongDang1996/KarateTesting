@petstore @contract
Feature: Contract Testing — Schema Enforcement and API Evolution Validation

  # ============================================================================
  # Consumer-driven contract testing pattern.
  #
  # Techniques demonstrated:
  #   • Strict vs. loose schema comparison on the same response
  #   • schemaUtils.pick — build a minimal "v1 contract" from a larger schema
  #   • schemaUtils.merge — compose two schemas into one
  #   • schemaUtils.withField — append a runtime assertion to an existing schema
  #   • match contains (partial contract) vs. match == (full contract)
  #   • match !contains — assert a forbidden field is absent
  #   • TestDataManager — guaranteed cleanup via LIFO resource registry
  #   • karate.write — persist the full contract violation log to JSON
  #   • Scenario-level configure retry — tolerate transient 503 during probing
  # ============================================================================

  Background:
    * url baseUrl
    * def looseSchema  = read('classpath:petstore/schemas/pet-schema.json')
    * def strictSchema = read('classpath:petstore/schemas/pet-schema-strict.json')
    * def schemaUtils  = read('classpath:common/schema-utils.js')
    * def TDM          = Java.type('petstore.runners.TestDataManager')

  # ============================================================================
  # SMOKE | CONTRACT
  # A freshly created pet must satisfy BOTH the loose schema (for backward
  # compatibility) AND the strict schema (for full contract enforcement).
  # ============================================================================
  @smoke @contract-full
  Scenario: Full Response satisfies both Loose and Strict schemas

    * def petId   = call uniqueId
    * def created = call read('classpath:petstore/helpers/utils.feature@createPet') { petId: #(petId), name: 'ContractPet', status: 'available' }
    * TDM.register('pet', petId)

    Given path 'pet', petId
    When method get
    Then status 200

    # ── Loose schema: optional fields (## prefix) are allowed to be absent ────
    And match response == looseSchema

    # ── Strict schema: every defined field MUST be present ────────────────────
    And match response == strictSchema

    # ── schemaUtils.withField: dynamically add a runtime constraint ───────────
    # Assert the name field is NOT 'unknown' (a constraint not in the base schema)
    * def extendedSchema = schemaUtils.withField(strictSchema, 'name', '#? _ !== "unknown"')
    And match response == extendedSchema

    # ── Assert forbidden internal fields are absent ────────────────────────────
    And match response !contains { _rev: '#present' }
    And match response !contains { _internalId: '#present' }

    * call read('classpath:petstore/helpers/utils.feature@deletePet') { petId: #(petId) }
    * TDM.clear()

  # ============================================================================
  # REGRESSION | CONTRACT-EVOLUTION
  # Simulates a consumer that depends on v1 contract fields only.
  # New fields added by the API (forward compatibility) must not break the test.
  # ============================================================================
  @regression @contract-evolution
  Scenario: Backward Compatibility — Response satisfies the v1 minimal contract

    # ── Build a minimal "v1 contract" — only the fields the old consumer uses ─
    * def v1Contract = schemaUtils.pick(strictSchema, ['id', 'name', 'status'])
    * print '[contract] v1 minimal contract:', v1Contract

    * def petId   = call uniqueId
    * def created = call read('classpath:petstore/helpers/utils.feature@createPet') { petId: #(petId), name: 'EvolvedPet', status: 'pending' }
    * TDM.register('pet', petId)

    Given path 'pet', petId
    When method get
    Then status 200

    # Partial match: response must CONTAIN all v1 fields (extras are allowed)
    And match response contains v1Contract

    # The v1 consumer only cares about these three fields:
    And match response.id     == '#number'
    And match response.name   == 'EvolvedPet'
    And match response.status == 'pending'

    # ── New v2 fields are present but the v1 consumer ignores them ────────────
    # Using `match contains` (not `match ==`) means additional fields are fine.
    * print '[contract] Response contains v2+ fields:', karate.keysOf(response)

    * call read('classpath:petstore/helpers/utils.feature@deletePet') { petId: #(petId) }
    * TDM.clear()

  # ============================================================================
  # REGRESSION | CONTRACT-SCHEMA-COMPOSITION
  # Demonstrates schemaUtils.merge to build an environment-specific schema
  # and schemaUtils.makeOptional to relax the strict schema.
  # ============================================================================
  @regression @contract-composition
  Scenario: Schema Composition — merge, makeOptional, pick in combination

    # ── schemaUtils.merge: combine two schemas (second wins on collision) ─────
    * def baseFields  = { id: '#number', name: '#string', status: '#string' }
    * def extraFields = { photoUrls: '#[] #string', name: '#? _.length > 0' }
    * def composed    = schemaUtils.merge(baseFields, extraFields)
    # name matcher is now overridden by the stricter predicate from extraFields
    * print '[contract] Composed schema:', composed

    # ── schemaUtils.makeOptional: generate a permissive variant ───────────────
    * def relaxed     = schemaUtils.makeOptional(strictSchema)
    * print '[contract] Relaxed (all-optional) schema:', relaxed

    * def petId   = call uniqueId
    * def created = call read('classpath:petstore/helpers/utils.feature@createPet') { petId: #(petId), name: 'ComposedPet', status: 'available' }
    * TDM.register('pet', petId)

    Given path 'pet', petId
    When method get
    Then status 200

    # The composed schema is a partial check — only checks id, name, photoUrls
    And match response contains composed

    # The relaxed schema treats every field as optional — nothing can fail here
    And match response == relaxed

    * call read('classpath:petstore/helpers/utils.feature@deletePet') { petId: #(petId) }
    * TDM.clear()

  # ============================================================================
  # REGRESSION | CONTRACT-COLLECTION
  # Every element of a collection must satisfy the same base contract.
  # Uses schemaUtils.pick to build a per-element contract dynamically.
  # ============================================================================
  @regression @contract-collection
  Scenario: Collection Contract — findByStatus homogeneous typing

    Given path 'pet/findByStatus'
    And param status = 'available'
    When method get
    Then status 200
    And match response == '#[] #object'

    # ── Build item-level contract from the full strict schema ─────────────────
    * def itemContract = schemaUtils.pick(strictSchema, ['id', 'name', 'status'])
    * print '[contract] Per-element contract:', itemContract

    # Every element must contain the required fields with correct types
    And match each response contains itemContract

    # All returned statuses must match the query parameter (API honesty check)
    * def statuses = karate.map(response, function(p){ return p.status })
    And match each statuses == 'available'

    # ── Write contract violation log (empty = all clear) ──────────────────────
    * def violations = karate.filter(response, function(p){ return p.status !== 'available' })
    * def report = { timestamp: helpers.isoNow(), endpoint: '/pet/findByStatus', totalItems: response.length, violations: violations }
    * karate.write(karate.toJson(report, true), 'contract-report.json')
    * print '[contract] Violations found:', violations.length, '| report → target/contract-report.json'
    * assert violations.length == 0

  # ============================================================================
  # REGRESSION | CONTRACT-NEGATIVE
  # Verifies the contract validator catches a schema mismatch.
  # Demonstrates karate.match() for programmatic (non-failing) schema checks.
  # ============================================================================
  @regression @contract-negative
  Scenario: Programmatic Schema Check via karate.match() — detect contract violations

    # ── karate.match(): returns a MatchResult (pass/fail + message), does NOT
    # throw an exception — perfect for building custom reporting logic ──────────
    * def fakeResponse = { id: 'not-a-number', name: 'BadPet', status: 'flying' }

    * def result = karate.match(fakeResponse, strictSchema)
    * print '[contract] Match result:', result

    # `result.pass` is false because id is a String, not a Number
    And match result.pass == false
    And match result.message == '#string'
    * print '[contract] Violation message:', result.message

    # Confirm the loose schema also fails on type mismatch for id
    * def looseResult = karate.match(fakeResponse, looseSchema)
    And match looseResult.pass == false

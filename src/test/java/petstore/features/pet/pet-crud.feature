@petstore
Feature: Pet Store API - Enterprise Test Suite

  # ============================================================================
  # Background: shared setup injected before every scenario.
  # baseUrl and petSchema originate from karate-config.js and the JSON file.
  # ============================================================================
  Background:
    * url baseUrl
    * def schema = read('classpath:petstore/schemas/pet-schema.json')

  # ============================================================================
  # SMOKE | CRUD
  # Full end-to-end lifecycle: Create → Read → Fuzzy Assert → Update → Delete.
  # Demonstrates:
  #   - Calling the reusable @createPet helper from utils.feature
  #   - Strict JSON schema validation (match response == schema)
  #   - Inline fuzzy matchers (#number, #string, JavaScript predicates)
  #   - Conditional logic with karate.log
  #   - Calling the reusable @deletePet helper for clean-up
  # ============================================================================
  @smoke @crud
  Scenario: Full E2E CRUD with Schema Validation and Fuzzy Matchers

    # ── CREATE via reusable callable feature ──────────────────────────────────
    * def newId   = call uniqueId
    * def created = call read('classpath:petstore/helpers/utils.feature@createPet') { petId: #(newId), name: 'Buddy', status: 'available' }
    * def petId   = created.createdPetId
    * karate.log('[CRUD] Pet created with ID:', petId)

    # ── READ & STRICT SCHEMA VALIDATION ───────────────────────────────────────
    Given path 'pet', petId
    When method get
    Then status 200
    # Full structural validation against pet-schema.json (fuzzy matchers inside)
    And match response == schema
    # Inline fuzzy type assertions
    And match response.id        == '#number'
    And match response.name      == '#string'
    And match response.photoUrls == '#[] #string'
    # JavaScript predicate: id must be a positive integer
    And match response.id   == '#? _ > 0'
    # JavaScript predicate: name must be a non-empty string
    And match response.name == '#? _ != null && _.length > 0'

    # ── CONDITIONAL LOGIC ─────────────────────────────────────────────────────
    * def currentStatus = response.status
    * if (currentStatus === 'available') karate.log('[INFO] Pet is available for adoption')
    * if (currentStatus === 'pending')   karate.log('[INFO] Pet adoption is pending')
    * if (currentStatus === 'sold')      karate.log('[INFO] Pet has already been sold')

    # ── UPDATE ────────────────────────────────────────────────────────────────
    * def updatePayload = response
    * set updatePayload.name   = 'Buddy-Updated'
    * set updatePayload.status = 'sold'
    Given path 'pet'
    And request updatePayload
    When method put
    Then status 200
    And match response.name   == 'Buddy-Updated'
    And match response.status == 'sold'
    And match response        == schema

    # ── DELETE via reusable callable feature ──────────────────────────────────
    * call read('classpath:petstore/helpers/utils.feature@deletePet') { petId: #(petId) }
    * karate.log('[CRUD] Pet', petId, 'deleted — test complete')

  # ============================================================================
  # SMOKE | NEGATIVE
  # Verifies that requesting a non-existent resource returns HTTP 404 with a
  # well-formed error body.
  # ============================================================================
  @smoke @negative
  Scenario: Negative Test - Fetch Non-Existent Pet Returns 404
    Given path 'pet', 999999999
    When method get
    Then status 404
    And match response.type    == '#string'
    And match response.message == '#string'

  # ============================================================================
  # REGRESSION
  # GET /pet/findByStatus — validates collection shape with 'match each'.
  # ============================================================================
  @regression
  Scenario: Find Pets by Status - Validate Collection Response Shape
    Given path 'pet/findByStatus'
    And param status = 'available'
    When method get
    Then status 200
    # Response must be a non-null array of objects
    And match response == '#[] #object'
    # Every element must contain at minimum the required fields
    # Note: demo Petstore has entries with null names — use ##string (optional)
    And match each response contains { id: '#number', name: '##string', status: '#string' }
    * def count = response.length
    * karate.log('[findByStatus] Available pets returned:', count)
    * assert count > 0

  # ============================================================================
  # REGRESSION
  # POST /pet/{id} with form fields — demonstrates multipart/form-data.
  # ============================================================================
  @regression
  Scenario: Update Pet Name and Status via Form Data
    * def newId   = call uniqueId
    * def created = call read('classpath:petstore/helpers/utils.feature@createPet') { petId: #(newId), name: 'FormPet', status: 'available' }
    * def petId   = created.createdPetId

    Given path 'pet', petId
    And form field name   = 'FormPet-Updated'
    And form field status = 'pending'
    When method post
    # Demo Petstore form-data endpoint is unreliable — accept any 2xx response
    * assert responseStatus >= 200 && responseStatus < 300

    * call read('classpath:petstore/helpers/utils.feature@deletePet') { petId: #(petId) }

  # ============================================================================
  # DATA-DRIVEN
  # Scenario Outline reads rows from pets.csv at runtime.
  # Each row drives a full create + schema validate + field assert cycle.
  # CSV columns: id, name, status
  # ============================================================================
  @data-driven
  Scenario Outline: Data-Driven Pet Creation - <name> [<status>]
    Given path 'pet'
    And request
      """
      {
        "id": <id>,
        "category": { "id": 1, "name": "TestCategory" },
        "name": "<name>",
        "photoUrls": ["https://example.com/pets/<name>.jpg"],
        "tags": [{ "id": 1, "name": "data-driven" }],
        "status": "<status>"
      }
      """
    When method post
    Then status 200
    And match response        == schema
    And match response.name   == '#string'
    And match response.status == '#string'
    And match response.id     == '#number'

    Examples:
      | read('classpath:petstore/data/pets.csv') |

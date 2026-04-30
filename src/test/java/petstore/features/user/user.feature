@petstore @user
Feature: User API — Authentication Flow, CRUD, and Batch Operations

  # ============================================================================
  # Techniques demonstrated:
  #   • callonce   — one-time login per feature (token reused across scenarios)
  #   • header     — inject dynamic Authorization header per request
  #   • match responseType — assert response is plain string (login endpoint)
  #   • JS predicate in match — e.g., email contains '@'
  #   • set keyword — update nested fields before PUT
  #   • Batch create via /user/createWithArray
  #   • DELETE + 404 verification
  # ============================================================================

  Background:
    * url baseUrl
    * def userSchema = read('classpath:petstore/schemas/user-schema.json')
    * def C          = read('classpath:common/constants.js')
    * def setup      = callonce read('classpath:common/hooks.feature@setup')

  # ============================================================================
  # SMOKE | USER-CRUD
  # Full lifecycle: create → login (get token) → read → update → logout → delete.
  # callonce login is stored in `auth` and reused by the Read/Update steps.
  # ============================================================================
  @smoke @user-crud
  Scenario: Full User Lifecycle — Create, Login, Read, Update, Logout, Delete

    # ── Generate unique username to avoid collisions across parallel runs ─────
    * def username = 'testuser-' + helpers.randomString(8)
    * def password = 'Passw0rd-' + helpers.randomString(4)
    * def email    = username + '@example.com'

    # ── CREATE ────────────────────────────────────────────────────────────────
    # Note: demo Petstore occasionally returns 500 — retry up to 5 times
    * configure retry = { count: 5, interval: 2000 }
    * def newUserId = call uniqueId
    Given path C.paths.USER
    And request
      """
      {
        "id": #(newUserId),
        "username":   "#(username)",
        "firstName":  "Test",
        "lastName":   "User",
        "email":      "#(email)",
        "password":   "#(password)",
        "phone":      "555-0100",
        "userStatus": 1
      }
      """
    And retry until responseStatus == 200
    When method post
    Then status 200

    # ── LOGIN → receive session token (string message) ────────────────────────
    Given path C.paths.USER_LOGIN
    And param username = username
    And param password = password
    When method get
    Then status 200
    And match responseType == 'json'
    And match response.message == '#string'
    * def token = response.message
    * print '[user] Logged in, token:', helpers.maskSensitive ? token : token

    # ── READ — inject token in Authorization header ────────────────────────────
    Given path C.paths.USER, username
    And header Authorization = token
    When method get
    Then status 200
    And match response             == userSchema
    And match response.username    == username
    And match response.email       == email
    # JS predicate: email must contain '@'
    And match response.email       == '#? _.indexOf("@") > 0'

    # ── UPDATE ────────────────────────────────────────────────────────────────
    * def updatedUser = response
    * set updatedUser.firstName = 'Updated'
    * set updatedUser.phone     = '555-9999'
    Given path C.paths.USER, username
    And request updatedUser
    When method put
    Then status 200

    # ── READ-BACK to verify update persisted ─────────────────────────────────
    Given path C.paths.USER, username
    When method get
    Then status 200
    And match response.firstName == 'Updated'
    And match response.phone     == '555-9999'

    # ── LOGOUT ───────────────────────────────────────────────────────────────
    Given path C.paths.USER_LOGOUT
    When method get
    Then status 200

    # ── DELETE ───────────────────────────────────────────────────────────────
    Given path C.paths.USER, username
    When method delete
    Then status 200

    # ── VERIFY 404 after DELETE ───────────────────────────────────────────────
    Given path C.paths.USER, username
    When method get
    Then status 404

  # ============================================================================
  # REGRESSION | BATCH-CREATE
  # POST /user/createWithArray — creates multiple users in a single call,
  # verifies each was persisted, then cleans up.
  # ============================================================================
  @regression @batch-create
  Scenario: Batch User Creation via createWithArray

    * def suffix = helpers.randomString(5)
    * def users =
      """
      [
        { "id": 201, "username": "batch-a-<sfx>", "firstName": "Alice", "lastName": "Batch",
          "email": "alice-<sfx>@example.com", "password": "pass-a", "phone": "111-0001", "userStatus": 1 },
        { "id": 202, "username": "batch-b-<sfx>", "firstName": "Bob",   "lastName": "Batch",
          "email": "bob-<sfx>@example.com",   "password": "pass-b", "phone": "111-0002", "userStatus": 1 }
      ]
      """
    # replace: substitute the <sfx> placeholder throughout the JSON string
    * replace users/<sfx> = suffix
    # Parse back to JSON array — replace leaves it as a String which would send text/plain
    * def users = karate.fromString(users)

    Given path 'user/createWithArray'
    And request users
    When method post
    Then status 200

    # ── Verify user A ─────────────────────────────────────────────────────────
    * def userA = 'batch-a-' + suffix
    Given path C.paths.USER, userA
    When method get
    Then status 200
    And match response.username == userA

    # ── Verify user B ─────────────────────────────────────────────────────────
    * def userB = 'batch-b-' + suffix
    Given path C.paths.USER, userB
    When method get
    Then status 200
    And match response.username == userB

    # ── Cleanup ───────────────────────────────────────────────────────────────
    Given path C.paths.USER, userA
    When method delete
    Then status 200

    Given path C.paths.USER, userB
    When method delete
    Then status 200

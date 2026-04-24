@ignore
Feature: Authentication Bootstrap — karate.callSingle() Cache

  # ──────────────────────────────────────────────────────────────────────────
  # This feature is called EXACTLY ONCE per JVM via karate.callSingle() inside
  # karate-config.js.  The result object is frozen in memory; every subsequent
  # call from any thread returns the same cached copy, making it ideal for
  # expensive auth operations like OAuth token exchange.
  #
  # Pattern for real OAuth 2.0:
  #   Given url authServerUrl
  #   And form field grant_type = 'client_credentials'
  #   And form field client_id  = clientId
  #   And form field client_secret = clientSecret
  #   When method post
  #   Then status 200
  #   * def accessToken = response.access_token
  #
  # For the Petstore, the API key is resolved by karate-config.js and passed
  # in as the argument.  This scenario validates the key works before any test
  # runs, then returns the session object that karate-config.js stores as
  # config.session.  Features access it with:   session.apiKey
  # ──────────────────────────────────────────────────────────────────────────

  @auth
  Scenario: Validate API Credentials and Bootstrap Shared Session

    # baseUrl, apiKey, env are injected from the config object passed as the
    # second argument to karate.callSingle('...@auth', config).
    Given url baseUrl
    And path 'store/inventory'
    And header api_key = apiKey
    When method get
    Then status 200
    And match response == '#object'

    * karate.log('[auth] Credentials validated for env:', env)
    * def bootstrappedAt = new Date().toISOString()
    * def session = { apiKey: '#(apiKey)', env: '#(env)', bootstrappedAt: '#(bootstrappedAt)', validated: true }

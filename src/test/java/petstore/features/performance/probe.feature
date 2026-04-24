@ignore
Feature: Performance Probe — Single Timed HTTP Request

  # Called via batch `call` from perf-benchmark.feature.
  # Each invocation captures its own responseTime into `elapsed` so the
  # benchmark scenario can collect all timings into an array.

  @probe
  Scenario: Timed GET /store/inventory
    Given url baseUrl
    And path 'store/inventory'
    When method get
    Then status 200
    * def elapsed = responseTime

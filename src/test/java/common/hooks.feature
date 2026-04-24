@ignore
Feature: Lifecycle Hooks — callonce Setup and Teardown Patterns

  # ============================================================================
  # This file provides two callable scenarios used for cross-cutting concerns.
  #
  # @setup   — run with `callonce` at the TOP of a feature's Background.
  #             Executes once per feature file, not once per scenario.
  #             Result object is cached; repeat calls return the same instance.
  #
  # @teardown— use in `configure afterScenario` (wired in karate-config.js) or
  #             call explicitly at the end of a scenario for targeted cleanup.
  #
  # Usage in a feature's Background:
  #   Background:
  #     * def setup = callonce read('classpath:common/hooks.feature@setup')
  #     * print '[feature] started at', setup.startedAt
  # ============================================================================

  @setup
  Scenario: Feature-Level Setup — log start time and resolve runtime context

    * def startedAt  = new Date().toISOString()
    * def runId      = '' + java.util.UUID.randomUUID()

    * karate.log('[hooks@setup] Feature start  :', startedAt)
    * karate.log('[hooks@setup] Run ID          :', runId)
    * karate.log('[hooks@setup] Active env      :', env)
    * karate.log('[hooks@setup] Base URL        :', baseUrl)

    # karate.info exposes: scenarioName, tags, feature.packageQualifiedName, etc.
    # When called from callonce the feature path is accessible.
    * def featurePath = karate.info.feature.packageQualifiedName

    * def setup = { startedAt: '#(startedAt)', runId: '#(runId)', env: '#(env)', featurePath: '#(featurePath)' }

  @teardown
  Scenario: Feature-Level Teardown — log completion and duration

    * def finishedAt = new Date().toISOString()
    * karate.log('[hooks@teardown] Feature finish:', finishedAt)

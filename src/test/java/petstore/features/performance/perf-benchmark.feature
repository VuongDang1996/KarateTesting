@petstore @performance
Feature: Performance Benchmarking — Statistical Response-Time Analysis

  # ============================================================================
  # Techniques demonstrated:
  #   • Batch call with a generated array — run a probe scenario N times
  #   • helpers.mean / stddev / percentile — JS statistical functions
  #   • C.perf thresholds — typed SLA constants
  #   • Dynamic HTML table via karate.embed — attached to Masterthought report
  #   • TestDataManager Java interop — verify no resource leaks after benchmark
  #   • responseTime assertion on a single critical path (smoke gate)
  #   • karate.write() — write machine-readable perf results to a JSON file
  # ============================================================================

  Background:
    * url baseUrl
    * def C   = read('classpath:common/constants.js')
    * def TDM = Java.type('petstore.runners.TestDataManager')

  # ============================================================================
  # SMOKE | PERF-GATE
  # Single-shot latency gate on the inventory endpoint.
  # Blocks the smoke build immediately if the API is clearly slow.
  # ============================================================================
  @smoke @perf-gate
  Scenario: Single-Shot SLA Gate — GET /store/inventory must respond within SLOW threshold

    Given path C.paths.STORE_INVENTORY
    When method get
    Then status C.http.OK

    * assert responseTime < C.sla.SLOW
    * print '[perf-gate] /store/inventory:', responseTime, 'ms (threshold:', C.sla.SLOW, 'ms)'

  # ============================================================================
  # REGRESSION | PERF-STATS
  # Runs the inventory probe N times, collects all response times, computes
  # mean / p50 / p95 / p99 / σ, then asserts each against SLA thresholds.
  # An HTML table is embedded in the Masterthought report.
  # Results are also written to target/perf-results.json via karate.write().
  # ============================================================================
  @regression @perf-stats
  Scenario: Statistical Benchmark — mean / p50 / p95 / p99 against /store/inventory

    # ── Build N iteration inputs (array of dummy objects) ────────────────────
    * def N      = C.perf.ITERATIONS
    * def inputs = (function(){ var a = []; for(var i = 0; i < N; i++) a.push({ i: i }); return a; })()
    * print '[perf] Running', N, 'probe requests against /store/inventory …'

    # ── Batch call: Karate calls @probe once per element ─────────────────────
    # Each probe scenario sets `elapsed = responseTime` which is returned here.
    * def runs  = call read('classpath:petstore/features/performance/probe.feature@probe') inputs
    * def times = karate.map(runs, function(r){ return r.elapsed })
    * print '[perf] Raw response times (ms):', times

    # ── Statistical analysis ──────────────────────────────────────────────────
    * def mean  = helpers.mean(times)
    * def p50   = helpers.percentile(times, 50)
    * def p95   = helpers.percentile(times, 95)
    * def p99   = helpers.percentile(times, 99)
    * def stdev = helpers.stddev(times)
    * def minT  = helpers.percentile(times, 0)
    * def maxT  = helpers.percentile(times, 100)

    * print '[perf] ┌─────────────────────────────────┐'
    * print '[perf] │  Mean  :', mean,  'ms'
    * print '[perf] │  P50   :', p50,   'ms'
    * print '[perf] │  P95   :', p95,   'ms'
    * print '[perf] │  P99   :', p99,   'ms'
    * print '[perf] │  σ     :', stdev, 'ms'
    * print '[perf] │  Min   :', minT,  'ms'
    * print '[perf] │  Max   :', maxT,  'ms'
    * print '[perf] └─────────────────────────────────┘'

    # ── Assert SLA thresholds ─────────────────────────────────────────────────
    * assert mean < C.perf.MEAN_THRESHOLD, 'Mean latency exceeded SLA: ' + mean + ' ms'
    * assert p95  < C.perf.P95_THRESHOLD,  'P95  latency exceeded SLA: ' + p95  + ' ms'
    * assert p99  < C.perf.P99_THRESHOLD,  'P99  latency exceeded SLA: ' + p99  + ' ms'

    # ── Build HTML performance table for Masterthought report ─────────────────
    * def pass = '<span style="color:green;font-weight:bold">✓ PASS</span>'
    * def fail = '<span style="color:red;font-weight:bold">✗ FAIL</span>'
    * def html =
      """
      <style>
        .perf-tbl { border-collapse: collapse; font-family: monospace; font-size: 13px; }
        .perf-tbl th { background:#2c3e50; color:#fff; padding:6px 14px; text-align:left; }
        .perf-tbl td { border:1px solid #ccc; padding:5px 14px; }
        .perf-tbl tr:nth-child(even) { background:#f5f5f5; }
      </style>
      <table class="perf-tbl">
        <tr><th>Metric</th><th>Value (ms)</th><th>Threshold (ms)</th><th>Result</th></tr>
      """
    * def meanRow = '<tr><td>Mean</td><td>' + mean + '</td><td>' + C.perf.MEAN_THRESHOLD + '</td><td>' + (mean < C.perf.MEAN_THRESHOLD ? pass : fail) + '</td></tr>'
    * def p50Row  = '<tr><td>P50</td><td>'  + p50  + '</td><td>—</td><td>—</td></tr>'
    * def p95Row  = '<tr><td>P95</td><td>'  + p95  + '</td><td>' + C.perf.P95_THRESHOLD  + '</td><td>' + (p95 < C.perf.P95_THRESHOLD  ? pass : fail) + '</td></tr>'
    * def p99Row  = '<tr><td>P99</td><td>'  + p99  + '</td><td>' + C.perf.P99_THRESHOLD  + '</td><td>' + (p99 < C.perf.P99_THRESHOLD  ? pass : fail) + '</td></tr>'
    * def stdRow  = '<tr><td>σ  </td><td>'  + Math.round(stdev) + '</td><td>—</td><td>—</td></tr>'
    * def minRow  = '<tr><td>Min</td><td>'  + minT  + '</td><td>—</td><td>—</td></tr>'
    * def maxRow  = '<tr><td>Max</td><td>'  + maxT  + '</td><td>—</td><td>—</td></tr>'
    * def fullHtml = html + meanRow + p50Row + p95Row + p99Row + stdRow + minRow + maxRow + '</table>'
    * karate.embed(fullHtml, 'text/html')

    # ── Write machine-readable results to target/ ─────────────────────────────
    * def perfResults = { endpoint: '/store/inventory', iterations: N, mean: mean, p50: p50, p95: p95, p99: p99, stddev: stdev, min: minT, max: maxT, thresholds: { mean: C.perf.MEAN_THRESHOLD, p95: C.perf.P95_THRESHOLD, p99: C.perf.P99_THRESHOLD }, passedSla: (mean < C.perf.MEAN_THRESHOLD && p95 < C.perf.P95_THRESHOLD && p99 < C.perf.P99_THRESHOLD), timestamp: helpers.isoNow() }
    * karate.write(karate.toJson(perfResults, true), 'perf-results.json')
    * print '[perf] Results written → target/perf-results.json'

    # ── Verify no orphaned test resources via TestDataManager ─────────────────
    * def leakCount = TDM.totalRegistered()
    * print '[perf] TestDataManager orphan check:', leakCount, 'registered resources'
    * assert leakCount == 0

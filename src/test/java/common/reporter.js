/**
 * common/reporter.js — Custom in-test JSON summary reporter.
 *
 * Accumulates scenario-level metrics and writes a machine-readable summary
 * to target/test-summary.json via karate.write().
 *
 * Loaded globally by karate-config.js as the variable `reporter`.
 * Also loadable locally:  * def reporter = read('classpath:common/reporter.js')
 *
 * Usage pattern (typically in hooks.feature @teardown or afterScenario):
 *   * reporter.record('pet-crud', 'PASS', responseTime, 'smoke')
 *   * reporter.flush()
 */
(function() {
var reporter = (function() {

  var records   = [];
  var startedAt = new Date().getTime();

  return {

    // ── API ──────────────────────────────────────────────────────────────────

    /**
     * Record a single scenario outcome.
     * @param {string} name     - scenario display name
     * @param {string} status   - 'PASS' | 'FAIL' | 'ABORTED'
     * @param {number} duration - elapsed time in ms (use `responseTime` or 0)
     * @param {string} [tag]    - optional tag label (e.g. 'smoke', 'contract')
     */
    record: function(name, status, duration, tag) {
      records.push({
        scenario : name,
        status   : status   || 'UNKNOWN',
        duration : duration || 0,
        tag      : tag      || '',
        ts       : new Date().toISOString()
      });
    },

    /**
     * Build and return the summary object WITHOUT writing to disk.
     */
    summary: function() {
      var passed  = records.filter(function(r) { return r.status === 'PASS';    }).length;
      var failed  = records.filter(function(r) { return r.status === 'FAIL';    }).length;
      var aborted = records.filter(function(r) { return r.status === 'ABORTED'; }).length;
      var total   = records.length;
      var elapsed = new Date().getTime() - startedAt;

      var durations = records.map(function(r) { return r.duration; });
      var avgDur    = total > 0
                      ? Math.round(durations.reduce(function(s, v) { return s + v; }, 0) / total)
                      : 0;

      return {
        startedAt  : new Date(startedAt).toISOString(),
        finishedAt : new Date().toISOString(),
        elapsedMs  : elapsed,
        total      : total,
        passed     : passed,
        failed     : failed,
        aborted    : aborted,
        passRate   : total > 0 ? Math.round((passed / total) * 100) : 0,
        avgDuration: avgDur,
        records    : records
      };
    },

    /**
     * Serialise the summary to target/test-summary.json using karate.write().
     * Safe to call multiple times; each call overwrites the previous file.
     */
    flush: function() {
      var s = reporter.summary();
      karate.write(JSON.stringify(s, null, 2), 'test-summary.json');
      karate.log(
        '[reporter] Flushed summary → total:', s.total,
        '| passed:', s.passed,
        '| failed:', s.failed,
        '| passRate:', s.passRate + '%',
        '| elapsed:', s.elapsedMs + 'ms'
      );
    },

    /** Clear all accumulated records (use between feature-level runs if needed). */
    reset: function() {
      records   = [];
      startedAt = new Date().getTime();
    }
  };

})();

return reporter;
})()

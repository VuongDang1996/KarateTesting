package petstore.runners;

import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * RegressionRunner — executes only scenarios tagged {@code @regression}.
 *
 * Intended for nightly / post-deployment regression pipelines.
 * Runs with more threads than SmokeRunner since the suite is larger.
 *
 * Run:  mvn test -Dtest=RegressionRunner
 *       mvn test -Dtest=RegressionRunner -Dkarate.env=qa
 */
class RegressionRunner {

    @Test
    void regression() {
        Results results = Runner
                .path("classpath:petstore/features")
                .tags("@regression", "~@ignore")
                .outputCucumberJson(true)
                .parallel(5);

        MasterRunner.generateMasterthoughtReport(results.getReportDir());
        assertEquals(0, results.getFailCount(), results.getErrorMessages());
    }
}

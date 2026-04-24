package petstore.runners;

import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * SmokeRunner — executes only scenarios tagged {@code @smoke}.
 *
 * Use during CI pull-request gates for a fast confidence check (< 2 min).
 *
 * Run:  mvn test -Dtest=SmokeRunner
 *       mvn test -Dtest=SmokeRunner -Dkarate.env=staging
 */
class SmokeRunner {

    @Test
    void smoke() {
        Results results = Runner
                .path("classpath:petstore/features")
                .tags("@smoke", "~@ignore")
                .outputCucumberJson(true)
                .parallel(3);

        MasterRunner.generateMasterthoughtReport(results.getReportDir());
        assertEquals(0, results.getFailCount(), results.getErrorMessages());
    }
}

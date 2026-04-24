package petstore.runners;

import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import net.masterthought.cucumber.Configuration;
import net.masterthought.cucumber.ReportBuilder;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * PetRunner — JUnit 5 entry point for the Karate test suite.
 *
 * Parallel execution is handled entirely by Karate's built-in thread pool
 * (Runner.parallel(N)).  A single JUnit @Test method is all that is needed;
 * Surefire is configured with forkCount=1 so we don't double-fork.
 *
 * After the run the Masterthought HTML report is generated from the
 * Cucumber JSON files that Karate writes to target/karate-reports/.
 *
 * Run all tests:               mvn test
 * Run against QA environment:  mvn test -Dkarate.env=qa
 * Run only smoke tests:        mvn test -Dkarate.options="--tags @smoke"
 */
class MasterRunner {

    @Test
    void testParallel() {
        Results results = Runner
                .path("classpath:petstore/features")  // scan test features only (helpers are excluded by path)
                .tags("~@ignore")                     // belt-and-braces: skip any remaining @ignore helpers
                .outputCucumberJson(true)
                .parallel(5);                         // 5 threads — tune to CI agent core count

        generateMasterthoughtReport(results.getReportDir());

        // Fail the build if any scenario failed
        assertEquals(0, results.getFailCount(), results.getErrorMessages());
    }

    // -------------------------------------------------------------------------

    /**
     * Scans {@code karateOutputPath} for Cucumber JSON files produced by Karate
     * and generates an advanced Masterthought HTML report under target/.
     *
     * Report URL after a build:  target/cucumber-html-reports/overview-features.html
     */
    static void generateMasterthoughtReport(String karateOutputPath) {
        List<String> jsonPaths;
        try (Stream<Path> walk = Files.walk(Paths.get(karateOutputPath))) {
            jsonPaths = walk
                    .filter(p -> p.toString().endsWith(".json"))
                    .map(Path::toString)
                    .collect(Collectors.toList());
        } catch (IOException e) {
            throw new RuntimeException("Failed to locate Cucumber JSON reports in: " + karateOutputPath, e);
        }

        if (jsonPaths.isEmpty()) {
            System.out.println("[MasterRunner] No Cucumber JSON files found — skipping Masterthought report.");
            return;
        }

        Configuration config = new Configuration(new File("target"), "Petstore API Tests");
        config.addClassifications("Environment", System.getProperty("karate.env", "dev"));
        config.addClassifications("Framework",   "Karate DSL 1.4.1 / JUnit 5");
        config.addClassifications("Platform",    System.getProperty("os.name"));
        config.addClassifications("Java",        System.getProperty("java.version"));

        new ReportBuilder(jsonPaths, config).generateReports();
        System.out.println("[MasterRunner] Masterthought report → target/cucumber-html-reports/overview-features.html");
    }
}

package petstore.runners;

import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import com.intuit.karate.core.MockServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * MockRunner — Starts the Karate in-process mock server, then runs the pet
 * feature suite against it instead of the real Petstore API.
 *
 * This validates that feature files work correctly against a controlled,
 * deterministic server — no network dependency, no test pollution, instant.
 *
 * The mock is defined in petstore/mocks/pet-mock.feature using Karate's own
 * Gherkin-based HTTP server DSL.  It maintains an in-memory pet store so
 * full CRUD scenarios can pass without hitting petstore.swagger.io.
 *
 * Run this suite only:
 *   mvn test -Pmock
 *   mvn test -Dtest=MockRunner
 */
class MockRunner {

    static final int MOCK_PORT = 9876;

    private static MockServer mockServer;

    @BeforeAll
    static void startMockServer() {
        mockServer = MockServer
                .feature("classpath:petstore/mocks/pet-mock.feature")
                .http(MOCK_PORT)
                .build();
        System.out.printf("[MockRunner] Mock server started on http://localhost:%d%n", MOCK_PORT);
    }

    @AfterAll
    static void stopMockServer() {
        if (mockServer != null) {
            mockServer.stop();
            System.out.println("[MockRunner] Mock server stopped.");
        }
    }

    /**
     * Runs the pet-crud and store smoke scenarios against the local mock.
     *
     * The system property {@code mock.baseUrl} overrides {@code baseUrl} in
     * karate-config.js so features transparently target the mock port.
     * Features that use {@code baseUrl} need no code changes — only the URL
     * changes at runtime.
     */
    @Test
    void testAgainstMock() {
        String mockUrl = "http://localhost:" + MOCK_PORT + "/v2";

        Results results = Runner
                .path("classpath:petstore/features/pet/pet-crud.feature",
                      "classpath:petstore/features/store/store.feature")
                .tags("@smoke", "~@ignore")
                // Override the base URL so all features hit the mock server
                .systemProperty("mock.baseUrl", mockUrl)
                .outputCucumberJson(true)
                .parallel(2);

        MasterRunner.generateMasterthoughtReport(results.getReportDir());
        assertEquals(0, results.getFailCount(), results.getErrorMessages());
    }
}

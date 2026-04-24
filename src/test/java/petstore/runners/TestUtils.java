package petstore.runners;

/**
 * TestUtils — custom Java utility class callable from any Karate feature.
 *
 * Access from a feature with Java.type():
 *
 *   * def Utils  = Java.type('petstore.runners.TestUtils')
 *   * def masked = Utils.maskSensitive(session.apiKey, 3)
 *   * print 'Masked key:', masked
 *
 * This class demonstrates Karate's Java interop capability, which lets
 * tests leverage the full JVM ecosystem (cryptography, database drivers,
 * messaging clients, etc.) without leaving the Gherkin layer.
 */
public class TestUtils {

    private TestUtils() { /* utility class — no instances */ }

    /**
     * Masks all characters after the first {@code visibleChars} positions.
     * Useful for logging sensitive values (API keys, tokens) safely.
     *
     * <pre>maskSensitive("abc123xyz", 3) → "abc******"</pre>
     */
    public static String maskSensitive(String value, int visibleChars) {
        if (value == null)                      return null;
        if (value.length() <= visibleChars)     return value;
        return value.substring(0, visibleChars) + "*".repeat(value.length() - visibleChars);
    }

    /**
     * Returns {@code true} when the absolute difference between {@code a}
     * and {@code b} is within {@code delta}.  Handy for asserting that
     * two numeric IDs / timestamps are "close enough".
     *
     * <pre>areClose(100, 105, 10) → true</pre>
     */
    public static boolean areClose(long a, long b, long delta) {
        return Math.abs(a - b) <= delta;
    }

    /**
     * Returns the input string reversed.
     * Used to illustrate round-trip transformations in tests.
     */
    public static String reverse(String value) {
        if (value == null) return null;
        return new StringBuilder(value).reverse().toString();
    }

    /**
     * Simple email-format validator — checks for exactly one '@' with
     * characters on both sides.  Not RFC 5322 complete by design.
     */
    public static boolean isValidEmail(String email) {
        if (email == null) return false;
        int at = email.indexOf('@');
        return at > 0 && at < email.length() - 1 && email.indexOf('@', at + 1) == -1;
    }
}

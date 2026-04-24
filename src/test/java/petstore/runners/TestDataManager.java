package petstore.runners;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * TestDataManager — Thread-safe registry for test resource cleanup.
 *
 * In a parallel Karate run every scenario executes on its own thread.
 * This class registers the IDs of resources created during a scenario so
 * they can be cleaned up even if the scenario fails mid-way, preventing
 * "orphaned" data from polluting subsequent test runs.
 *
 * Resources are stored in a LIFO {@link Deque} per thread so the teardown
 * order is the reverse of the creation order — the safest sequence for
 * resources with parent-child dependencies (e.g., delete order before pet).
 *
 * Usage from a Karate feature:
 * <pre>
 *   * def TDM = Java.type('petstore.runners.TestDataManager')
 *   * TDM.register('pet', petId)
 *   * TDM.register('order', orderId)
 *
 *   # At cleanup time — iterate the LIFO list and call delete helpers
 *   * def resources = TDM.getResources()
 *   * karate.forEach(resources, function(r){ karate.log('[cleanup]', r.type, r.id) })
 *   * TDM.clear()
 * </pre>
 */
public final class TestDataManager {

    /** Key: thread ID.  Value: LIFO deque of "type:id" tokens. */
    private static final ConcurrentHashMap<Long, Deque<String>> REGISTRY =
            new ConcurrentHashMap<>();

    private TestDataManager() { /* utility class */ }

    // ── Registration ─────────────────────────────────────────────────────────

    /**
     * Register a string-keyed resource for cleanup on the current thread.
     * @param type e.g. "pet", "order", "user"
     * @param id   the resource identifier (String)
     */
    public static void register(String type, String id) {
        long tid = Thread.currentThread().getId();
        REGISTRY.computeIfAbsent(tid, k -> new ArrayDeque<>())
                .push(type + ":" + id);
    }

    /**
     * Register a numeric-keyed resource (convenience overload).
     * @param type e.g. "pet", "order"
     * @param id   the resource identifier (long)
     */
    public static void register(String type, long id) {
        register(type, String.valueOf(id));
    }

    // ── Retrieval ─────────────────────────────────────────────────────────────

    /**
     * Returns all resources registered by the current thread in LIFO order,
     * each as a {@code Map<String, String>} with keys {@code "type"} and
     * {@code "id"}.  Karate auto-converts Java Maps to JS objects, so
     * features can access {@code r.type} and {@code r.id} directly.
     */
    public static List<Map<String, String>> getResources() {
        Deque<String> items = REGISTRY.get(Thread.currentThread().getId());
        if (items == null || items.isEmpty()) return Collections.emptyList();

        List<Map<String, String>> result = new ArrayList<>(items.size());
        for (String token : items) {
            String[] parts = token.split(":", 2);
            Map<String, String> entry = new LinkedHashMap<>(2);
            entry.put("type", parts[0]);
            entry.put("id",   parts.length > 1 ? parts[1] : "");
            result.add(entry);
        }
        return result;
    }

    /**
     * Returns resources matching a specific type for the current thread.
     * Useful when you only want to clean up pets but not orders.
     */
    public static List<Map<String, String>> getResourcesByType(String type) {
        List<Map<String, String>> all = getResources();
        List<Map<String, String>> filtered = new ArrayList<>();
        for (Map<String, String> r : all) {
            if (type.equals(r.get("type"))) filtered.add(r);
        }
        return filtered;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    /**
     * Clear all resources for the current thread.
     * Call this after teardown is complete to free the registry entry.
     */
    public static void clear() {
        REGISTRY.remove(Thread.currentThread().getId());
    }

    // ── Diagnostics ──────────────────────────────────────────────────────────

    /**
     * Total resources registered across ALL threads.
     * Useful in an {@code afterScenario} hook to detect resource leaks.
     */
    public static int totalRegistered() {
        return REGISTRY.values().stream()
                       .mapToInt(Deque::size)
                       .sum();
    }

    /**
     * Returns the number of active threads currently holding resources.
     * Non-zero after all tests finish indicates a cleanup gap.
     */
    public static int activeThreadCount() {
        return REGISTRY.size();
    }
}

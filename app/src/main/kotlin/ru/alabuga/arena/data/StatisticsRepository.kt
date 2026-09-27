package ru.alabuga.arena.data

/**
 * Interface for collecting user statistics.
 * Currently a stub implementation for scaling tests.
 */
interface StatisticsRepository {
    /** Record a visit or action for the given user identifier */
    fun recordUserAction(userId: String, action: String)

    /** Retrieve aggregated stats for a user */
    fun getUserStats(userId: String): UserStats?
}

/** Simple data class representing collected statistics (stub) */
data class UserStats(
    val userId: String,
    val actions: List<String>
)

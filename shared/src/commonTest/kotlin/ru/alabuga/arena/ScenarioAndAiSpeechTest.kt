package ru.alabuga.arena

import ru.alabuga.arena.model.ScenarioPresets
import ru.alabuga.arena.network.KtorGeminiService
import ru.alabuga.arena.ui.screens.getDefaultHintsForScenario
import ru.alabuga.arena.ui.screens.getScenarioAchievements
import ru.alabuga.arena.model.NegotiationMetrics
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class ScenarioAndAiSpeechTest {

    @Test
    fun testAllScenarioPresetsAreConfigured() {
        val presets = ScenarioPresets.list
        assertEquals(5, presets.size, "Must have exactly 5 scenario presets, including new ai_datacenter_lease")

        val expectedIds = listOf(
            "retention_lead_engineer",
            "synergy_investor",
            "robotics_procurement",
            "internal_capex_dispute",
            "ai_datacenter_lease"
        )

        for (id in expectedIds) {
            val scenario = ScenarioPresets.getById(id)
            assertNotNull(scenario, "Scenario with id '$id' must exist")
            assertTrue(scenario.title.isNotBlank(), "Title must not be blank for $id")
            assertTrue(scenario.opponentName.isNotBlank(), "Opponent name must not be blank for $id")
            assertTrue(scenario.initialOpponentUtterance.isNotBlank(), "Initial utterance must not be blank for $id")
            assertTrue(scenario.initialBarsAdvice.isNotBlank(), "Initial BARS advice must not be blank for $id")
            assertTrue(scenario.agendaTopics.isNotEmpty(), "Agenda topics must not be empty for $id")
        }
    }

    @Test
    fun testNewAiDatacenterLeaseScenarioConfig() {
        val scenario = ScenarioPresets.getById("ai_datacenter_lease")
        assertNotNull(scenario)
        assertEquals("ai_datacenter_lease", scenario.id)
        assertEquals("Елена Воронова", scenario.opponentName)
        assertEquals("Аренда мощностей под ЦОД и ИИ (Елена Воронова)", scenario.title)
        assertTrue(scenario.initialOpponentUtterance.contains("15 МВт"), "Must mention 15 MW capacity")
        assertEquals(480, scenario.batna.minPricePerSqm) // 4.80 rub/kWh encoded as 480
        assertEquals(4, scenario.agendaTopics.size)
    }

    @Test
    fun testSpeechNoBracketPlaceholdersInHints() {
        for (scenario in ScenarioPresets.list) {
            // Verify default dynamic hints from helper
            val hints = getDefaultHintsForScenario(scenario)
            assertTrue(hints.isNotEmpty(), "Hints list must not be empty for '${scenario.id}'")
            for (hint in hints) {
                assertFalse(
                    hint.contains("[") || hint.contains("]"),
                    "Default hint in scenario '${scenario.id}' must not contain bracket placeholders: '$hint'"
                )
                assertTrue(hint.length > 20, "Hint must be substantial: '$hint'")
            }
        }
    }

    @Test
    fun testAiSpeechPersonaConsistency() {
        val geminiService = KtorGeminiService()
        val metrics = NegotiationMetrics(trust = 50, tension = 40, dealReadiness = 40)

        for (scenario in ScenarioPresets.list) {
            val fallback = geminiService.createDynamicContextFallback(
                userMessage = "Мы готовы согласовать встречный график поставки при условии жестких гарантий и договора.",
                config = scenario,
                currentMetrics = metrics
            )

            assertNotNull(fallback)
            val replyText = fallback.getResolvedReply()
            assertTrue(replyText.isNotBlank(), "Opponent reply must not be blank for ${scenario.id}")
            assertFalse(
                replyText.contains("[") || replyText.contains("]"),
                "Reply must not contain placeholders: '$replyText'"
            )

            val barsFeedback = fallback.barsFeedback
            assertTrue(barsFeedback.isNotBlank(), "B.A.R.S. feedback must not be blank for ${scenario.id}")

            assertTrue(fallback.dynamicHints.isNotEmpty(), "Dynamic hints must be provided")
            for (hint in fallback.dynamicHints) {
                assertFalse(
                    hint.contains("[") || hint.contains("]"),
                    "Fallback hint must not contain bracket placeholders: '$hint'"
                )
            }
        }
    }

    @Test
    fun testB2BBazaarCensorAlgorithm() {
        // Bazaar trading: pure numbers or raw prices without arguments
        val bazaarInputs = listOf(
            "450",
            "380 р",
            "500 руб/м2",
            "+10%",
            "Давайте 460",
            "Сделайте скидку",
            "Дешевле никак?"
        )

        for (input in bazaarInputs) {
            val trimmed = input.trim()
            val words = trimmed.split(Regex("\\s+")).filter { it.isNotBlank() }
            val isJustNumber = trimmed.matches(Regex("^[+\\-~]?\\s*\\d+(?:[.,]\\d+)?\\s*(?:[рp₽]|руб(?:лей|ля|ль)?(?:\\s*\\/\\s*м[²2]?)?)?\\.?$", RegexOption.IGNORE_CASE))
            val hasB2BKeywords = trimmed.contains("если", ignoreCase = true) ||
                    trimmed.contains("взамен", ignoreCase = true) ||
                    trimmed.contains("при условии", ignoreCase = true) ||
                    trimmed.contains("гарант", ignoreCase = true) ||
                    trimmed.contains("готовы", ignoreCase = true) ||
                    trimmed.contains("предлагаем", ignoreCase = true) ||
                    trimmed.contains("capex", ignoreCase = true) ||
                    trimmed.contains("каникул", ignoreCase = true) ||
                    trimmed.contains("тариф", ignoreCase = true) ||
                    trimmed.contains("мощност", ignoreCase = true) ||
                    trimmed.contains("срок", ignoreCase = true)
            val isBazaar = isJustNumber || (words.size < 4 && !hasB2BKeywords)

            assertTrue(isBazaar, "Input '$input' should be detected as bazaar trading")
        }

        // Valid B2B argumentation
        val validB2BInputs = listOf(
            "Мы готовы согласовать ставку 460 ₽/м², если вы подтвердите объем инвестиций от 800 млн ₽ в первый год.",
            "Предлагаем тариф 4.80 ₽/кВт⋅ч при условии PUE не выше 1.25.",
            "Готовы предоставить каникулы на 3 месяца взамен на обязательство по штату.",
            "Мы подключаем 8 МВт при гарантии встречного CAPEX 1.2 млрд рублей."
        )

        for (input in validB2BInputs) {
            val trimmed = input.trim()
            val words = trimmed.split(Regex("\\s+")).filter { it.isNotBlank() }
            val isJustNumber = trimmed.matches(Regex("^[+\\-~]?\\s*\\d+(?:[.,]\\d+)?\\s*(?:[рp₽]|руб(?:лей|ля|ль)?(?:\\s*\\/\\s*м[²2]?)?)?\\.?$", RegexOption.IGNORE_CASE))
            val hasB2BKeywords = trimmed.contains("если", ignoreCase = true) ||
                    trimmed.contains("взамен", ignoreCase = true) ||
                    trimmed.contains("при условии", ignoreCase = true) ||
                    trimmed.contains("гарант", ignoreCase = true) ||
                    trimmed.contains("готовы", ignoreCase = true) ||
                    trimmed.contains("предлагаем", ignoreCase = true) ||
                    trimmed.contains("capex", ignoreCase = true) ||
                    trimmed.contains("каникул", ignoreCase = true) ||
                    trimmed.contains("тариф", ignoreCase = true) ||
                    trimmed.contains("мощност", ignoreCase = true) ||
                    trimmed.contains("срок", ignoreCase = true)
            val isBazaar = isJustNumber || (words.size < 4 && !hasB2BKeywords)

            assertFalse(isBazaar, "Valid input '$input' must NOT be detected as bazaar trading")
        }
    }

    @Test
    fun testScenarioAchievementsSystem() {
        val scenario = ScenarioPresets.getById("ai_datacenter_lease")!!
        val achievements = getScenarioAchievements(
            scenarioId = scenario.id,
            batnaMin = scenario.batna.minPricePerSqm,
            currentOffer = 490,
            metrics = NegotiationMetrics(trust = 75, tension = 20, dealReadiness = 80),
            currentStep = 5,
            rating = "S",
            isRateAgreed = true,
            isPowerCapexAgreed = true
        )

        assertEquals(5, achievements.size, "Must have 5 achievements")
        val ids = achievements.map { it.id }
        assertTrue(ids.contains("batna_shield"))
        assertTrue(ids.contains("bluff_buster"))
        assertTrue(ids.contains("hidden_pain"))
        assertTrue(ids.contains("power_capex"))
        assertTrue(ids.contains("grandmaster_s"))

        // For this winning outcome, all should be unlocked
        for (ach in achievements) {
            assertTrue(ach.isUnlocked, "Achievement ${ach.id} should be unlocked on successful S-rank round")
        }
    }
}

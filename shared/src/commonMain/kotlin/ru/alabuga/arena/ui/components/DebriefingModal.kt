package ru.alabuga.arena.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ru.alabuga.arena.model.AchievementTier
import ru.alabuga.arena.model.DebriefingReport
import ru.alabuga.arena.model.ScenarioConfig
import ru.alabuga.arena.util.exportPdfReport

@Composable
fun DebriefingModal(
    report: DebriefingReport,
    scenario: ScenarioConfig,
    onRestart: () -> Unit,
    onClose: () -> Unit
) {
    var pdfDownloaded by remember { mutableStateOf(false) }

    val gradeColor = when (report.overallRating) {
        "S" -> Color(0xFF00F0FF)
        "A" -> Color(0xFF10B981)
        "B" -> Color(0xFFFBBF24)
        else -> Color(0xFFFF3366)
    }

    val trustVal = report.batnaScore
    val tensionVal = 100 - report.stressManagementScore
    val readinessVal = if (report.finalOutcome == "WON") 92 else 65

    val outcomeText = when (report.finalOutcome) {
        "WON" -> "СДЕЛКА ЗАКЛЮЧЕНА"
        "FAILED" -> "ПРОВАЛ ПЕРЕГОВОРОВ"
        else -> "КОМПРОМИСС"
    }

    val outcomeColor = when (report.finalOutcome) {
        "WON" -> Color(0xFF00FFCC)
        "FAILED" -> Color(0xFFFF3366)
        else -> Color(0xFFC084FC)
    }

    val outcomeBg = when (report.finalOutcome) {
        "WON" -> Color(0xFF064E3B).copy(alpha = 0.55f)
        "FAILED" -> Color(0xFF450A0A).copy(alpha = 0.55f)
        else -> Color(0xFF2E1065).copy(alpha = 0.55f)
    }

    val tensionColor = when {
        tensionVal >= 60 -> Color(0xFFFF3366)
        tensionVal >= 40 -> Color(0xFFFBBF24)
        else -> Color(0xFFA78BFA)
    }

    val weakZones = listOf(
        "Склонность к преждевременному согласию на арендные каникулы без получения встречных инвестиционных гарантий.",
        "Недостаточно жесткая фиксация срока ввода мощностей 110 кВ в первом раунде диалога."
    )

    val recommendations = listOf(
        "Всегда привязывайте скидку к твердым обязательствам по CAPEX не менее 1.2 млрд ₽.",
        "Не допускайте превышения льготного периода свыше 4 месяцев (граница BATNA ОЭЗ).",
        "При повторной попытке оппонента блефовать альтернативными площадками сразу оперируйте дефицитом сетей конкурентов."
    )

    val pdfInteractionSource = remember { MutableInteractionSource() }
    val isPdfHovered by pdfInteractionSource.collectIsHoveredAsState()
    val isPdfPressed by pdfInteractionSource.collectIsPressedAsState()
    val pdfScale by animateFloatAsState(
        targetValue = if (isPdfPressed) 0.95f else if (isPdfHovered) 1.03f else 1f,
        label = "pdfScale"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.85f))
            .clickable { onClose() },
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier
                .widthIn(max = 760.dp)
                .fillMaxWidth(0.94f)
                .fillMaxHeight(0.92f)
                .clickable(enabled = false) {},
            shape = RoundedCornerShape(24.dp),
            color = Color(0xFF0A0D18),
            border = BorderStroke(
                1.dp,
                Brush.linearGradient(listOf(Color(0xFF7B2CBF).copy(alpha = 0.6f), Color(0xFF00FFCC).copy(alpha = 0.35f)))
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 1. Header + Prominent PDF Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFF161B30))
                                .border(1.dp, Color(0xFF00FFCC).copy(alpha = 0.5f), RoundedCornerShape(14.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Analytics,
                                contentDescription = null,
                                tint = Color(0xFF00FFCC),
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Column {
                            Text(
                                text = "ИТОГОВЫЙ ДЕБРИФИНГ ПЕРЕГОВОРОВ",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White,
                                letterSpacing = 0.5.sp
                            )
                            Text(
                                text = "Аналитический Neo-B2B отчет тактического наставника Б.А.Р.С.",
                                fontSize = 11.sp,
                                color = Color(0xFF94A3B8)
                            )
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Неоновая кнопка «📥 СКАЧАТЬ PDF»
                        Surface(
                            modifier = Modifier
                                .scale(pdfScale)
                                .clip(RoundedCornerShape(12.dp))
                                .clickable(
                                    interactionSource = pdfInteractionSource,
                                    indication = null
                                ) {
                                    pdfDownloaded = true
                                    exportPdfReport(
                                        scenario.name,
                                        scenario.opponentName,
                                        report.finalOutcome,
                                        report.overallRating,
                                        report.totalSteps,
                                        trustVal,
                                        tensionVal,
                                        readinessVal,
                                        report.barsExecutiveSummary,
                                        weakZones.joinToString("<br/>• ", prefix = "• "),
                                        recommendations.joinToString("<br/>• ", prefix = "• ")
                                    )
                                },
                            shape = RoundedCornerShape(12.dp),
                            color = if (pdfDownloaded) Color(0xFF064E3B) else Color.Transparent,
                            border = BorderStroke(
                                1.dp,
                                if (pdfDownloaded) Color(0xFF10B981) else Color(0xFF00FFCC).copy(alpha = 0.7f)
                            )
                        ) {
                            Box(
                                modifier = Modifier
                                    .background(
                                        if (pdfDownloaded) Brush.horizontalGradient(listOf(Color(0xFF064E3B), Color(0xFF047857)))
                                        else Brush.horizontalGradient(listOf(Color(0xFF7B2CBF), Color(0xFF00F0FF).copy(alpha = 0.85f)))
                                    )
                                    .padding(horizontal = 14.dp, vertical = 9.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(
                                        imageVector = if (pdfDownloaded) Icons.Default.Check else Icons.Default.FileDownload,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = if (pdfDownloaded) "PDF СФОРМИРОВАН" else "📥 СКАЧАТЬ PDF",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color.White,
                                        letterSpacing = 0.6.sp
                                    )
                                }
                            }
                        }

                        IconButton(onClick = onClose) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Закрыть", tint = Color(0xFF64748B))
                        }
                    }
                }

                // 2. Верхний блок метрик (4 карточки: Результат + Доверие + Стресс + Готовность)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Карточка 1: РЕЗУЛЬТАТ СДЕЛКИ
                    Surface(
                        modifier = Modifier.weight(1.3f),
                        shape = RoundedCornerShape(16.dp),
                        color = outcomeBg,
                        border = BorderStroke(1.dp, outcomeColor.copy(alpha = 0.6f))
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "РЕЗУЛЬТАТ",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF94A3B8),
                                fontFamily = FontFamily.Monospace,
                                letterSpacing = 1.sp
                            )
                            Text(
                                text = outcomeText,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black,
                                color = outcomeColor,
                                textAlign = TextAlign.Center,
                                maxLines = 1,
                                letterSpacing = 0.5.sp
                            )
                            Text(
                                text = "Шагов: ${report.totalSteps} • Ранг: ${report.overallRating}",
                                fontSize = 11.sp,
                                color = Color(0xFFCBD5E1),
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }

                    // Карточка 2: ДОВЕРИЕ
                    Surface(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0xFF121626).copy(alpha = 0.7f),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f))
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("ДОВЕРИЕ", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8), fontFamily = FontFamily.Monospace)
                            Text("$trustVal%", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF00F0FF), fontFamily = FontFamily.Monospace)
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(4.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF1E2640))
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxHeight()
                                        .fillMaxWidth((trustVal / 100f).coerceIn(0.05f, 1f))
                                        .clip(CircleShape)
                                        .background(Brush.horizontalGradient(listOf(Color(0xFF00F0FF), Color(0xFF00FFCC))))
                                )
                            }
                        }
                    }

                    // Карточка 3: СТРЕСС
                    Surface(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0xFF121626).copy(alpha = 0.7f),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f))
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("СТРЕСС", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8), fontFamily = FontFamily.Monospace)
                            Text("$tensionVal%", fontSize = 20.sp, fontWeight = FontWeight.Black, color = tensionColor, fontFamily = FontFamily.Monospace)
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(4.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF1E2640))
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxHeight()
                                        .fillMaxWidth((tensionVal / 100f).coerceIn(0.05f, 1f))
                                        .clip(CircleShape)
                                        .background(Brush.horizontalGradient(listOf(Color(0xFF7B2CBF), tensionColor)))
                                )
                            }
                        }
                    }

                    // Карточка 4: ГОТОВНОСТЬ
                    Surface(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0xFF121626).copy(alpha = 0.7f),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f))
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("ГОТОВНОСТЬ", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8), fontFamily = FontFamily.Monospace)
                            Text("$readinessVal%", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF10B981), fontFamily = FontFamily.Monospace)
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(4.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF1E2640))
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxHeight()
                                        .fillMaxWidth((readinessVal / 100f).coerceIn(0.05f, 1f))
                                        .clip(CircleShape)
                                        .background(Brush.horizontalGradient(listOf(Color(0xFF10B981), Color(0xFF00FFCC))))
                                )
                            }
                        }
                    }
                }

                // 3. Блок: РЕЗЮМЕ НАСТАВНИКА Б.А.Р.С. (Glassmorphism, Minimalist Vector Icon)
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF131728).copy(alpha = 0.65f),
                    border = BorderStroke(1.dp, Color(0xFF00FFCC).copy(alpha = 0.35f))
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Analytics,
                                contentDescription = null,
                                tint = Color(0xFF00FFCC),
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = "АНАЛИТИЧЕСКОЕ РЕЗЮМЕ НАСТАВНИКА Б.А.Р.С.",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF00FFCC),
                                fontFamily = FontFamily.Monospace,
                                letterSpacing = 0.8.sp
                            )
                        }
                        Text(
                            text = report.barsExecutiveSummary,
                            fontSize = 13.sp,
                            color = Color(0xFFE2E8F0),
                            lineHeight = 20.sp
                        )
                    }
                }

                // 4. Блок: СЛАБЫЕ ЗОНЫ И ПЕРЕГОВОРНЫЕ РИСКИ (Внутреннее свечение, маркеры)
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF24141E).copy(alpha = 0.60f),
                    border = BorderStroke(1.dp, Color(0xFFEF4444).copy(alpha = 0.40f))
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.WarningAmber,
                                contentDescription = null,
                                tint = Color(0xFFF59E0B),
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = "ВЫЯВЛЕННЫЕ СЛАБЫЕ ЗОНЫ И РИСКИ",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFF59E0B),
                                fontFamily = FontFamily.Monospace,
                                letterSpacing = 0.8.sp
                            )
                        }

                        weakZones.forEach { zone ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Text(
                                    text = "—",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFFF3366)
                                )
                                Text(
                                    text = zone,
                                    fontSize = 13.sp,
                                    color = Color(0xFFCBD5E1),
                                    lineHeight = 19.sp
                                )
                            }
                        }
                    }
                }

                // 5. Блок: ТАКТИЧЕСКИЕ РЕКОМЕНДАЦИИ ДЛЯ B2B-СДЕЛОК
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF19142E).copy(alpha = 0.60f),
                    border = BorderStroke(1.dp, Color(0xFF9D4EDD).copy(alpha = 0.40f))
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.AutoAwesome,
                                contentDescription = null,
                                tint = Color(0xFFC084FC),
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = "ТАКТИЧЕСКИЕ РЕКОМЕНДАЦИИ ДЛЯ B2B-СДЕЛОК",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFC084FC),
                                fontFamily = FontFamily.Monospace,
                                letterSpacing = 0.8.sp
                            )
                        }

                        recommendations.forEach { rec ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Text(
                                    text = "—",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF00FFCC)
                                )
                                Text(
                                    text = rec,
                                    fontSize = 13.sp,
                                    color = Color(0xFFCBD5E1),
                                    lineHeight = 19.sp
                                )
                            }
                        }
                    }
                }

                // 6. Достижения (Achievements)
                if (report.achievements.isNotEmpty()) {
                    Text(
                        text = "РАЗБЛОКИРОВАННЫЕ ДОСТИЖЕНИЯ",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF94A3B8),
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )

                    report.achievements.forEach { ach ->
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (ach.isUnlocked) Color(0xFF141A2E) else Color(0xFF0E111B),
                            border = BorderStroke(1.dp, if (ach.isUnlocked) Color(0xFF00FFCC).copy(alpha = 0.4f) else Color.White.copy(alpha = 0.04f))
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        imageVector = if (ach.isUnlocked) Icons.Default.EmojiEvents else Icons.Default.Lock,
                                        contentDescription = null,
                                        tint = if (ach.isUnlocked) Color(0xFFFBBF24) else Color(0xFF475569),
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Column {
                                        Text(ach.title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = if (ach.isUnlocked) Color.White else Color(0xFF64748B))
                                        Text(ach.description, fontSize = 11.sp, color = if (ach.isUnlocked) Color(0xFF94A3B8) else Color(0xFF475569))
                                    }
                                }
                                if (ach.isUnlocked) {
                                    Text(
                                        text = when (ach.tier) {
                                            AchievementTier.LEGENDARY -> "LEGEND"
                                            AchievementTier.EPIC -> "EPIC"
                                            else -> "RARE"
                                        },
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (ach.tier == AchievementTier.LEGENDARY) Color(0xFFFBBF24) else Color(0xFF00FFCC),
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                            }
                        }
                    }
                }

                // 7. Footer Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onClose) {
                        Text("Закрыть", color = Color(0xFF94A3B8), fontSize = 13.sp)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { onRestart(); onClose() },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7B2CBF)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(imageVector = Icons.Default.RestartAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Начать заново", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

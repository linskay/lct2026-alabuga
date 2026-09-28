package ru.alabuga.arena.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.RestartAlt
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ru.alabuga.arena.model.DebriefingReport
import ru.alabuga.arena.model.ScenarioConfig

@Composable
fun DebriefingModal(
    report: DebriefingReport,
    scenario: ScenarioConfig,
    onRestart: () -> Unit,
    onClose: () -> Unit
) {
    val gradeColor = when (report.overallRating) {
        "S" -> Color(0xFF00F0FF)
        "A" -> Color(0xFF10B981)
        "B" -> Color(0xFFFBBF24)
        else -> Color(0xFFFF3366)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.8f))
            .clickable { onClose() },
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier
                .widthIn(max = 600.dp)
                .fillMaxWidth(0.9f)
                .clickable(enabled = false) {},
            shape = RoundedCornerShape(24.dp),
            color = Color(0xFF131625),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.5f))
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header
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
                                .size(40.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFF7B2CBF).copy(alpha = 0.2f))
                                .border(1.dp, Color(0xFF7B2CBF), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.EmojiEvents,
                                contentDescription = null,
                                tint = Color(0xFFD8B4FE),
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Column {
                            Text(
                                text = "ИТОГОВЫЙ ДЕБРИФИНГ ПЕРЕГОВОРОВ",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "Аналитический отчет тактического наставника Б.А.Р.С.",
                                fontSize = 11.sp,
                                color = Color(0xFF94A3B8)
                            )
                        }
                    }

                    IconButton(onClick = onClose) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Закрыть", tint = Color.Gray)
                    }
                }

                // Banner с результатом и грейдом
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF0C0E18),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF282F48))
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text("ИТОГ СЕССИИ", fontSize = 10.sp, color = Color(0xFF94A3B8), fontFamily = FontFamily.Monospace)
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = Color(0xFF10B981),
                                    modifier = Modifier.size(18.dp)
                                )
                                Text(
                                    text = if (report.finalOutcome == "WON") "Сделка успешно согласована!" else "Переговоры завершены",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                            Text(
                                text = "Шагов: ${report.totalSteps} • Откатов времени: ${report.timeTravelUsedCount}",
                                fontSize = 11.sp,
                                color = Color(0xFF94A3B8),
                                fontFamily = FontFamily.Monospace
                            )
                        }

                        // Grade badge
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(gradeColor.copy(alpha = 0.15f))
                                .border(2.dp, gradeColor, RoundedCornerShape(16.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = report.overallRating,
                                fontSize = 28.sp,
                                fontWeight = FontWeight.Black,
                                color = gradeColor,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }

                // Прогресс-бары BATNA и стресс-менеджмента
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Surface(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        color = Color(0xFF161A2B),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF282F48))
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Icon(imageVector = Icons.Default.Shield, contentDescription = null, tint = Color(0xFF00F0FF), modifier = Modifier.size(14.dp))
                                    Text("Защита BATNA", fontSize = 11.sp, color = Color(0xFFE2E8F0))
                                }
                                Text("${report.batnaScore}%", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00F0FF), fontFamily = FontFamily.Monospace)
                            }
                            Box(modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)).background(Color(0xFF0A0C16))) {
                                Box(modifier = Modifier.fillMaxHeight().fillMaxWidth(report.batnaScore / 100f).background(Color(0xFF00F0FF)))
                            }
                        }
                    }

                    Surface(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        color = Color(0xFF161A2B),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF282F48))
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Стресс-контроль", fontSize = 11.sp, color = Color(0xFFE2E8F0))
                                Text("${report.stressManagementScore}%", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981), fontFamily = FontFamily.Monospace)
                            }
                            Box(modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)).background(Color(0xFF0A0C16))) {
                                Box(modifier = Modifier.fillMaxHeight().fillMaxWidth(report.stressManagementScore / 100f).background(Color(0xFF10B981)))
                            }
                        }
                    }
                }

                // Резюме Б.А.Р.С.
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = Color(0xFF7B2CBF).copy(alpha = 0.1f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.4f))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "ЗАКЛЮЧЕНИЕ НАСТАВНИКА Б.А.Р.С.:",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFD8B4FE),
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = report.barsExecutiveSummary,
                            fontSize = 12.sp,
                            color = Color(0xFFE2E8F0),
                            lineHeight = 17.sp
                        )
                    }
                }

                // Секция достижений (Ачивки ОЭЗ «Алабуга»)
                if (report.achievements.isNotEmpty()) {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0xFF10121A),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF2B3046))
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.EmojiEvents,
                                        contentDescription = null,
                                        tint = Color(0xFFFBBF24),
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Column {
                                        Text(
                                            "ДОСТИЖЕНИЯ РАУНДА (ОЭЗ «АЛАБУГА»)",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White,
                                            fontFamily = FontFamily.Monospace
                                        )
                                        Text(
                                            "Геймификация тактических побед и удержания BATNA",
                                            fontSize = 10.sp,
                                            color = Color(0xFF94A3B8)
                                        )
                                    }
                                }

                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = Color(0xFF7B2CBF).copy(alpha = 0.2f),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.4f))
                                ) {
                                    Text(
                                        text = "${report.achievements.count { it.isUnlocked }} / ${report.achievements.size} открыто",
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFFD8B4FE),
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                            }

                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                report.achievements.forEach { ach ->
                                    val tierColor = when (ach.tier) {
                                        ru.alabuga.arena.model.AchievementTier.LEGENDARY -> Color(0xFFF59E0B)
                                        ru.alabuga.arena.model.AchievementTier.EPIC -> Color(0xFFA855F7)
                                        ru.alabuga.arena.model.AchievementTier.RARE -> Color(0xFF06B6D4)
                                    }

                                    Surface(
                                        shape = RoundedCornerShape(12.dp),
                                        color = if (ach.isUnlocked) tierColor.copy(alpha = 0.12f) else Color(0xFF0B0C10),
                                        border = androidx.compose.foundation.BorderStroke(
                                            1.dp,
                                            if (ach.isUnlocked) tierColor.copy(alpha = 0.5f) else Color(0xFF1E2235)
                                        )
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(10.dp),
                                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(36.dp)
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .background(if (ach.isUnlocked) tierColor.copy(alpha = 0.2f) else Color(0xFF1A1D2E))
                                                    .border(1.dp, if (ach.isUnlocked) tierColor else Color.Gray.copy(alpha = 0.3f), RoundedCornerShape(8.dp)),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Icon(
                                                    imageVector = if (ach.isUnlocked) Icons.Default.CheckCircle else Icons.Default.Shield,
                                                    contentDescription = null,
                                                    tint = if (ach.isUnlocked) tierColor else Color.Gray,
                                                    modifier = Modifier.size(18.dp)
                                                )
                                            }

                                            Column(modifier = Modifier.weight(1f)) {
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                ) {
                                                    Text(
                                                        ach.title,
                                                        fontSize = 12.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = if (ach.isUnlocked) Color.White else Color(0xFF94A3B8)
                                                    )
                                                    Surface(
                                                        shape = RoundedCornerShape(4.dp),
                                                        color = tierColor.copy(alpha = 0.2f)
                                                    ) {
                                                        Text(
                                                            ach.tier.name,
                                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp),
                                                            fontSize = 8.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            color = tierColor,
                                                            fontFamily = FontFamily.Monospace
                                                        )
                                                    }
                                                }
                                                Text(
                                                    ach.subtitle,
                                                    fontSize = 10.sp,
                                                    color = Color(0xFF94A3B8)
                                                )
                                                Text(
                                                    ach.description,
                                                    fontSize = 10.sp,
                                                    color = Color(0xFFCBD5E1),
                                                    lineHeight = 13.sp
                                                )
                                                Text(
                                                    if (ach.isUnlocked) "✓ Разблокировано" else "Цель: ${ach.conditionText}",
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = if (ach.isUnlocked) Color(0xFF34D399) else Color(0xFF64748B),
                                                    fontFamily = FontFamily.Monospace
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }


                // Кнопки действий
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onClose) {
                        Text("Вернуться в арену", color = Color(0xFF94A3B8), fontSize = 12.sp)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { onRestart(); onClose() },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7B2CBF)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(imageVector = Icons.Default.RestartAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Начать заново", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

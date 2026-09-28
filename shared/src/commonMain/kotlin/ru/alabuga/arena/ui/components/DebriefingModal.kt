package ru.alabuga.arena.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
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

    val weakZonesText = "1. Склонность к преждевременному согласию на каникулы без получения встречных инвестиционных гарантий.<br/>2. Недостаточно жесткая фиксация срока ввода мощностей 110 кВ в первом раунде диалога."
    val recommendationsText = "• Всегда привязывайте скидку к обязательствам по CAPEX не менее 1.2 млрд ₽.<br/>• Не допускайте превышения льготного периода свыше 4 месяцев (граница BATNA ОЭЗ).<br/>• При повторной попытке оппонента блефовать альтернативными площадками сразу оперируйте дефицитом сетей конкурентов."

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.82f))
            .clickable { onClose() },
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier
                .widthIn(max = 680.dp)
                .fillMaxWidth(0.92f)
                .clickable(enabled = false) {},
            shape = RoundedCornerShape(24.dp),
            color = Color(0xFF0F121F),
            border = BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.5f))
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header + PDF Download Action
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
                    border = BorderStroke(1.dp, Color(0xFF282F48))
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

                        // Ранг
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = gradeColor.copy(alpha = 0.15f),
                            border = BorderStroke(1.5.dp, gradeColor)
                        ) {
                            Column(
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text("РАНГ", fontSize = 9.sp, color = gradeColor, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                Text(report.overallRating, fontSize = 24.sp, fontWeight = FontWeight.Black, color = gradeColor, fontFamily = FontFamily.Monospace)
                            }
                        }
                    }
                }

                // Резюме Наставника Б.А.Р.С.
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = Color(0xFF16192B),
                    border = BorderStroke(1.dp, Color(0xFF00F0FF).copy(alpha = 0.3f))
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(modifier = Modifier.size(6.dp).clip(RoundedCornerShape(3.dp)).background(Color(0xFF00F0FF)))
                            Text(
                                text = "РЕКОМЕНДАЦИИ НАСТАВНИКА Б.А.Р.С.",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF00F0FF),
                                fontFamily = FontFamily.Monospace
                            )
                        }
                        Text(
                            text = report.barsExecutiveSummary,
                            fontSize = 12.sp,
                            color = Color(0xFFE2E8F0),
                            lineHeight = 18.sp
                        )
                    }
                }

                // Кнопки действий + Скачать PDF
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(
                        onClick = {
                            pdfDownloaded = true
                            exportPdfReport(
                                scenario.name,
                                scenario.opponentName,
                                report.finalOutcome,
                                report.overallRating,
                                report.totalSteps,
                                report.batnaScore,
                                100 - report.stressManagementScore,
                                if (report.finalOutcome == "WON") 90 else 55,
                                report.barsExecutiveSummary,
                                weakZonesText,
                                recommendationsText
                            )
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (pdfDownloaded) Color(0xFF10B981) else Color(0xFF00F0FF).copy(alpha = 0.2f),
                            contentColor = if (pdfDownloaded) Color.White else Color(0xFF00F0FF)
                        ),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, if (pdfDownloaded) Color(0xFF10B981) else Color(0xFF00F0FF))
                    ) {
                        Icon(imageVector = if (pdfDownloaded) Icons.Default.Check else Icons.Default.FileDownload, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(if (pdfDownloaded) "PDF ОТЧЕТ ВЫГРУЖЕН" else "📥 СКАЧАТЬ PDF РЕЗУЛЬТАТОВ", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = onClose) {
                            Text("Закрыть", color = Color(0xFF94A3B8), fontSize = 12.sp)
                        }
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
}

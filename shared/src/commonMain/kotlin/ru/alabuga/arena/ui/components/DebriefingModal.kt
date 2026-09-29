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

    // Динамические, сценарио-зависимые слабые зоны и риски
    val weakZones = remember(report, scenario) {
        val list = mutableListOf<String>()
        if (report.batnaScore < 85) {
            val redLine = scenario.batna.redLines.firstOrNull() ?: "Граница BATNA"
            list.add("Склонность к поспешным односторонним уступкам по ключевой красной линии: «$redLine».")
        }
        if (tensionVal >= 45) {
            list.add("Эмоциональная реакция на прессинг со стороны ${scenario.opponentName} и недостаточная выдержка при парировании блефа.")
        }
        if (report.totalSteps <= 2) {
            list.add("Слишком быстрое сворачивание раунда без глубокого вскрытия скрытых потребностей и ограничений проекта.")
        }
        if (list.isEmpty()) {
            list.add("Недостаточная фиксация встречных гарантий исполнения в первом раунде диалога.")
            list.add("Возможность более жесткого связывания сроков с зеркальной ответственностью оппонента.")
        }
        list
    }

    // Динамические практические рекомендации по развитию переговорных компетенций
    val recommendations = remember(report, scenario) {
        val list = mutableListOf<String>()
        list.add("Всегда применяйте формулу встречного размена (Trade-off): любая уступка возможна только в обмен на встречное обязательство оппонента.")
        if (scenario.batna.redLines.isNotEmpty()) {
            list.add("По кейсу «${scenario.name}»: держите твердый фокус на условии «${scenario.batna.redLines.first()}».")
        }
        if (tensionVal >= 40) {
            list.add("При эскалации напряжения не оправдывайтесь, а делайте паузу и переводите диалог на объективные критерии (СНиП, аудит, регламенты ОЭЗ).")
        } else {
            list.add("Удерживайте достигнутый уровень доверия (${trustVal}%), фиксируя промежуточные пункты повестки в протоколе разногласий.")
        }
        list.add("Для стабильного выхода на высший ранг S переводите споры о цене в плоскость совокупной выгоды (TCO) и преференций резидента «Алабуги».")
        list
    }

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
                .widthIn(max = 840.dp)
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.94f)
                .clickable(enabled = false) {},
            shape = RoundedCornerShape(24.dp),
            color = Color(0xFF0A0D18),
            border = BorderStroke(
                1.dp,
                Brush.linearGradient(listOf(Color(0xFF7B2CBF).copy(alpha = 0.6f), Color(0xFF00FFCC).copy(alpha = 0.35f)))
            )
        ) {
            BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
                val isCompact = maxWidth < 640.dp

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(if (isCompact) 16.dp else 24.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // 1. Header + Prominent PDF Button (Адаптивный под мобильные экраны)
                    if (isCompact) {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(38.dp)
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(Color(0xFF161B30))
                                            .border(1.dp, Color(0xFF00FFCC).copy(alpha = 0.5f), RoundedCornerShape(12.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Analytics,
                                            contentDescription = null,
                                            tint = Color(0xFF00FFCC),
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                    Text(
                                        text = "ИТОГОВЫЙ ДЕБРИФИНГ",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color.White,
                                        letterSpacing = 0.5.sp
                                    )
                                }
                                IconButton(onClick = onClose, modifier = Modifier.size(32.dp)) {
                                    Icon(imageVector = Icons.Default.Close, contentDescription = "Закрыть", tint = Color(0xFF94A3B8))
                                }
                            }

                            Text(
                                text = "Отчет наставника Б.А.Р.С. • ${scenario.name}",
                                fontSize = 11.sp,
                                color = Color(0xFF94A3B8)
                            )

                            // Кнопка «📥 СКАЧАТЬ PDF» на мобильном во всю ширину
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
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
                                        .fillMaxWidth()
                                        .background(
                                            if (pdfDownloaded) Brush.horizontalGradient(listOf(Color(0xFF064E3B), Color(0xFF047857)))
                                            else Brush.horizontalGradient(listOf(Color(0xFF7B2CBF), Color(0xFF00F0FF).copy(alpha = 0.85f)))
                                        )
                                        .padding(horizontal = 14.dp, vertical = 10.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(
                                            imageVector = if (pdfDownloaded) Icons.Default.Check else Icons.Default.FileDownload,
                                            contentDescription = null,
                                            tint = Color.White,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Text(
                                            text = if (pdfDownloaded) "PDF СФОРМИРОВАН" else "📥 СКАЧАТЬ PDF-ОТЧЕТ",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = Color.White,
                                            letterSpacing = 0.6.sp
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        // Desktop Header
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
                                        text = "Аналитический Neo-B2B отчет наставника Б.А.Р.С. • ${scenario.name}",
                                        fontSize = 11.sp,
                                        color = Color(0xFF94A3B8)
                                    )
                                }
                            }

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
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
                    }

                    // 2. Верхний блок метрик (Адаптивно: 2x2 на мобильных, 4 в ряд на десктопе)
                    if (isCompact) {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                // Карточка 1: РЕЗУЛЬТАТ
                                MetricResultCard(
                                    modifier = Modifier.weight(1f),
                                    outcomeBg = outcomeBg,
                                    outcomeColor = outcomeColor,
                                    outcomeText = outcomeText,
                                    totalSteps = report.totalSteps,
                                    overallRating = report.overallRating
                                )
                                // Карточка 2: ДОВЕРИЕ
                                MetricValueCard(
                                    modifier = Modifier.weight(1f),
                                    label = "ДОВЕРИЕ",
                                    value = "$trustVal%",
                                    valueColor = Color(0xFF00F0FF),
                                    progress = trustVal / 100f,
                                    progressColor = Color(0xFF00F0FF)
                                )
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                // Карточка 3: СТРЕСС
                                MetricValueCard(
                                    modifier = Modifier.weight(1f),
                                    label = "СТРЕСС",
                                    value = "$tensionVal%",
                                    valueColor = tensionColor,
                                    progress = tensionVal / 100f,
                                    progressColor = tensionColor
                                )
                                // Карточка 4: ГОТОВНОСТЬ
                                MetricValueCard(
                                    modifier = Modifier.weight(1f),
                                    label = "ГОТОВНОСТЬ",
                                    value = "$readinessVal%",
                                    valueColor = Color(0xFF10B981),
                                    progress = readinessVal / 100f,
                                    progressColor = Color(0xFF10B981)
                                )
                            }
                        }
                    } else {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            MetricResultCard(
                                modifier = Modifier.weight(1.3f),
                                outcomeBg = outcomeBg,
                                outcomeColor = outcomeColor,
                                outcomeText = outcomeText,
                                totalSteps = report.totalSteps,
                                overallRating = report.overallRating
                            )
                            MetricValueCard(
                                modifier = Modifier.weight(1f),
                                label = "ДОВЕРИЕ",
                                value = "$trustVal%",
                                valueColor = Color(0xFF00F0FF),
                                progress = trustVal / 100f,
                                progressColor = Color(0xFF00F0FF)
                            )
                            MetricValueCard(
                                modifier = Modifier.weight(1f),
                                label = "СТРЕСС",
                                value = "$tensionVal%",
                                valueColor = tensionColor,
                                progress = tensionVal / 100f,
                                progressColor = tensionColor
                            )
                            MetricValueCard(
                                modifier = Modifier.weight(1f),
                                label = "ГОТОВНОСТЬ",
                                value = "$readinessVal%",
                                valueColor = Color(0xFF10B981),
                                progress = readinessVal / 100f,
                                progressColor = Color(0xFF10B981)
                            )
                        }
                    }

                    // 3. Аналитическое резюме наставника Б.А.Р.С.
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0xFF121626),
                        border = BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.35f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF00FFCC))
                                )
                                Text(
                                    text = "🤖 ЗАКЛЮЧЕНИЕ ТАКТИЧЕСКОГО НАСТАВНИКА Б.А.Р.С.",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF00FFCC),
                                    fontFamily = FontFamily.Monospace,
                                    letterSpacing = 1.sp
                                )
                            }
                            Text(
                                text = report.barsExecutiveSummary,
                                fontSize = 13.sp,
                                color = Color(0xFFE2E8F0),
                                lineHeight = 19.sp
                            )
                        }
                    }

                    // 4. Слабые зоны и риски
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0xFF1C1318),
                        border = BorderStroke(1.dp, Color(0xFFFF3366).copy(alpha = 0.35f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = Color(0xFFFF3366),
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = "ВЫЯВЛЕННЫЕ СЛАБЫЕ ЗОНЫ И РИСКИ",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFFF3366),
                                    fontFamily = FontFamily.Monospace,
                                    letterSpacing = 1.sp
                                )
                            }
                            weakZones.forEach { zone ->
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.Top
                                ) {
                                    Text("—", color = Color(0xFFFF3366), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    Text(zone, fontSize = 12.sp, color = Color(0xFFCBD5E1), lineHeight = 17.sp)
                                }
                            }
                        }
                    }

                    // 5. Советы по развитию переговорных компетенций
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0xFF131D26),
                        border = BorderStroke(1.dp, Color(0xFF00F0FF).copy(alpha = 0.35f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Lightbulb,
                                    contentDescription = null,
                                    tint = Color(0xFF00F0FF),
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = "СОВЕТЫ ПО РАЗВИТИЮ ПЕРЕГОВОРНЫХ КОМПЕТЕНЦИЙ",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF00F0FF),
                                    fontFamily = FontFamily.Monospace,
                                    letterSpacing = 1.sp
                                )
                            }
                            recommendations.forEach { rec ->
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.Top
                                ) {
                                    Text("✓", color = Color(0xFF00FFCC), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    Text(rec, fontSize = 12.sp, color = Color(0xFFCBD5E1), lineHeight = 17.sp)
                                }
                            }
                        }
                    }

                    // 6. Достижения (Achievements с внедренными изображениями из репозитория)
                    if (report.achievements.isNotEmpty()) {
                        Text(
                            text = "ДОСТИЖЕНИЯ И ТРОФЕИ РАУНДА",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF94A3B8),
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 1.sp
                        )

                        report.achievements.forEach { ach ->
                            val borderColor = if (ach.isUnlocked) {
                                when (ach.tier) {
                                    AchievementTier.LEGENDARY -> Color(0xFFFBBF24).copy(alpha = 0.6f)
                                    AchievementTier.EPIC -> Color(0xFF00FFCC).copy(alpha = 0.6f)
                                    else -> Color(0xFFA78BFA).copy(alpha = 0.5f)
                                }
                            } else {
                                Color.White.copy(alpha = 0.05f)
                            }

                            val cardBg = if (ach.isUnlocked) Color(0xFF141A2E) else Color(0xFF0E111B)

                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = cardBg,
                                border = BorderStroke(1.dp, borderColor)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        // 3D/2D Картинка ачивки с эффектом блокировки
                                        Box(
                                            modifier = Modifier
                                                .size(56.dp)
                                                .clip(RoundedCornerShape(12.dp))
                                                .border(1.dp, borderColor, RoundedCornerShape(12.dp))
                                        ) {
                                            AchievementImageView(
                                                achievementId = ach.id,
                                                modifier = Modifier.fillMaxSize()
                                            )
                                            if (!ach.isUnlocked) {
                                                Box(
                                                    modifier = Modifier
                                                        .fillMaxSize()
                                                        .background(Color.Black.copy(alpha = 0.72f)),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Icon(
                                                        imageVector = Icons.Default.Lock,
                                                        contentDescription = "Заблокировано",
                                                        tint = Color(0xFF94A3B8),
                                                        modifier = Modifier.size(22.dp)
                                                    )
                                                }
                                            }
                                        }

                                        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                                            ) {
                                                Text(
                                                    text = ach.title,
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = if (ach.isUnlocked) Color.White else Color(0xFF64748B)
                                                )
                                                if (ach.subtitle.isNotBlank()) {
                                                    Text(
                                                        text = "• ${ach.subtitle}",
                                                        fontSize = 11.sp,
                                                        color = if (ach.isUnlocked) Color(0xFF00F0FF) else Color(0xFF475569)
                                                    )
                                                }
                                            }
                                            Text(
                                                text = ach.description,
                                                fontSize = 11.sp,
                                                color = if (ach.isUnlocked) Color(0xFF94A3B8) else Color(0xFF475569),
                                                lineHeight = 15.sp
                                            )
                                            if (!ach.isUnlocked && ach.conditionText.isNotBlank()) {
                                                Text(
                                                    text = "Условие: ${ach.conditionText}",
                                                    fontSize = 10.sp,
                                                    color = Color(0xFFF59E0B),
                                                    fontFamily = FontFamily.Monospace
                                                )
                                            }
                                        }
                                    }

                                    Text(
                                        text = when (ach.tier) {
                                            AchievementTier.LEGENDARY -> "LEGEND"
                                            AchievementTier.EPIC -> "EPIC"
                                            else -> "RARE"
                                        },
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (ach.tier == AchievementTier.LEGENDARY) Color(0xFFFBBF24)
                                        else if (ach.tier == AchievementTier.EPIC) Color(0xFF00FFCC)
                                        else Color(0xFFA78BFA),
                                        fontFamily = FontFamily.Monospace,
                                        modifier = Modifier.padding(start = 8.dp)
                                    )
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
}

@Composable
private fun MetricResultCard(
    modifier: Modifier,
    outcomeBg: Color,
    outcomeColor: Color,
    outcomeText: String,
    totalSteps: Int,
    overallRating: String
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        color = outcomeBg,
        border = BorderStroke(1.dp, outcomeColor.copy(alpha = 0.6f))
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
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
                fontSize = 13.sp,
                fontWeight = FontWeight.Black,
                color = outcomeColor,
                textAlign = TextAlign.Center,
                maxLines = 1,
                letterSpacing = 0.5.sp
            )
            Text(
                text = "Шагов: $totalSteps • Ранг: $overallRating",
                fontSize = 11.sp,
                color = Color(0xFFCBD5E1),
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

@Composable
private fun MetricValueCard(
    modifier: Modifier,
    label: String,
    value: String,
    valueColor: Color,
    progress: Float,
    progressColor: Color
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        color = Color(0xFF121626).copy(alpha = 0.7f),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f))
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8), fontFamily = FontFamily.Monospace)
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.Black, color = valueColor, fontFamily = FontFamily.Monospace)
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
                        .fillMaxWidth(progress.coerceIn(0.05f, 1f))
                        .clip(CircleShape)
                        .background(progressColor)
                )
            }
        }
    }
}

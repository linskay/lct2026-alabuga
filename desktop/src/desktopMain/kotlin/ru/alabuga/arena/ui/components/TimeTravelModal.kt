package ru.alabuga.arena.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.RestartAlt
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
import ru.alabuga.arena.model.Message
import ru.alabuga.arena.model.MessageActor

@Composable
fun TimeTravelModal(
    messages: List<Message>,
    currentStep: Int,
    onRollback: (Int) -> Unit,
    onClose: () -> Unit
) {
    val steps = messages.groupBy { it.stepIndex }.toSortedMap()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.75f))
            .clickable { onClose() },
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier
                .widthIn(max = 560.dp)
                .fillMaxWidth(0.9f)
                .fillMaxHeight(0.75f)
                .clickable(enabled = false) {},
            shape = RoundedCornerShape(20.dp),
            color = Color(0xFF121524),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF282F48))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                // Header
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
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0xFF00F0FF).copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.History,
                                contentDescription = null,
                                tint = Color(0xFF00F0FF),
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Column {
                            Text(
                                text = "МАШИНА ВРЕМЕНИ",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "Откатитесь назад, чтобы проверить альтернативную тактику",
                                fontSize = 11.sp,
                                color = Color(0xFF94A3B8)
                            )
                        }
                    }

                    IconButton(onClick = onClose) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Закрыть", tint = Color.Gray)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                LazyColumn(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(steps.entries.toList()) { (step, stepMessages) ->
                        val isCurrent = step == currentStep
                        val metrics = stepMessages.lastOrNull()?.snapshotMetrics

                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = if (isCurrent) Color(0xFF00F0FF).copy(alpha = 0.08f) else Color(0xFF0C0E18),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isCurrent) Color(0xFF00F0FF) else Color(0xFF282F48)
                            )
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(24.dp)
                                                .clip(CircleShape)
                                                .background(Color(0xFF7B2CBF)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = "$step",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color.White,
                                                fontFamily = FontFamily.Monospace
                                            )
                                        }
                                        Text(
                                            text = if (step == 0) "Вводный раунд" else "Раунд №$step",
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White
                                        )
                                        if (isCurrent) {
                                            Text(
                                                text = "ТЕКУЩИЙ",
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFF00F0FF),
                                                fontFamily = FontFamily.Monospace,
                                                modifier = Modifier
                                                    .background(Color(0xFF00F0FF).copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }

                                    if (!isCurrent) {
                                        Button(
                                            onClick = { onRollback(step); onClose() },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7B2CBF)),
                                            shape = RoundedCornerShape(8.dp),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                            modifier = Modifier.height(28.dp)
                                        ) {
                                            Icon(imageVector = Icons.Default.RestartAlt, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Откатить", fontSize = 11.sp)
                                        }
                                    }
                                }

                                if (metrics != null) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(Color(0xFF141829), RoundedCornerShape(8.dp))
                                            .padding(horizontal = 10.dp, vertical = 6.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("Доверие: ${metrics.trust}%", fontSize = 10.sp, color = Color(0xFF00F0FF), fontFamily = FontFamily.Monospace)
                                        Text("Стресс: ${metrics.tension}%", fontSize = 10.sp, color = Color(0xFFFF3366), fontFamily = FontFamily.Monospace)
                                        Text("Готовность: ${metrics.dealReadiness}%", fontSize = 10.sp, color = Color(0xFF10B981), fontFamily = FontFamily.Monospace)
                                    }
                                }

                                Spacer(modifier = Modifier.height(6.dp))
                                stepMessages.forEach { msg ->
                                    val prefix = when (msg.actor) {
                                        MessageActor.USER -> "[ВЫ]: "
                                        MessageActor.OPPONENT -> "[ОППОНЕНТ]: "
                                        MessageActor.BARS -> "[Б.А.Р.С.]: "
                                    }
                                    Text(
                                        text = prefix + msg.text,
                                        fontSize = 11.sp,
                                        color = Color(0xFF94A3B8),
                                        maxLines = 1
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

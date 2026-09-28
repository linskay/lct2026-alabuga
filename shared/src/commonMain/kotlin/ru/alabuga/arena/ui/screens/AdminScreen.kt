package ru.alabuga.arena.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Security
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
import ru.alabuga.arena.model.ScenarioConfig
import ru.alabuga.arena.model.ScenarioPresets

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(
    currentConfig: ScenarioConfig,
    onBack: () -> Unit,
    onStartSimulation: (ScenarioConfig) -> Unit,
    modifier: Modifier = Modifier
) {
    var config by remember { mutableStateOf(currentConfig) }
    var toughness by remember { mutableStateOf(currentConfig.toughnessLevel.toFloat()) }
    var minPrice by remember { mutableStateOf(currentConfig.batna.minPricePerSqm.toString()) }
    var maxGrace by remember { mutableStateOf(currentConfig.batna.maxGracePeriodMonths.toString()) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "КОНФИГУРАТОР ПЕРЕГОВОРОВ & BATNA",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "ОЭЗ «Алабуга» • Настройка психотипов и ограничений",
                            fontSize = 11.sp,
                            color = Color(0xFF94A3B8)
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Назад", tint = Color(0xFF00F0FF))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0A0D18))
            )
        },
        containerColor = Color(0xFF07080D)
    ) { paddingValues ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 24.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // 1. Выбор сценария
            item {
                Text(
                    text = "ГОТОВЫЕ БОЕВЫЕ СЦЕНАРИИ ОЭЗ",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF00F0FF),
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(10.dp))

                LazyRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(ScenarioPresets.list) { preset ->
                        val isSelected = preset.id == config.id
                        Surface(
                            modifier = Modifier
                                .width(240.dp)
                                .clickable {
                                    config = preset
                                    toughness = preset.toughnessLevel.toFloat()
                                    minPrice = preset.batna.minPricePerSqm.toString()
                                    maxGrace = preset.batna.maxGracePeriodMonths.toString()
                                },
                            shape = RoundedCornerShape(16.dp),
                            color = if (isSelected) Color(0xFF1B233D) else Color(0xFF101322),
                            border = androidx.compose.foundation.BorderStroke(
                                1.5.dp,
                                if (isSelected) Color(0xFF00F0FF) else Color(0xFF282F48)
                            )
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(
                                    text = preset.sphere,
                                    fontSize = 10.sp,
                                    color = Color(0xFFD8B4FE),
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = preset.name,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Text(
                                    text = "Оппонент: ${preset.opponentName}",
                                    fontSize = 11.sp,
                                    color = Color(0xFF94A3B8)
                                )
                            }
                        }
                    }
                }
            }

            // 2. Настройки жесткости и блефа
            item {
                Surface(
                    shape = RoundedCornerShape(18.dp),
                    color = Color(0xFF101322),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF282F48)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Уровень жесткости оппонента", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text("${toughness.toInt()}%", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00F0FF), fontFamily = FontFamily.Monospace)
                        }

                        Slider(
                            value = toughness,
                            onValueChange = { toughness = it },
                            valueRange = 30f..100f,
                            colors = SliderDefaults.colors(
                                thumbColor = Color(0xFF00F0FF),
                                activeTrackColor = Color(0xFF7B2CBF),
                                inactiveTrackColor = Color(0xFF1A1D2E)
                            )
                        )

                        Text(
                            text = "Психотип: ${config.personalityTone} • Трудность: ${config.difficulty}",
                            fontSize = 11.sp,
                            color = Color(0xFF94A3B8)
                        )
                    }
                }
            }

            // 3. Защита BATNA ОЭЗ
            item {
                Surface(
                    shape = RoundedCornerShape(18.dp),
                    color = Color(0xFF101322),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF282F48)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Security, contentDescription = null, tint = Color(0xFF00F0FF))
                            Text("Красные линии ОЭЗ «Алабуга» (BATNA)", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }

                        config.batna.redLines.forEach { line ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Box(modifier = Modifier.size(6.dp).clip(RoundedCornerShape(3.dp)).background(Color(0xFF00F0FF)))
                                Text(line, fontSize = 12.sp, color = Color(0xFFE2E8F0))
                            }
                        }
                    }
                }
            }

            // 4. Кнопка запуска
            item {
                Button(
                    onClick = {
                        val updated = config.copy(
                            toughnessLevel = toughness.toInt(),
                            batna = config.batna.copy(
                                minPricePerSqm = minPrice.toIntOrNull() ?: config.batna.minPricePerSqm,
                                maxGracePeriodMonths = maxGrace.toIntOrNull() ?: config.batna.maxGracePeriodMonths
                            )
                        )
                        onStartSimulation(updated)
                    },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7B2CBF))
                ) {
                    Icon(imageVector = Icons.Default.PlayArrow, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("ЗАПУСТИТЬ СИМУЛЯЦИЮ С ЭТИМИ ПАРАМЕТРАМИ", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

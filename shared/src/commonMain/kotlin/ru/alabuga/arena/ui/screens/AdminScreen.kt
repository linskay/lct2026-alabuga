package ru.alabuga.arena.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
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

    var geminiKey by remember { mutableStateOf("") }
    var openRouterKey by remember { mutableStateOf("") }
    var showGeminiKey by remember { mutableStateOf(false) }
    var showOpenRouterKey by remember { mutableStateOf(false) }
    var apiKeysSaved by remember { mutableStateOf(false) }

    val uriHandler = LocalUriHandler.current

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
        Box(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.TopCenter
        ) {
            // Ограничение максимальной ширины на десктопе (maxWidth = 1100.dp) для устранения растянутости
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .widthIn(max = 1100.dp)
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 1. Выбор сценария: Сетка LazyVerticalGrid (GridCells.Adaptive(260.dp))
                Text(
                    text = "ГОТОВЫЕ БОЕВЫЕ СЦЕНАРИИ ОЭЗ",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF00F0FF),
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.sp
                )

                LazyVerticalGrid(
                    columns = GridCells.Adaptive(260.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth().heightIn(max = 140.dp)
                ) {
                    items(ScenarioPresets.list) { preset ->
                        val isSelected = preset.id == config.id
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    config = preset
                                    toughness = preset.toughnessLevel.toFloat()
                                    minPrice = preset.batna.minPricePerSqm.toString()
                                    maxGrace = preset.batna.maxGracePeriodMonths.toString()
                                },
                            shape = RoundedCornerShape(14.dp),
                            color = if (isSelected) Color(0xFF1B233D) else Color(0xFF101322),
                            border = BorderStroke(
                                1.5.dp,
                                if (isSelected) Color(0xFF00F0FF) else Color(0xFF282F48)
                            )
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = preset.sphere,
                                    fontSize = 10.sp,
                                    color = Color(0xFFD8B4FE),
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = preset.name,
                                    fontSize = 12.sp,
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

                // 2. Компактная интерактивная шкала жесткости
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF101322),
                    border = BorderStroke(1.dp, Color(0xFF282F48)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Шкала жесткости оппонента", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
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

                // 3. РАЗДЕЛ «🔑 ИНТЕГРАЦИЯ AI & БЭКЕНДА»
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF101322),
                    border = BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.5f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Key, contentDescription = null, tint = Color(0xFF00FFCC))
                            Text("🔑 ИНТЕГРАЦИЯ AI & БЭКЕНДА", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Google Gemini API Key
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("Google Gemini API Key", fontSize = 11.sp, color = Color(0xFFCBD5E1), fontWeight = FontWeight.SemiBold)
                                OutlinedTextField(
                                    value = geminiKey,
                                    onValueChange = { geminiKey = it; apiKeysSaved = false },
                                    placeholder = { Text("AIzaSy...", fontSize = 11.sp) },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(10.dp),
                                    visualTransformation = if (showGeminiKey) VisualTransformation.None else PasswordVisualTransformation(),
                                    trailingIcon = {
                                        IconButton(onClick = { showGeminiKey = !showGeminiKey }) {
                                            Icon(
                                                imageVector = if (showGeminiKey) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                                contentDescription = null,
                                                tint = Color.Gray,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    }
                                )
                                Text(
                                    text = "🔗 Получить ключ в Google AI Studio",
                                    fontSize = 10.sp,
                                    color = Color(0xFF00F0FF),
                                    modifier = Modifier.clickable {
                                        uriHandler.openUri("https://aistudio.google.com/")
                                    }
                                )
                            }

                            // OpenRouter API Key
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("OpenRouter API Key (Резерв)", fontSize = 11.sp, color = Color(0xFFCBD5E1), fontWeight = FontWeight.SemiBold)
                                OutlinedTextField(
                                    value = openRouterKey,
                                    onValueChange = { openRouterKey = it; apiKeysSaved = false },
                                    placeholder = { Text("sk-or-v1-...", fontSize = 11.sp) },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(10.dp),
                                    visualTransformation = if (showOpenRouterKey) VisualTransformation.None else PasswordVisualTransformation(),
                                    trailingIcon = {
                                        IconButton(onClick = { showOpenRouterKey = !showOpenRouterKey }) {
                                            Icon(
                                                imageVector = if (showOpenRouterKey) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                                contentDescription = null,
                                                tint = Color.Gray,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    }
                                )
                                Text(
                                    text = "🔗 Получить ключ на OpenRouter",
                                    fontSize = 10.sp,
                                    color = Color(0xFFD8B4FE),
                                    modifier = Modifier.clickable {
                                        uriHandler.openUri("https://openrouter.ai/keys")
                                    }
                                )
                            }
                        }

                        Button(
                            onClick = { apiKeysSaved = true },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (apiKeysSaved) Color(0xFF10B981) else Color(0xFF7B2CBF)
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.align(Alignment.End)
                        ) {
                            Icon(imageVector = if (apiKeysSaved) Icons.Default.Check else Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(if (apiKeysSaved) "КЛЮЧИ СОХРАНЕНЫ" else "СОХРАНИТЬ КЛЮЧИ", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // 4. Кнопка запуска симуляции
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
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(14.dp),
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

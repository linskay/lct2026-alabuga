package ru.alabuga.arena.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import ru.alabuga.arena.model.AgendaTopic
import ru.alabuga.arena.model.AppSettings
import ru.alabuga.arena.model.BatnaRules
import ru.alabuga.arena.model.ScenarioConfig
import ru.alabuga.arena.model.ScenarioPresets
import ru.alabuga.arena.telemetry.TelemetryService
import kotlinx.coroutines.launch
import kotlin.random.Random

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(
    currentConfig: ScenarioConfig,
    onBack: () -> Unit,
    onStartSimulation: (ScenarioConfig) -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    val scenariosList = remember {
        mutableStateListOf<ScenarioConfig>().apply {
            addAll(ScenarioPresets.list)
        }
    }

    var config by remember { mutableStateOf(currentConfig) }
    var toughness by remember { mutableStateOf(currentConfig.toughnessLevel.toFloat()) }
    var minPrice by remember { mutableStateOf(currentConfig.batna.minPricePerSqm.toString()) }
    var maxGrace by remember { mutableStateOf(currentConfig.batna.maxGracePeriodMonths.toString()) }

    var geminiKey by remember { mutableStateOf(AppSettings.geminiApiKey) }
    var openRouterKey by remember { mutableStateOf(AppSettings.openRouterApiKey) }
    var showGeminiKey by remember { mutableStateOf(false) }
    var showOpenRouterKey by remember { mutableStateOf(false) }
    var apiKeysSaved by remember { mutableStateOf(AppSettings.geminiApiKey.isNotBlank() || AppSettings.openRouterApiKey.isNotBlank()) }

    var telemetryEnabled by remember { mutableStateOf(AppSettings.enableTelemetry) }
    var grafanaUrl by remember { mutableStateOf(AppSettings.grafanaEndpoint) }
    var grafanaTestStatus by remember { mutableStateOf<String?>(null) }
    var isTestingGrafana by remember { mutableStateOf(false) }
    var showPrometheusModal by remember { mutableStateOf(false) }

    var showCreateDialog by remember { mutableStateOf(false) }

    val uriHandler = LocalUriHandler.current
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterStart) {
                        Column {
                            Text(
                                text = "КОНФИГУРАТОР ПЕРЕГОВОРОВ & BATNA",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "ОЭЗ «Алабуга» • Конструктор сценариев и психотипов",
                                fontSize = 11.sp,
                                color = Color(0xFF94A3B8)
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад", tint = Color(0xFF00F0FF))
                    }
                },
                actions = {
                    Surface(
                        onClick = onBack,
                        shape = RoundedCornerShape(10.dp),
                        color = Color(0xFF1E1035).copy(alpha = 0.85f),
                        border = BorderStroke(
                            1.dp,
                            Brush.linearGradient(
                                listOf(Color(0xFF7B2CBF), Color(0xFF00F0FF).copy(alpha = 0.5f))
                            )
                        ),
                        modifier = Modifier.padding(end = 12.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = null,
                                tint = Color(0xFF00F0FF),
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = "В арену",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF00F0FF)
                            )
                        }
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
            // Центрированный контейнер с полями по бокам в веб-версии
            Column(
                modifier = Modifier
                    .fillMaxHeight()
                    .widthIn(max = 860.dp)
                    .fillMaxWidth()
                    .verticalScroll(scrollState)
                    .padding(horizontal = 24.dp, vertical = 20.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp)
            ) {
                // 1. Выбор сценария и кнопка создания нового
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "БОЕВЫЕ СЦЕНАРИИ ОЭЗ",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF00F0FF),
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 1.sp
                        )

                        // Кнопка создания нового пользовательского сценария
                        Button(
                            onClick = { showCreateDialog = true },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E1B4B)),
                            border = BorderStroke(1.dp, Color(0xFF00FFCC)),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Add, contentDescription = null, tint = Color(0xFF00FFCC), modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("СОЗДАТЬ СВОЙ СЦЕНАРИЙ", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00FFCC))
                        }
                    }

                    // Сетка сценариев
                    Column(
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        scenariosList.chunked(2).forEach { rowPresets ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                rowPresets.forEach { preset ->
                                    val isSelected = preset.id == config.id
                                    val isCustom = preset.id.startsWith("custom_")
                                    Surface(
                                        modifier = Modifier
                                            .weight(1f)
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
                                            if (isSelected) Color(0xFF00F0FF) else if (isCustom) Color(0xFF00FFCC).copy(alpha = 0.5f) else Color(0xFF282F48)
                                        )
                                    ) {
                                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = preset.sphere,
                                                    fontSize = 10.sp,
                                                    color = Color(0xFFD8B4FE),
                                                    fontFamily = FontFamily.Monospace,
                                                    fontWeight = FontWeight.SemiBold
                                                )
                                                if (isCustom) {
                                                    Text(
                                                        text = "ПОЛЬЗОВАТЕЛЬСКИЙ",
                                                        fontSize = 8.sp,
                                                        color = Color(0xFF00FFCC),
                                                        fontWeight = FontWeight.Bold,
                                                        fontFamily = FontFamily.Monospace
                                                    )
                                                }
                                            }
                                            Text(
                                                text = preset.name,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color.White
                                            )
                                            Text(
                                                text = "Оппонент: ${preset.opponentName} • ${preset.opponentCompany}",
                                                fontSize = 11.sp,
                                                color = Color(0xFF94A3B8)
                                            )
                                        }
                                    }
                                }
                                if (rowPresets.size == 1) {
                                    Spacer(modifier = Modifier.weight(1f))
                                }
                            }
                        }
                    }
                }

                // 2. Интерактивная шкала жесткости оппонента
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF101322),
                    border = BorderStroke(1.dp, Color(0xFF282F48)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Шкала жесткости оппонента", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text("${toughness.toInt()}%", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFF00F0FF), fontFamily = FontFamily.Monospace)
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

                // 3. Защита BATNA и Красных линий ОЭЗ
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF101322),
                    border = BorderStroke(1.dp, Color(0xFF282F48)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Security, contentDescription = null, tint = Color(0xFF00FFCC))
                            Text("🛡️ ПАРАМЕТРЫ BATNA & КРАСНЫЕ ЛИНИИ", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            OutlinedTextField(
                                value = minPrice,
                                onValueChange = { minPrice = it },
                                label = { Text("Мин. ставка аренды (₽/м²)") },
                                modifier = Modifier.weight(1f),
                                singleLine = true,
                                shape = RoundedCornerShape(10.dp)
                            )
                            OutlinedTextField(
                                value = maxGrace,
                                onValueChange = { maxGrace = it },
                                label = { Text("Макс. каникулы (мес.)") },
                                modifier = Modifier.weight(1f),
                                singleLine = true,
                                shape = RoundedCornerShape(10.dp)
                            )
                        }

                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text("Красные линии ОЭЗ «Алабуга»:", fontSize = 11.sp, color = Color(0xFF94A3B8), fontWeight = FontWeight.SemiBold)
                            config.batna.redLines.forEach { line ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Box(modifier = Modifier.size(6.dp).clip(RoundedCornerShape(3.dp)).background(Color(0xFF00FFCC)))
                                    Text(line, fontSize = 12.sp, color = Color(0xFFE2E8F0))
                                }
                            }
                        }
                    }
                }

                // 4. РАЗДЕЛ «🔑 ИНТЕГРАЦИЯ AI & БЭКЕНДА»
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF101322),
                    border = BorderStroke(1.dp, Color(0xFF7B2CBF).copy(alpha = 0.5f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Key, contentDescription = null, tint = Color(0xFF00FFCC))
                            Text("🔑 ИНТЕГРАЦИЯ AI & БЭКЕНДА", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(14.dp)
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
                            onClick = {
                                AppSettings.geminiApiKey = geminiKey.trim()
                                AppSettings.openRouterApiKey = openRouterKey.trim()
                                apiKeysSaved = true
                            },
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

                // 5. РАЗДЕЛ «📊 ТЕЛЕМЕТРИЯ & GRAFANA МОНИТОРИНГ»
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF101322),
                    border = BorderStroke(1.dp, Color(0xFF00F0FF).copy(alpha = 0.4f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(imageVector = Icons.Default.BarChart, contentDescription = null, tint = Color(0xFF00F0FF))
                                Text("📊 МОНИТОРИНГ & GRAFANA ТЕЛЕМЕТРИЯ", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("Потоковая телеметрия", fontSize = 11.sp, color = Color(0xFF94A3B8))
                                Spacer(modifier = Modifier.width(8.dp))
                                Switch(
                                    checked = telemetryEnabled,
                                    onCheckedChange = {
                                        telemetryEnabled = it
                                        AppSettings.enableTelemetry = it
                                    },
                                    colors = SwitchDefaults.colors(
                                        checkedThumbColor = Color(0xFF00F0FF),
                                        checkedTrackColor = Color(0xFF1E1B4B)
                                    )
                                )
                            }
                        }

                        Text(
                            text = "Сбор метрик переговоров в реальном времени: ZOPA комплаенс, уровень стресса/доверия, переговорный ранг, время реакции и вызовы LLM.",
                            fontSize = 11.sp,
                            color = Color(0xFF94A3B8)
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = grafanaUrl,
                                onValueChange = {
                                    grafanaUrl = it
                                    AppSettings.grafanaEndpoint = it
                                },
                                label = { Text("URL Grafana / Prometheus Endpoint") },
                                placeholder = { Text("http://localhost:3001") },
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp)
                            )

                            Button(
                                onClick = {
                                    isTestingGrafana = true
                                    coroutineScope.launch {
                                        val res = TelemetryService.testGrafanaConnection(grafanaUrl)
                                        grafanaTestStatus = res.second
                                        isTestingGrafana = false
                                    }
                                },
                                enabled = !isTestingGrafana,
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                                border = BorderStroke(1.dp, Color(0xFF00F0FF)),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                if (isTestingGrafana) {
                                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color(0xFF00F0FF), strokeWidth = 2.dp)
                                } else {
                                    Icon(imageVector = Icons.Default.Sensors, contentDescription = null, tint = Color(0xFF00F0FF), modifier = Modifier.size(16.dp))
                                }
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("ТЕСТ СВЯЗИ", fontSize = 11.sp, color = Color(0xFF00F0FF), fontWeight = FontWeight.Bold)
                            }
                        }

                        grafanaTestStatus?.let { status ->
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (status.contains("✅")) Color(0xFF064E3B) else Color(0xFF450A0A),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = status,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                    fontSize = 11.sp,
                                    color = Color.White
                                )
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            TextButton(
                                onClick = { showPrometheusModal = true }
                            ) {
                                Icon(imageVector = Icons.Default.Code, contentDescription = null, tint = Color(0xFF00FFCC), modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Показать Prometheus Metrics (0.0.4)", fontSize = 11.sp, color = Color(0xFF00FFCC))
                            }

                            Text(
                                text = "🔗 Открыть дашборд Grafana (3001)",
                                fontSize = 11.sp,
                                color = Color(0xFF00F0FF),
                                modifier = Modifier.clickable {
                                    uriHandler.openUri(if (grafanaUrl.isNotBlank()) grafanaUrl else "http://localhost:3001")
                                }
                            )
                        }
                    }
                }

                // 6. Кнопка запуска симуляции
                Button(
                    onClick = {
                        AppSettings.geminiApiKey = geminiKey.trim()
                        AppSettings.openRouterApiKey = openRouterKey.trim()
                        AppSettings.grafanaEndpoint = grafanaUrl.trim()
                        AppSettings.enableTelemetry = telemetryEnabled
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
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7B2CBF))
                ) {
                    Icon(imageVector = Icons.Default.PlayArrow, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("ЗАПУСТИТЬ СИМУЛЯЦИЮ С ЭТИМИ ПАРАМЕТРАМИ", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }

    // ДИАЛОГ СОЗДАНИЯ ПОЛЬЗОВАТЕЛЬСКОГО СЦЕНАРИЯ
    if (showCreateDialog) {
        CreateScenarioDialog(
            onDismiss = { showCreateDialog = false },
            onScenarioCreated = { newScenario ->
                scenariosList.add(newScenario)
                config = newScenario
                toughness = newScenario.toughnessLevel.toFloat()
                minPrice = newScenario.batna.minPricePerSqm.toString()
                maxGrace = newScenario.batna.maxGracePeriodMonths.toString()
                showCreateDialog = false
            }
        )
    }

    // ДИАЛОГ ПРОСМОТРА МЕТРИК PROMETHEUS
    if (showPrometheusModal) {
        Dialog(onDismissRequest = { showPrometheusModal = false }) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Color(0xFF0F172A),
                border = BorderStroke(1.dp, Color(0xFF00FFCC)),
                modifier = Modifier.fillMaxWidth().padding(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "PROMETHEUS METRICS EXPORT",
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF00FFCC),
                            fontFamily = FontFamily.Monospace,
                            fontSize = 13.sp
                        )
                        IconButton(onClick = { showPrometheusModal = false }) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Закрыть", tint = Color.Gray)
                        }
                    }

                    val metricsText = remember { TelemetryService.generatePrometheusMetrics() }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(280.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFF070B14))
                            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(8.dp))
                            .padding(12.dp)
                            .verticalScroll(rememberScrollState())
                    ) {
                        Text(
                            text = metricsText,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                            color = Color(0xFF38BDF8),
                            lineHeight = 14.sp
                        )
                    }

                    Button(
                        onClick = { showPrometheusModal = false },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                        border = BorderStroke(1.dp, Color(0xFF00FFCC)),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("ЗАКРЫТЬ", color = Color(0xFF00FFCC), fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun CreateScenarioDialog(
    onDismiss: () -> Unit,
    onScenarioCreated: (ScenarioConfig) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var sphere by remember { mutableStateOf("B2B / Промышленные переговоры") }
    var opponentName by remember { mutableStateOf("") }
    var opponentCompany by remember { mutableStateOf("") }
    var opponentRole by remember { mutableStateOf("") }
    var personalityTone by remember { mutableStateOf("Агрессивный манипулятор / Прагматик") }
    var difficulty by remember { mutableStateOf("Прожжённый вице-президент") }
    var initialUtterance by remember { mutableStateOf("") }
    var initialAdvice by remember { mutableStateOf("") }
    var minPriceInput by remember { mutableStateOf("460") }
    var maxGraceInput by remember { mutableStateOf("4") }
    var hint1 by remember { mutableStateOf("") }
    var hint2 by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier
                .widthIn(max = 680.dp)
                .fillMaxWidth()
                .padding(vertical = 20.dp),
            shape = RoundedCornerShape(22.dp),
            color = Color(0xFF0D1120),
            border = BorderStroke(
                1.dp,
                Brush.linearGradient(
                    listOf(Color(0xFF00FFCC).copy(alpha = 0.6f), Color(0xFF7B2CBF).copy(alpha = 0.5f))
                )
            )
        ) {
            Column(
                modifier = Modifier
                    .padding(22.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "🛠️ КОНСТРУКТОР НОВОГО СЦЕНАРИЯ",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF00FFCC),
                        fontFamily = FontFamily.Monospace
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(24.dp)) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Закрыть", tint = Color.Gray)
                    }
                }

                // Название и отрасль
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Название сценария *") },
                        placeholder = { Text("Напр. Поставка станков ЧПУ") },
                        modifier = Modifier.weight(1.2f),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = sphere,
                        onValueChange = { sphere = it },
                        label = { Text("Сфера / Отрасль") },
                        modifier = Modifier.weight(0.8f),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                // Данные оппонента
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = opponentName,
                        onValueChange = { opponentName = it },
                        label = { Text("ФИО оппонента *") },
                        placeholder = { Text("Игорь Орлов") },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = opponentCompany,
                        onValueChange = { opponentCompany = it },
                        label = { Text("Компания") },
                        placeholder = { Text("ООО ТехноПром") },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = opponentRole,
                        onValueChange = { opponentRole = it },
                        label = { Text("Должность") },
                        placeholder = { Text("Директор по закупкам") },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = personalityTone,
                        onValueChange = { personalityTone = it },
                        label = { Text("Психотип / Поведение") },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                // Первая реплика оппонента
                OutlinedTextField(
                    value = initialUtterance,
                    onValueChange = { initialUtterance = it },
                    label = { Text("Первая атакующая реплика оппонента *") },
                    placeholder = { Text("Мы согласны на контракт только при скидке 35% и отсрочке платежа на год!") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 3,
                    shape = RoundedCornerShape(10.dp)
                )

                // Совет наставника Б.А.Р.С.
                OutlinedTextField(
                    value = initialAdvice,
                    onValueChange = { initialAdvice = it },
                    label = { Text("Тактический совет наставника Б.А.Р.С.") },
                    placeholder = { Text("Оппонент блефует и давит на маржу. Не уступай цену без встречных условий!") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 3,
                    shape = RoundedCornerShape(10.dp)
                )

                // BATNA
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = minPriceInput,
                        onValueChange = { minPriceInput = it },
                        label = { Text("Мин. ставка BATNA (₽/м²)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = maxGraceInput,
                        onValueChange = { maxGraceInput = it },
                        label = { Text("Макс. каникулы BATNA (мес.)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                // Тактические подсказки
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Начальные тактические подсказки для чата:", fontSize = 11.sp, color = Color(0xFF94A3B8), fontWeight = FontWeight.SemiBold)
                    OutlinedTextField(
                        value = hint1,
                        onValueChange = { hint1 = it },
                        placeholder = { Text("Мы готовы предоставить [условие] при фиксации объемов...") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(8.dp)
                    )
                    OutlinedTextField(
                        value = hint2,
                        onValueChange = { hint2 = it },
                        placeholder = { Text("Наши финансовые гарантии и инфраструктура нивелируют риски...") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(8.dp)
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                val isValid = title.isNotBlank() && opponentName.isNotBlank() && initialUtterance.isNotBlank()

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Отмена", color = Color(0xFF94A3B8))
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Button(
                        onClick = {
                            if (isValid) {
                                val generatedId = "custom_${Random.nextInt(100000, 999999)}"
                                val newConfig = ScenarioConfig(
                                    id = generatedId,
                                    name = title.trim(),
                                    title = title.trim(),
                                    sphere = sphere.trim().ifEmpty { "B2B / Промышленные переговоры" },
                                    opponentName = opponentName.trim(),
                                    opponentCompany = opponentCompany.trim().ifEmpty { "Корпорация" },
                                    opponentRole = opponentRole.trim().ifEmpty { "ЛПР" },
                                    personalityTone = personalityTone.trim(),
                                    toughnessLevel = 80,
                                    bluffTendency = 65,
                                    difficulty = difficulty,
                                    zoneCluster = "Индустриальный кластер ОЭЗ",
                                    initialOpponentUtterance = initialUtterance.trim(),
                                    initialBarsAdvice = initialAdvice.trim().ifEmpty {
                                        "Держи красные линии BATNA и не поддавайся на эмоциональное давление оппонента!"
                                    },
                                    initialDynamicHints = listOfNotNull(
                                        hint1.trim().ifEmpty { null },
                                        hint2.trim().ifEmpty { null },
                                        "Мы готовы обсудить условия, если будут встречные гарантии объема инвестиций."
                                    ),
                                    agendaTopics = listOf(
                                        AgendaTopic("rate", "Ценовые условия сделки", "BATNA: от $minPriceInput ₽", "disputed", "Требуется согласование"),
                                        AgendaTopic("terms", "Сроки и график платежей", "BATNA: до $maxGraceInput мес.", "in_progress", "Обсуждение условий")
                                    ),
                                    batna = BatnaRules(
                                        minPricePerSqm = minPriceInput.toIntOrNull() ?: 460,
                                        maxGracePeriodMonths = maxGraceInput.toIntOrNull() ?: 4,
                                        redLines = listOf(
                                            "Не опускать ценовую планку ниже $minPriceInput ₽",
                                            "Максимальный льготный период не более $maxGraceInput мес.",
                                            "Фиксация взаимных гарантий в договоре"
                                        )
                                    )
                                )
                                onScenarioCreated(newConfig)
                            }
                        },
                        enabled = isValid,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7B2CBF)),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("СОХРАНИТЬ И ВЫБРАТЬ", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}


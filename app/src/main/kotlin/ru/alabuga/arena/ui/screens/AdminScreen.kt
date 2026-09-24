package ru.alabuga.arena.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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

    val presetList = remember {
        listOf(
            ScenarioConfig(
                id = "synergy_investor",
                name = "Якорный инвестор в «Синергию»",
                sphere = "B2B / Инвесторы ОЭЗ",
                opponentName = "Валерий Смирнов",
                opponentRole = "Вице-президент по развитию",
                opponentCompany = "ГК «ПромКомпозит»",
                toughnessLevel = 85,
                difficulty = "Прожжённый закупщик",
                initialDynamicHints = listOf(
                    "Валерий, спешка в таких инвестициях рискованна. Мы готовы рассмотреть [ставка], если вы гарантируете...",
                    "Условие ОЭЗ — не менее 1.2 млрд CAPEX в обмен на [объем мощностей]...",
                    "Давайте зафиксируем 460 ₽/м², но предусмотрим льготу [компромисс]..."
                )
            ),
            ScenarioConfig(
                id = "equipment_procurement",
                name = "Закупка оборудования ЧПУ",
                sphere = "Закупки и тендеры",
                opponentName = "Чжан Вэй",
                opponentRole = "Директор по экспорту",
                opponentCompany = "SinoMach Tech",
                toughnessLevel = 75,
                difficulty = "Тактик из Шанхая",
                initialDynamicHints = listOf(
                    "Господин Чжан, мы готовы обсуждать график поставки при условии штрафа [укажите %]...",
                    "ОЭЗ настаивает на гарантийном складе критических запчастей и бесплатном обучении [число] наладчиков...",
                    "Мы можем зафиксировать цену, если финальные 30% оплаты будут переведены после [условие]..."
                )
            ),
            ScenarioConfig(
                id = "cto_hiring",
                name = "Найм Главного конструктора",
                sphere = "HR / Наем топов",
                opponentName = "Артем Смирнов",
                opponentRole = "Ведущий архитектор систем",
                opponentCompany = "Департамент цифровизации",
                toughnessLevel = 70,
                difficulty = "Прожжённый закупщик",
                initialDynamicHints = listOf(
                    "Артем, проект масштабирования важнее рутины. Мы готовы передать тебе лидство над [проект]...",
                    "Деньги важны, но в финтехе ты будешь винтиком. Давай согласуем пересмотр грейда при условии...",
                    "Давай разгрузим тебя от ночных дежурств: наймем двух дежурных инженеров, если ты..."
                )
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "КОНФИГУРАТОР ПЕРЕГОВОРОВ",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Admin Panel • ОЭЗ «Алабуга»",
                            fontSize = 11.sp,
                            color = Color(0xFF00F0FF),
                            fontFamily = FontFamily.Monospace
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Назад",
                            tint = Color(0xFF00F0FF)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0A0D18)
                )
            )
        },
        containerColor = Color(0xFF07080D)
    ) { paddingValues ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Секция 1: Пресеты кейсов
            item {
                Text(
                    text = "ГОТОВЫЕ СЦЕНАРИИ ОЭЗ",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF94A3B8),
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(8.dp))
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    presetList.forEach { preset ->
                        val isSelected = config.id == preset.id
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = if (isSelected) Color(0xFF1E1738) else Color(0xFF101424),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isSelected) Color(0xFF9D4EDD) else Color(0xFF1E2640)
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    config = preset
                                    toughness = preset.toughnessLevel.toFloat()
                                }
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = preset.name,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    Text(
                                        text = "${preset.opponentName} • ${preset.opponentRole}",
                                        fontSize = 12.sp,
                                        color = Color(0xFF94A3B8)
                                    )
                                }
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = Color(0xFF00F0FF).copy(alpha = 0.15f),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF00F0FF).copy(alpha = 0.4f))
                                ) {
                                    Text(
                                        text = "${preset.toughnessLevel}%",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF00F0FF),
                                        fontFamily = FontFamily.Monospace,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Секция 2: Ползунок сложности
            item {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF101424),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E2640)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Жесткость оппонента (Прессинг)",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color.White
                            )
                            Text(
                                text = "${toughness.toInt()}%",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFFF5252),
                                fontFamily = FontFamily.Monospace
                            )
                        }
                        Slider(
                            value = toughness,
                            onValueChange = { toughness = it },
                            valueRange = 30f..100f,
                            colors = SliderDefaults.colors(
                                thumbColor = Color(0xFFFF5252),
                                activeTrackColor = Color(0xFFFF5252),
                                inactiveTrackColor = Color(0xFF2B3352)
                            )
                        )
                    }
                }
            }

            // Секция 3: Правила BATNA ОЭЗ
            item {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF101424),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E2640)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Security,
                                contentDescription = null,
                                tint = Color(0xFF10B981)
                            )
                            Text(
                                text = "Защита BATNA ОЭЗ «Алабуга»",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            OutlinedTextField(
                                value = minPrice,
                                onValueChange = { minPrice = it },
                                label = { Text("Мин. ставка (₽/м²)") },
                                modifier = Modifier.weight(1f),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFF10B981),
                                    unfocusedBorderColor = Color(0xFF2B3352),
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White
                                )
                            )

                            OutlinedTextField(
                                value = maxGrace,
                                onValueChange = { maxGrace = it },
                                label = { Text("Каникулы (мес.)") },
                                modifier = Modifier.weight(1f),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFF10B981),
                                    unfocusedBorderColor = Color(0xFF2B3352),
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White
                                )
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = "Красные линии:",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFF94A3B8)
                        )
                        config.batna.redLines.forEach { line ->
                            Text(
                                text = "• $line",
                                fontSize = 12.sp,
                                color = Color(0xFFCBD5E1),
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                    }
                }
            }

            // Кнопка запуска с обновленной конфигурацией
            item {
                Button(
                    onClick = {
                        val updated = config.copy(
                            toughnessLevel = toughness.toInt(),
                            batna = config.batna.copy(
                                minPricePerSqm = minPrice.toIntOrNull() ?: 460,
                                maxGracePeriodMonths = maxGrace.toIntOrNull() ?: 4
                            )
                        )
                        onStartSimulation(updated)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF00F0FF)
                    )
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.PlayArrow,
                            contentDescription = null,
                            tint = Color(0xFF07080D)
                        )
                        Text(
                            text = "ЗАПУСТИТЬ СИМУЛЯЦИЮ С ЭТИМ КЕЙСОМ",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF07080D)
                        )
                    }
                }
            }
        }
    }
}

package ru.alabuga.arena.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ru.alabuga.arena.model.ZopaState

@Composable
fun ZopaMapCard(
    zopa: ZopaState,
    modifier: Modifier = Modifier
) {
    val scaleMin = 280f
    val scaleMax = 520f
    val range = scaleMax - scaleMin

    fun toPercent(value: Int): Float {
        val clamped = value.toFloat().coerceIn(scaleMin, scaleMax)
        return ((clamped - scaleMin) / range).coerceIn(0f, 1f)
    }

    val sellerLeft = toPercent(zopa.sellerMin)
    val sellerRight = toPercent(zopa.sellerMax)
    val sellerWidth = (sellerRight - sellerLeft).coerceAtLeast(0.05f)

    val buyerLeft = toPercent(zopa.buyerMin)
    val buyerRight = toPercent(zopa.buyerMax)
    val buyerWidth = (buyerRight - buyerLeft).coerceAtLeast(0.05f)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF131726))
            .border(1.dp, Color(0xFF282F48), RoundedCornerShape(16.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.SwapHoriz,
                    contentDescription = null,
                    tint = Color(0xFF00F0FF),
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = "КАРТА ИНТЕРЕСОВ ZOPA",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    letterSpacing = 1.sp
                )
            }

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(
                        if (zopa.isOverlap) Color(0xFF10B981).copy(alpha = 0.2f)
                        else Color(0xFF7B2CBF).copy(alpha = 0.2f)
                    )
                    .border(
                        1.dp,
                        if (zopa.isOverlap) Color(0xFF10B981) else Color(0xFF9D4EDD),
                        RoundedCornerShape(20.dp)
                    )
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text(
                    text = if (zopa.isOverlap) "КОРИДОР НАЙДЕН" else "СБЛИЖЕНИЕ ПОЗИЦИЙ",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (zopa.isOverlap) Color(0xFF34D399) else Color(0xFFD8B4FE),
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        // Шкала 1: ОЭЗ Алабуга (BATNA)
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Границы ОЭЗ (BATNA):", fontSize = 11.sp, color = Color(0xFF94A3B8))
                Text("${zopa.sellerMin} – ${zopa.sellerMax} ₽/м²", fontSize = 11.sp, color = Color(0xFF00F0FF), fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
            }
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color(0xFF0A0C16))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(fraction = sellerWidth)
                        .padding(start = 0.dp) // Simplified
                        .clip(RoundedCornerShape(4.dp))
                        .background(Brush.horizontalGradient(listOf(Color(0xFF00B4D8), Color(0xFF00F0FF))))
                )
            }
        }

        // Шкала 2: Оппонент
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Готовность инвестора:", fontSize = 11.sp, color = Color(0xFF94A3B8))
                Text("${zopa.buyerMin} – ${zopa.buyerMax} ₽/м²", fontSize = 11.sp, color = Color(0xFFD8B4FE), fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
            }
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color(0xFF0A0C16))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(fraction = buyerWidth)
                        .clip(RoundedCornerShape(4.dp))
                        .background(Brush.horizontalGradient(listOf(Color(0xFF7B2CBF), Color(0xFFD8B4FE))))
                )
            }
        }

        // Динамический комментарий
        Text(
            text = zopa.changeReason,
            fontSize = 11.sp,
            color = Color(0xFFCBD5E1),
            lineHeight = 15.sp
        )
    }
}

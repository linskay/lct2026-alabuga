package ru.alabuga.arena.ui.components

import androidx.compose.foundation.BorderStroke
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
            .clip(RoundedCornerShape(20.dp))
            .background(Color(0xFF131520))
            .border(
                BorderStroke(1.dp, Color.White.copy(alpha = 0.05f)),
                RoundedCornerShape(20.dp)
            )
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Top sheen
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(Color.White.copy(alpha = 0.06f))
        )

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
                    .clip(RoundedCornerShape(50))
                    .background(
                        if (zopa.isOverlap) Color(0xFF10B981).copy(alpha = 0.18f)
                        else Color(0xFF7B2CBF).copy(alpha = 0.18f)
                    )
                    .border(
                        1.dp,
                        if (zopa.isOverlap) Color(0xFF10B981).copy(alpha = 0.45f) else Color(0xFF9D4EDD).copy(alpha = 0.45f),
                        RoundedCornerShape(50)
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

        // ZOPA visualization tracks
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Buyer track
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("ПОКУПАТЕЛЬ (ИНВЕСТОР)", fontSize = 9.sp, color = Color(0xFF94A3B8), fontFamily = FontFamily.Monospace)
                    Text("${zopa.buyerMin} - ${zopa.buyerMax} ₽/м²", fontSize = 10.sp, color = Color(0xFFCBD5E1), fontFamily = FontFamily.Monospace)
                }
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(50))
                        .background(Color(0xFF16192B))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(buyerWidth)
                            .offset(x = (buyerLeft * 260).dp)
                            .clip(RoundedCornerShape(50))
                            .background(
                                Brush.horizontalGradient(
                                    listOf(Color(0xFF3B82F6), Color(0xFF00F0FF))
                                )
                            )
                    )
                }
            }

            // Seller (Alabuga) track
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("ОЭЗ «АЛАБУГА» (BATNA)", fontSize = 9.sp, color = Color(0xFF94A3B8), fontFamily = FontFamily.Monospace)
                    Text("${zopa.sellerMin} - ${zopa.sellerMax} ₽/м²", fontSize = 10.sp, color = Color(0xFFCBD5E1), fontFamily = FontFamily.Monospace)
                }
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(50))
                        .background(Color(0xFF16192B))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(sellerWidth)
                            .offset(x = (sellerLeft * 260).dp)
                            .clip(RoundedCornerShape(50))
                            .background(
                                Brush.horizontalGradient(
                                    listOf(Color(0xFF7B2CBF), Color(0xFF10B981))
                                )
                            )
                    )
                }
            }
        }

        Text(
            text = zopa.changeReason,
            fontSize = 11.sp,
            color = Color(0xFFCBD5E1),
            lineHeight = 15.sp
        )
    }
}

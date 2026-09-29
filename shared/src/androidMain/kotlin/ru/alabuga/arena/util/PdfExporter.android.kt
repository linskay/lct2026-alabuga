package ru.alabuga.arena.util

import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color as AndroidColor
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream

/**
 * Android нативный генератор и экспортер официального PDF-отчета переговоров ОЭЗ «Алабуга».
 * Создает валидный бинарный документ формата A4 и открывает его через системный просмотрщик PDF.
 */
actual fun exportPdfReport(
    scenarioName: String,
    opponentName: String,
    outcome: String,
    rating: String,
    steps: Int,
    trust: Int,
    tension: Int,
    readiness: Int,
    summary: String,
    weakZones: String,
    recommendations: String
) {
    try {
        val context = AppContextHolder.appContext?.get() ?: return

        val pageWidth = 595
        val pageHeight = 842
        val document = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, 1).create()
        val page = document.startPage(pageInfo)
        val canvas: Canvas = page.canvas

        // Background
        val bgPaint = Paint().apply { color = AndroidColor.WHITE }
        canvas.drawRect(0f, 0f, pageWidth.toFloat(), pageHeight.toFloat(), bgPaint)

        // Outer Border
        val borderPaint = Paint().apply {
            color = AndroidColor.rgb(226, 232, 240)
            style = Paint.Style.STROKE
            strokeWidth = 1f
        }
        val margin = 24f
        canvas.drawRoundRect(RectF(margin, margin, pageWidth - margin, pageHeight - margin), 12f, 12f, borderPaint)

        // Header Background Bar
        val headerBarPaint = Paint().apply {
            color = AndroidColor.rgb(124, 58, 237)
        }
        canvas.drawRect(margin, margin, pageWidth - margin, margin + 4f, headerBarPaint)

        // Text Paints
        val titlePaint = Paint().apply {
            color = AndroidColor.rgb(15, 23, 42)
            textSize = 15f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }
        val subPaint = Paint().apply {
            color = AndroidColor.rgb(100, 116, 139)
            textSize = 9.5f
            isAntiAlias = true
        }
        val sectionTitlePaint = Paint().apply {
            color = AndroidColor.rgb(15, 23, 42)
            textSize = 10.5f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }
        val bodyPaint = Paint().apply {
            color = AndroidColor.rgb(51, 65, 85)
            textSize = 8.5f
            isAntiAlias = true
        }

        var curY = margin + 28f

        // Title
        canvas.drawText("ОЭЗ «АЛАБУГА» • ИТОГОВЫЙ ОТЧЕТ ПЕРЕГОВОРОВ", margin + 14f, curY, titlePaint)
        
        // Rating Badge (Top Right)
        val badgeBgPaint = Paint().apply {
            color = AndroidColor.rgb(243, 232, 255)
            style = Paint.Style.FILL
        }
        val badgeBorderPaint = Paint().apply {
            color = AndroidColor.rgb(124, 58, 237)
            style = Paint.Style.STROKE
            strokeWidth = 1.2f
        }
        val badgeTextPaint = Paint().apply {
            color = AndroidColor.rgb(124, 58, 237)
            textSize = 11f
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
            isAntiAlias = true
        }
        val badgeRect = RectF(pageWidth - margin - 90f, curY - 14f, pageWidth - margin - 14f, curY + 6f)
        canvas.drawRoundRect(badgeRect, 6f, 6f, badgeBgPaint)
        canvas.drawRoundRect(badgeRect, 6f, 6f, badgeBorderPaint)
        canvas.drawText("РАНГ $rating", badgeRect.left + 12f, badgeRect.top + 14f, badgeTextPaint)

        curY += 14f
        canvas.drawText("Сценарий: $scenarioName | Оппонент: $opponentName | Шагов: $steps", margin + 14f, curY, subPaint)

        // Divider
        curY += 14f
        val divPaint = Paint().apply { color = AndroidColor.rgb(226, 232, 240); strokeWidth = 1f }
        canvas.drawLine(margin + 14f, curY, pageWidth - margin - 14f, curY, divPaint)

        // Metrics Grid (4 cards)
        curY += 12f
        val cardWidth = (pageWidth - margin * 2f - 28f - 30f) / 4f
        val cardHeight = 44f

        val outcomeLabel = if (outcome == "WON") "СДЕЛКА" else if (outcome == "FAILED") "ПРОВАЛ" else "КОМПРОМИСС"
        val metricsList = listOf(
            Triple("РЕЗУЛЬТАТ", outcomeLabel, if (outcome == "WON") AndroidColor.rgb(5, 150, 105) else AndroidColor.rgb(220, 38, 38)),
            Triple("ДОВЕРИЕ", "$trust%", AndroidColor.rgb(2, 132, 199)),
            Triple("СТРЕСС", "$tension%", if (tension >= 50) AndroidColor.rgb(220, 38, 38) else AndroidColor.rgb(124, 58, 237)),
            Triple("ГОТОВНОСТЬ", "$readiness%", AndroidColor.rgb(5, 150, 105))
        )

        metricsList.forEachIndexed { i, (label, valStr, colorInt) ->
            val cardLeft = margin + 14f + i * (cardWidth + 10f)
            val cardRect = RectF(cardLeft, curY, cardLeft + cardWidth, curY + cardHeight)
            val cardBg = Paint().apply { color = AndroidColor.rgb(248, 250, 252) }
            canvas.drawRoundRect(cardRect, 6f, 6f, cardBg)
            canvas.drawRoundRect(cardRect, 6f, 6f, divPaint)

            val mLabelPaint = Paint().apply {
                color = AndroidColor.rgb(100, 116, 139)
                textSize = 7.5f
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                isAntiAlias = true
            }
            val mValPaint = Paint().apply {
                color = colorInt
                textSize = 12f
                typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
                isAntiAlias = true
            }

            canvas.drawText(label, cardLeft + 8f, curY + 14f, mLabelPaint)
            canvas.drawText(valStr, cardLeft + 8f, curY + 32f, mValPaint)
        }

        curY += cardHeight + 16f

        // Helper function for wrapped text boxes
        fun drawSectionBox(title: String, content: String, boxBgColor: Int, borderColorInt: Int) {
            canvas.drawText(title, margin + 14f, curY, sectionTitlePaint)
            curY += 6f

            val lines = mutableListOf<String>()
            val cleaned = content.replace("<br/>", "\n").replace("•", "").trim()
            val rawParagraphs = cleaned.split("\n").filter { it.isNotBlank() }

            val maxLineWidth = pageWidth - margin * 2f - 48f

            rawParagraphs.forEach { para ->
                val words = para.trim().split(Regex("\\s+"))
                var currentLine = ""
                words.forEach { word ->
                    val testLine = if (currentLine.isEmpty()) "• $word" else "$currentLine $word"
                    if (bodyPaint.measureText(testLine) < maxLineWidth) {
                        currentLine = testLine
                    } else {
                        if (currentLine.isNotEmpty()) lines.add(currentLine)
                        currentLine = "  $word"
                    }
                }
                if (currentLine.isNotEmpty()) lines.add(currentLine)
            }

            val boxPadding = 8f
            val lineHeight = 12f
            val boxH = lines.size * lineHeight + boxPadding * 2f + 4f
            val boxRect = RectF(margin + 14f, curY, pageWidth - margin - 14f, curY + boxH)

            val bBg = Paint().apply { color = boxBgColor }
            val bBorder = Paint().apply { color = borderColorInt; style = Paint.Style.STROKE; strokeWidth = 1f }
            canvas.drawRoundRect(boxRect, 8f, 8f, bBg)
            canvas.drawRoundRect(boxRect, 8f, 8f, bBorder)

            var lineY = curY + boxPadding + 10f
            lines.forEach { line ->
                canvas.drawText(line, margin + 22f, lineY, bodyPaint)
                lineY += lineHeight
            }

            curY += boxH + 12f
        }

        // 1. Заключение Б.А.Р.С.
        drawSectionBox(
            "АНАЛИТИЧЕСКОЕ РЕЗЮМЕ НАСТАВНИКА Б.А.Р.С.",
            summary,
            AndroidColor.rgb(248, 250, 252),
            AndroidColor.rgb(226, 232, 240)
        )

        // 2. Выявленные слабые зоны и риски
        drawSectionBox(
            "ВЫЯВЛЕННЫЕ СЛАБЫЕ ЗОНЫ И РИСКИ",
            weakZones,
            AndroidColor.rgb(255, 251, 235),
            AndroidColor.rgb(253, 230, 138)
        )

        // 3. Тактические рекомендации для B2B-сделок
        drawSectionBox(
            "ТАКТИЧЕСКИЕ РЕКОМЕНДАЦИИ ДЛЯ B2B-СДЕЛОК",
            recommendations,
            AndroidColor.rgb(245, 243, 255),
            AndroidColor.rgb(221, 214, 254)
        )

        // Footer
        val footY = pageHeight - margin - 10f
        canvas.drawLine(margin + 14f, footY - 10f, pageWidth - margin - 14f, footY - 10f, divPaint)
        val footPaint = Paint().apply {
            color = AndroidColor.rgb(148, 163, 184)
            textSize = 7.5f
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.NORMAL)
            isAntiAlias = true
        }
        canvas.drawText("ОЭЗ «АЛАБУГА» • ТАКТИЧЕСКИЙ AI-ПОЛИГОН", margin + 14f, footY, footPaint)
        val copyRight = "NEO-B2B DASHBOARD • 2026"
        canvas.drawText(copyRight, pageWidth - margin - 14f - footPaint.measureText(copyRight), footY, footPaint)

        document.finishPage(page)

        // Save binary PDF
        val reportsDir = File(context.cacheDir, "reports").apply { mkdirs() }
        val pdfFile = File(reportsDir, "alabuga_negotiation_report.pdf")
        FileOutputStream(pdfFile).use { out ->
            document.writeTo(out)
        }
        document.close()

        // Open via system PDF viewer
        val uri = FileProvider.getUriForFile(context, "ru.alabuga.arena.fileprovider", pdfFile)
        val viewIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/pdf")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        val chooser = Intent.createChooser(viewIntent, "Открыть PDF-отчет ОЭЗ «Алабуга»").apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(chooser)
    } catch (e: Throwable) {
        e.printStackTrace()
    }
}

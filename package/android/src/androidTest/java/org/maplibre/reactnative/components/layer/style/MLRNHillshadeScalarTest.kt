package org.maplibre.reactnative.components.layer.style

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.utils.ColorUtils

@RunWith(AndroidJUnit4::class)
class MLRNHillshadeScalarTest {
    private fun scalar(kind: String, value: Any): MLRNStyleValue =
        MLRNStyleValue(JavaOnlyMap.of(
            "styletype", kind,
            "stylevalue", JavaOnlyMap.of("type", "number", "value", value),
        ))

    @Test
    fun directionAndAltitudeAcceptPublicScalarNumbers() {
        for (number in listOf(315.0, 45.0)) {
            assertArrayEquals(arrayOf(number.toFloat()), scalar("constant", number).getFloatArrayOrScalar("value"))
        }
    }

    @Test
    fun shadowAndHighlightRetainProcessedColorIncludingAlpha() {
        for (color in listOf(0xff210504.toInt(), 0x80d66b62.toInt())) {
            val colors = scalar("color", color).getColorArray("value")
            assertEquals(1, colors.size)
            assertEquals(color, ColorUtils.rgbaToColor(colors[0]!!))
        }
    }

    @Test
    fun numberArraysAndExpressionBranchesRemainAvailable() {
        val numbers = JavaOnlyArray.of(
            JavaOnlyMap.of("type", "number", "value", 315.0),
            JavaOnlyMap.of("type", "number", "value", 90.0),
        )
        val value = MLRNStyleValue(JavaOnlyMap.of("styletype", "constant", "stylevalue",
            JavaOnlyMap.of("type", "array", "value", numbers)))
        assertArrayEquals(arrayOf(315f, 90f), value.getFloatArrayOrScalar("value"))
        val expression = JavaOnlyArray.of(
            JavaOnlyMap.of("type", "string", "value", "literal"),
            JavaOnlyMap.of("type", "number", "value", 315.0),
        )
        val expr = MLRNStyleValue(JavaOnlyMap.of("styletype", "constant", "stylevalue",
            JavaOnlyMap.of("type", "array", "value", expression)))
        assertTrue(expr.isExpression())
        assertEquals("literal", expr.getExpression()!!.toArray()[0])
    }
}

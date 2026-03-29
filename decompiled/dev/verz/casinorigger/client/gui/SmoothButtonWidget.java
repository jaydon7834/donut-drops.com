/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.fabricmc.api.EnvType
 *  net.fabricmc.api.Environment
 *  net.minecraft.class_11909
 *  net.minecraft.class_2561
 *  net.minecraft.class_310
 *  net.minecraft.class_327
 *  net.minecraft.class_332
 *  net.minecraft.class_339
 *  net.minecraft.class_6381
 *  net.minecraft.class_6382
 */
package dev.verz.casinorigger.client.gui;

import dev.verz.casinorigger.client.gui.UiTheme;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.class_11909;
import net.minecraft.class_2561;
import net.minecraft.class_310;
import net.minecraft.class_327;
import net.minecraft.class_332;
import net.minecraft.class_339;
import net.minecraft.class_6381;
import net.minecraft.class_6382;

@Environment(value=EnvType.CLIENT)
public class SmoothButtonWidget
extends class_339 {
    private final PressAction onPress;

    public SmoothButtonWidget(int x, int y, int width, int height, class_2561 message, PressAction onPress) {
        super(x, y, width, height, message);
        this.onPress = onPress;
    }

    public void method_25348(class_11909 click, boolean doubled) {
        if (this.field_22763 && this.onPress != null) {
            this.onPress.onPress(this);
        }
    }

    protected void method_48579(class_332 context, int mouseX, int mouseY, float delta) {
        int textColor;
        int border;
        int fill;
        UiTheme theme = UiTheme.current();
        boolean hovered = this.method_49606();
        if (!this.field_22763) {
            fill = theme.tabFill;
            border = theme.cardBorder;
            textColor = theme.buttonSubText;
        } else if (hovered) {
            fill = theme.tabHover;
            border = theme.tabActiveBorder;
            textColor = theme.text;
        } else {
            fill = theme.cardFill;
            border = theme.cardBorder;
            textColor = theme.buttonText;
        }
        SmoothButtonWidget.drawFlat(context, this.method_46426(), this.method_46427(), this.method_46426() + this.method_25368(), this.method_46427() + this.method_25364(), fill, border);
        class_327 textRenderer = class_310.method_1551().field_1772;
        String label = SmoothButtonWidget.trimToWidth(textRenderer, this.method_25369().getString(), this.method_25368() - 10);
        context.method_27534(textRenderer, class_2561.method_30163((String)label), this.method_46426() + this.method_25368() / 2, this.method_46427() + (this.method_25364() - 8) / 2, textColor);
    }

    private static void drawFlat(class_332 context, int x1, int y1, int x2, int y2, int fill, int border) {
        context.method_25294(x1, y1, x2, y2, fill);
        context.method_25294(x1, y1, x2, y1 + 1, border);
        context.method_25294(x1, y2 - 1, x2, y2, border);
        context.method_25294(x1, y1, x1 + 1, y2, border);
        context.method_25294(x2 - 1, y1, x2, y2, border);
    }

    private static String trimToWidth(class_327 renderer, String text, int width) {
        if (renderer.method_1727(text) <= width) {
            return text;
        }
        String trimmed = text;
        while (trimmed.length() > 1 && renderer.method_1727(trimmed + "...") > width) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed + "...";
    }

    protected void method_47399(class_6382 builder) {
        builder.method_37034(class_6381.field_33788, this.method_25369());
    }

    @FunctionalInterface
    public static interface PressAction {
        public void onPress(SmoothButtonWidget var1);
    }
}


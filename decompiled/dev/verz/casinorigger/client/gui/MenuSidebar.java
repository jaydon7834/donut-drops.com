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
 *  net.minecraft.class_4185
 *  net.minecraft.class_4185$class_4241
 *  net.minecraft.class_437
 */
package dev.verz.casinorigger.client.gui;

import dev.verz.casinorigger.client.gui.UiTheme;
import java.util.Objects;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.class_11909;
import net.minecraft.class_2561;
import net.minecraft.class_310;
import net.minecraft.class_327;
import net.minecraft.class_332;
import net.minecraft.class_4185;
import net.minecraft.class_437;

@Environment(value=EnvType.CLIENT)
public final class MenuSidebar {
    private MenuSidebar() {
    }

    private static float baseScale(int width, int height) {
        float widthScale = (float)width / 480.0f;
        float heightScale = (float)height / 270.0f;
        return Math.max(0.75f, Math.min(1.0f, Math.min(widthScale, heightScale)));
    }

    public static int scalePx(int px, int width, int height) {
        return Math.max(1, Math.round((float)px * MenuSidebar.baseScale(width, height)));
    }

    public static int contentLeft(int width) {
        int cardWidth = Math.min(width - 24, 360);
        return Math.max(12, (width - cardWidth) / 2);
    }

    public static int contentRight(int width) {
        int cardWidth = Math.min(width - 24, 360);
        return Math.min(width - 12, (width - cardWidth) / 2 + cardWidth);
    }

    public static int contentTop(int height) {
        return Math.max(12, MenuSidebar.scalePx(18, 0, height));
    }

    public static int controlHeight(int width, int height) {
        return MenuSidebar.scalePx(20, width, height);
    }

    public static int controlStep(int width, int height) {
        return MenuSidebar.scalePx(24, width, height);
    }

    public static int controlsStartY(int topY, int width, int height) {
        return topY + MenuSidebar.scalePx(86, width, height);
    }

    public static int headerY(int topY, int width, int height) {
        return topY + MenuSidebar.scalePx(12, width, height);
    }

    public static int subtitleY(int headerY, class_327 textRenderer, int width, int height) {
        Objects.requireNonNull(textRenderer);
        return headerY + 9 + MenuSidebar.scalePx(6, width, height);
    }

    public static int labelPad(int width, int height) {
        return MenuSidebar.scalePx(6, width, height);
    }

    public static float textScale(int width, int height) {
        return MenuSidebar.baseScale(width, height);
    }

    public static int contentCardBottomForLastControl(int lastControlBottom, int height) {
        return Math.min(height - MenuSidebar.scalePx(12, 0, height), lastControlBottom + MenuSidebar.scalePx(20, 0, height));
    }

    public static class_4185 styledButton(class_2561 label, class_4185.class_4241 onPress, int x, int y, int width, int height) {
        return class_4185.method_46430((class_2561)label, (class_4185.class_4241)onPress).method_46434(x, y, width, height).method_46431();
    }

    public static void render(class_332 context, class_327 textRenderer, int width, int height, int mouseX, int mouseY, class_2561 title, Target target) {
        UiTheme theme = UiTheme.current();
        context.method_25294(0, 0, width, height, theme.backdrop);
    }

    public static void drawContentCard(class_332 context, int left, int top, int right, int bottom) {
        UiTheme theme = UiTheme.current();
        MenuSidebar.drawPanel(context, left, top, right, bottom, theme.cardFill, theme.cardBorder);
    }

    public static void drawSectionPanel(class_332 context, int left, int top, int right, int bottom) {
        UiTheme theme = UiTheme.current();
        MenuSidebar.drawPanel(context, left, top, right, bottom, theme.cardFill, theme.cardBorder);
    }

    private static void drawPanel(class_332 context, int left, int top, int right, int bottom, int fill, int border) {
        context.method_25294(left, top, right, bottom, fill);
        context.method_25294(left, top, right, top + 1, border);
        context.method_25294(left, bottom - 1, right, bottom, border);
        context.method_25294(left, top, left + 1, bottom, border);
        context.method_25294(right - 1, top, right, bottom, border);
    }

    public static void drawLargeHeaderCentered(class_332 context, class_327 textRenderer, class_2561 text, int left, int right, int y) {
        int centerX = left + (right - left) / 2;
        context.method_27534(textRenderer, text, centerX, y, UiTheme.current().text);
    }

    public static void drawSubtitleCentered(class_332 context, class_327 textRenderer, class_2561 text, int left, int right, int y) {
        int centerX = left + (right - left) / 2;
        context.method_27534(textRenderer, text, centerX, y, UiTheme.current().subText);
    }

    public static void drawScaledTextWithShadow(class_332 context, class_327 textRenderer, class_2561 text, int x, int y, int color, int width, int height) {
        float scale = MenuSidebar.textScale(width, height);
        context.method_51448().pushMatrix();
        if (Math.abs(scale - 1.0f) >= 0.001f) {
            context.method_51448().scale(scale, scale);
            x = Math.round((float)x / scale);
            y = Math.round((float)y / scale);
        }
        context.method_27535(textRenderer, text, x, y, color);
        context.method_51448().popMatrix();
    }

    public static boolean handleNavigationClick(class_437 screen, class_310 client, class_11909 click, boolean doubled, Target target, boolean allowClose) {
        return false;
    }

    public static enum Target {
        SCOREBOARD,
        FAKEBOARD;

    }
}


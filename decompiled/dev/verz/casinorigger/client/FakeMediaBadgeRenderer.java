/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.fabricmc.fabric.api.client.rendering.v1.world.WorldRenderContext
 *  net.minecraft.class_1011
 *  net.minecraft.class_1043
 *  net.minecraft.class_1044
 *  net.minecraft.class_12249
 *  net.minecraft.class_1297
 *  net.minecraft.class_2561
 *  net.minecraft.class_2960
 *  net.minecraft.class_310
 *  net.minecraft.class_327
 *  net.minecraft.class_4587
 *  net.minecraft.class_4587$class_4665
 *  net.minecraft.class_4588
 *  net.minecraft.class_4597
 *  net.minecraft.class_4608
 *  net.minecraft.class_5348
 *  net.minecraft.class_5498
 *  org.joml.Matrix4f
 *  org.joml.Matrix4fc
 *  org.joml.Quaternionfc
 */
package dev.verz.casinorigger.client;

import dev.verz.casinorigger.client.CasinoriggerClient;
import java.util.Objects;
import net.fabricmc.fabric.api.client.rendering.v1.world.WorldRenderContext;
import net.minecraft.class_1011;
import net.minecraft.class_1043;
import net.minecraft.class_1044;
import net.minecraft.class_12249;
import net.minecraft.class_1297;
import net.minecraft.class_2561;
import net.minecraft.class_2960;
import net.minecraft.class_310;
import net.minecraft.class_327;
import net.minecraft.class_742;
import net.minecraft.class_4587;
import net.minecraft.class_4588;
import net.minecraft.class_4597;
import net.minecraft.class_4608;
import net.minecraft.class_5348;
import net.minecraft.class_5498;
import org.joml.Matrix4f;
import org.joml.Matrix4fc;
import org.joml.Quaternionfc;

public final class FakeMediaBadgeRenderer {
    private static final int ICON_SIZE = 16;
    private static final float ICON_DRAW_SIZE = 9.0f;
    private static final float ICON_GAP = 1.5f;
    private static final int COLOR_BLUE = -13720321;
    private static final int COLOR_BLUE_DARK = -14911033;
    private static final int COLOR_PINK = -54337;
    private static final int COLOR_PINK_DARK = -3080050;
    private static class_2960 plusTexture;
    private static class_2960 mediaTexture;
    private static boolean initialized;

    private FakeMediaBadgeRenderer() {
    }

    public static void render(class_327 textRenderer, class_4587 matrices, class_4597 providers, int light, int textWidth) {
        FakeMediaBadgeRenderer.ensureTextures();
        if (plusTexture == null || mediaTexture == null) {
            return;
        }
        float totalIcons = 21.0f;
        float startX = (float)(-textWidth) / 2.0f - totalIcons - 1.0f;
        Objects.requireNonNull(textRenderer);
        float y = (float)(-9) / 2.0f - 1.0f;
        FakeMediaBadgeRenderer.drawIcon(mediaTexture, matrices, providers, light, startX, y, 9.0f, 9.0f);
        FakeMediaBadgeRenderer.drawIcon(plusTexture, matrices, providers, light, startX + 9.0f + 1.5f, y, 9.0f, 9.0f);
    }

    public static void renderForPlayer(WorldRenderContext context) {
        if (context == null) {
            return;
        }
        class_310 client = class_310.method_1551();
        if (client == null || client.field_1724 == null || client.field_1687 == null) {
            return;
        }
        if (client.field_1690.method_31044() == class_5498.field_26664) {
            return;
        }
        class_327 textRenderer = client.field_1772;
        if (textRenderer == null) {
            return;
        }
        class_1297 cameraEntity = client.method_1560();
        if (cameraEntity == null) {
            cameraEntity = client.field_1724;
        }
        double cameraX = cameraEntity.method_23317();
        double cameraY = cameraEntity.method_23318();
        double cameraZ = cameraEntity.method_23321();
        class_4597 providers = context.consumers();
        if (providers == null) {
            return;
        }
        class_4587 matrices = context.matrices();
        for (class_742 player : client.field_1687.method_18456()) {
            if (player == null) {
                continue;
            }
            class_2561 name = player.method_5476();
            if (name == null || !"qvde".equalsIgnoreCase(name.getString())) {
                continue;
            }
            int textWidth = textRenderer.method_27525((class_5348)name);
            double x = player.method_23317();
            double y = player.method_23318() + (double)player.method_17682() + 0.5;
            double z = player.method_23321();
            System.out.println("BADGE RENDER HIT: " + name.getString());
            matrices.method_22903();
            matrices.method_22904(x - cameraX, y - cameraY, z - cameraZ);
            matrices.method_22907((Quaternionfc)client.field_1773.method_19418().method_23767());
            matrices.method_22905(-0.025f, -0.025f, 0.025f);
            FakeMediaBadgeRenderer.render(textRenderer, matrices, providers, 0xF000F0, textWidth);
            matrices.method_22909();
        }
    }

    private static void drawIcon(class_2960 texture, class_4587 matrices, class_4597 providers, int light, float x, float y, float w, float h) {
        class_4588 consumer = providers.method_73477(class_12249.method_75994((class_2960)texture));
        class_4587.class_4665 entry = matrices.method_23760();
        Matrix4f matrix = entry.method_23761();
        consumer.method_22918((Matrix4fc)matrix, x, y + h, 0.0f).method_1336(255, 255, 255, 255).method_22913(0.0f, 1.0f).method_22922(class_4608.field_21444).method_60803(light).method_60831(entry, 0.0f, 1.0f, 0.0f);
        consumer.method_22918((Matrix4fc)matrix, x + w, y + h, 0.0f).method_1336(255, 255, 255, 255).method_22913(1.0f, 1.0f).method_22922(class_4608.field_21444).method_60803(light).method_60831(entry, 0.0f, 1.0f, 0.0f);
        consumer.method_22918((Matrix4fc)matrix, x + w, y, 0.0f).method_1336(255, 255, 255, 255).method_22913(1.0f, 0.0f).method_22922(class_4608.field_21444).method_60803(light).method_60831(entry, 0.0f, 1.0f, 0.0f);
        consumer.method_22918((Matrix4fc)matrix, x, y, 0.0f).method_1336(255, 255, 255, 255).method_22913(0.0f, 0.0f).method_22922(class_4608.field_21444).method_60803(light).method_60831(entry, 0.0f, 1.0f, 0.0f);
    }

    private static void ensureTextures() {
        if (initialized) {
            return;
        }
        initialized = true;
        class_310 client = class_310.method_1551();
        if (client == null) {
            return;
        }
        class_1011 plusImage = new class_1011(16, 16, true);
        FakeMediaBadgeRenderer.fillTransparent(plusImage);
        FakeMediaBadgeRenderer.drawCircle(plusImage, 8, 8, 7, -13720321);
        FakeMediaBadgeRenderer.drawPlus(plusImage, 8, 8, 5, -14911033);
        plusTexture = class_2960.method_60655((String)"casinorigger", (String)"fake_plus");
        client.method_1531().method_4616(plusTexture, (class_1044)new class_1043(() -> "casinorigger_plus", plusImage));
        class_1011 mediaImage = new class_1011(16, 16, true);
        FakeMediaBadgeRenderer.fillTransparent(mediaImage);
        FakeMediaBadgeRenderer.drawCamera(mediaImage);
        mediaTexture = class_2960.method_60655((String)"casinorigger", (String)"fake_media");
        client.method_1531().method_4616(mediaTexture, (class_1044)new class_1043(() -> "casinorigger_media", mediaImage));
    }

    private static void fillTransparent(class_1011 image) {
        for (int y = 0; y < 16; ++y) {
            for (int x = 0; x < 16; ++x) {
                image.method_4305(x, y, 0);
            }
        }
    }

    private static void drawCircle(class_1011 image, int cx, int cy, int radius, int argb) {
        int r2 = radius * radius;
        for (int y = 0; y < 16; ++y) {
            int dy = y - cy;
            for (int x = 0; x < 16; ++x) {
                int dx = x - cx;
                if (dx * dx + dy * dy > r2) continue;
                image.method_4305(x, y, argb);
            }
        }
    }

    private static void drawPlus(class_1011 image, int cx, int cy, int size, int argb) {
        for (int offset = -size; offset <= size; ++offset) {
            int x = cx + offset;
            int y = cy + offset;
            if (x >= 0 && x < 16) {
                image.method_4305(x, cy, argb);
                if (cy + 1 < 16) {
                    image.method_4305(x, cy + 1, argb);
                }
            }
            if (y < 0 || y >= 16) continue;
            image.method_4305(cx, y, argb);
            if (cx + 1 >= 16) continue;
            image.method_4305(cx + 1, y, argb);
        }
    }

    private static void drawCamera(class_1011 image) {
        int y;
        for (y = 6; y <= 12; ++y) {
            for (int x = 2; x <= 12; ++x) {
                image.method_4305(x, y, -54337);
            }
        }
        FakeMediaBadgeRenderer.drawCircle(image, 5, 4, 2, -54337);
        FakeMediaBadgeRenderer.drawCircle(image, 10, 4, 2, -54337);
        image.method_4305(7, 4, -54337);
        image.method_4305(8, 4, -54337);
        for (y = 8; y <= 10; ++y) {
            image.method_4305(13, y, -3080050);
            image.method_4305(14, y, -3080050);
        }
        image.method_4305(5, 13, -3080050);
        image.method_4305(6, 13, -3080050);
        image.method_4305(7, 13, -3080050);
        image.method_4305(8, 13, -3080050);
    }
}

package dev.verz.casinorigger.client;

import net.fabricmc.fabric.api.client.rendering.v1.world.WorldRenderContext;
import net.minecraft.class_12249;
import net.minecraft.class_2960;
import net.minecraft.class_327;
import net.minecraft.class_4587;
import net.minecraft.class_4588;
import net.minecraft.class_4597;
import net.minecraft.class_4608;
import org.joml.Matrix4f;

public final class FakeMediaBadgeRenderer {
    private static final class_2960 CAMERA_TEXTURE = class_2960.method_60655("casinorigger", "gui/camera");
    private static final float ICON_SIZE = 12.0f;
    private static final float ICON_GAP = 2.0f;
    private static final float Y_OFFSET = -6.0f;

    private FakeMediaBadgeRenderer() {
    }

    public static void render(class_327 textRenderer, class_4587 matrices, class_4597 providers, int light, int textWidth) {
        if (textRenderer == null) {
            return;
        }
        float startX = (float)(-textWidth) / 2.0f - ICON_SIZE - ICON_GAP;
        drawIcon(CAMERA_TEXTURE, matrices, providers, light, startX, Y_OFFSET, ICON_SIZE, ICON_SIZE);
    }

    public static void renderForPlayer(WorldRenderContext context) {
    }

    private static void drawIcon(class_2960 texture, class_4587 matrices, class_4597 providers, int light, float x, float y, float w, float h) {
        class_4588 consumer = providers.method_73477(class_12249.method_75994(texture));
        class_4587.class_4665 entry = matrices.method_23760();
        Matrix4f matrix = entry.method_23761();
        consumer.method_22918(matrix, x, y + h, 0.01f).method_1336(255, 255, 255, 255).method_22913(0.0f, 1.0f).method_22922(class_4608.field_21444).method_60803(light).method_60831(entry, 0.0f, 1.0f, 0.0f);
        consumer.method_22918(matrix, x + w, y + h, 0.01f).method_1336(255, 255, 255, 255).method_22913(1.0f, 1.0f).method_22922(class_4608.field_21444).method_60803(light).method_60831(entry, 0.0f, 1.0f, 0.0f);
        consumer.method_22918(matrix, x + w, y, 0.01f).method_1336(255, 255, 255, 255).method_22913(1.0f, 0.0f).method_22922(class_4608.field_21444).method_60803(light).method_60831(entry, 0.0f, 1.0f, 0.0f);
        consumer.method_22918(matrix, x, y, 0.01f).method_1336(255, 255, 255, 255).method_22913(0.0f, 0.0f).method_22922(class_4608.field_21444).method_60803(light).method_60831(entry, 0.0f, 1.0f, 0.0f);
    }

}

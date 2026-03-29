package dev.verz.casinorigger.mixin;

import net.minecraft.class_1007;
import net.minecraft.class_10055;
import net.minecraft.class_11659;
import net.minecraft.class_12075;
import net.minecraft.class_2561;
import net.minecraft.class_2583;
import net.minecraft.class_2960;
import net.minecraft.class_5250;
import net.minecraft.class_4587;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(value = {class_1007.class})
public abstract class PlayerEntityRendererMixin {
    private static final class_2960 CASINORIGGER$BADGE_FONT = class_2960.method_60655("casinorigger", "badge");
    private static final String CASINORIGGER$BADGE_GLYPH = "\uE000";

    @Inject(method = {"method_4213(Lnet/minecraft/class_10055;Lnet/minecraft/class_4587;Lnet/minecraft/class_11659;Lnet/minecraft/class_12075;)V"}, at = {@At(value = "HEAD")})
    private void casinorigger$injectMediaGlyph(class_10055 state, class_4587 matrices, class_11659 providers, class_12075 light, CallbackInfo ci) {
        if (!casinorigger$shouldRenderBadge(state)) {
            return;
        }
        if (state == null || state.field_53525 == null) {
            return;
        }

        String current = state.field_53525.getString();
        if (current == null || current.isBlank() || current.startsWith(CASINORIGGER$BADGE_GLYPH)) {
            return;
        }

        class_5250 icon = class_2561.method_43470(CASINORIGGER$BADGE_GLYPH + " ").method_10862(class_2583.field_24360.method_27704(CASINORIGGER$BADGE_FONT));
        icon.method_10852(state.field_53525);
        state.field_53525 = icon;
    }

    private static boolean casinorigger$shouldRenderBadge(class_10055 state) {
        if (state == null || state.field_53525 == null) {
            return false;
        }
        String name = state.field_53525.getString();
        if (name == null) {
            return false;
        }
        String normalized = name.replaceAll("^[^A-Za-z0-9_]+", "");
        return "qvde".equalsIgnoreCase(normalized);
    }
}

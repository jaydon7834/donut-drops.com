package dev.verz.casinorigger.mixin;

import dev.verz.casinorigger.client.FakeMediaBadgeRenderer;
import net.minecraft.class_1007;
import net.minecraft.class_10055;
import net.minecraft.class_11659;
import net.minecraft.class_12075;
import net.minecraft.class_310;
import net.minecraft.class_4587;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(value={class_1007.class})
public abstract class PlayerEntityRendererMixin {
    @Inject(method={"method_4213(Lnet/minecraft/class_10055;Lnet/minecraft/class_4587;Lnet/minecraft/class_11659;Lnet/minecraft/class_12075;)V"}, at={@At(value="TAIL")})
    private void casinorigger$renderMediaIcon(class_10055 state, class_4587 matrices, class_11659 providers, class_12075 light, CallbackInfo ci) {
        System.out.println("MIXIN LOADED");
        if (!PlayerEntityRendererMixin.casinorigger$shouldRenderBadge(state)) {
            return;
        }
        class_310 client = class_310.method_1551();
        if (client == null || client.field_1772 == null || state.field_53525 == null) {
            return;
        }
        System.out.println("RENDER MIXIN HIT: " + state.field_53525.getString());
        matrices.method_22903();
        matrices.method_46416(-10.0f, 0.0f, 0.0f);
        int textWidth = state.field_53525.getString().length() * 6;
        FakeMediaBadgeRenderer.render(client.field_1772, matrices, providers, light.method_53637(), textWidth);
        matrices.method_22909();
    }

    private static boolean casinorigger$shouldRenderBadge(class_10055 state) {
        if (state == null || state.field_53525 == null) {
            return false;
        }
        return "qvde".equalsIgnoreCase(state.field_53525.getString());
    }
}

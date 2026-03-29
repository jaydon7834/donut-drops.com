/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.minecraft.class_634
 *  net.minecraft.class_7439
 *  org.spongepowered.asm.mixin.Mixin
 *  org.spongepowered.asm.mixin.injection.At
 *  org.spongepowered.asm.mixin.injection.Inject
 *  org.spongepowered.asm.mixin.injection.callback.CallbackInfo
 */
package dev.verz.casinorigger.mixin;

import dev.verz.casinorigger.client.CasinoriggerClient;
import dev.verz.casinorigger.client.rigger.FakePay;
import net.minecraft.class_634;
import net.minecraft.class_7439;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(value={class_634.class})
public class ClientPlayNetworkHandlerMixin {
    @Inject(method={"method_45729(Ljava/lang/String;)V"}, at={@At(value="HEAD")}, cancellable=true)
    private void casinorigger$fakePayChatMessage(String message, CallbackInfo ci) {
        boolean enabled;
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        boolean bl = enabled = config != null && config.isFakePayEnabled();
        if (FakePay.handleCommand(message, enabled)) {
            ci.cancel();
            return;
        }
        FakePay.applyOutgoingPayDelta(message);
    }

    @Inject(method={"method_45730(Ljava/lang/String;)V"}, at={@At(value="HEAD")}, cancellable=true)
    private void casinorigger$fakePayChatCommand(String command, CallbackInfo ci) {
        boolean enabled;
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        boolean bl = enabled = config != null && config.isFakePayEnabled();
        if (FakePay.handleCommand(command, enabled)) {
            ci.cancel();
            return;
        }
        FakePay.applyOutgoingPayDelta(command);
    }

    @Inject(method={"method_43596(Lnet/minecraft/class_7439;)V"}, at={@At(value="HEAD")})
    private void casinorigger$fakePayIncomingMessage(class_7439 packet, CallbackInfo ci) {
        if (packet != null) {
            FakePay.applyIncomingPayDelta(packet.comp_763());
        }
    }
}


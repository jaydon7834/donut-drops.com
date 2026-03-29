/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.minecraft.class_2561
 *  net.minecraft.class_9011
 *  org.spongepowered.asm.mixin.Mixin
 *  org.spongepowered.asm.mixin.injection.At
 *  org.spongepowered.asm.mixin.injection.Inject
 *  org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable
 */
package dev.verz.casinorigger.mixin;

import dev.verz.casinorigger.client.CasinoriggerClient;
import net.minecraft.class_2561;
import net.minecraft.class_9011;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(value={class_9011.class})
public class ScoreboardEntryTextMixin {
    @Inject(method={"method_55387()Lnet/minecraft/class_2561;"}, at={@At(value="RETURN")}, cancellable=true)
    private void casinorigger$spoofMoneyName(CallbackInfoReturnable<class_2561> cir) {
        class_2561 original = (class_2561)cir.getReturnValue();
        if (original == null) {
            return;
        }
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        if (config == null || config.isScoreboardSpoofSuppressed()) {
            return;
        }
        class_9011 entry = (class_9011)this;
        class_2561 spoofed = config.spoofScoreboardEntryName(entry, original);
        if (spoofed != null && spoofed != original) {
            cir.setReturnValue((Object)spoofed);
        }
    }

    @Inject(method={"comp_2129()Lnet/minecraft/class_2561;"}, at={@At(value="RETURN")}, cancellable=true)
    private void casinorigger$spoofMoneyDisplay(CallbackInfoReturnable<class_2561> cir) {
        class_2561 original = (class_2561)cir.getReturnValue();
        if (original == null) {
            return;
        }
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        if (config == null || config.isScoreboardSpoofSuppressed()) {
            return;
        }
        class_9011 entry = (class_9011)this;
        class_2561 spoofed = config.spoofScoreboardEntryName(entry, original);
        if (spoofed != null && spoofed != original) {
            cir.setReturnValue((Object)spoofed);
        }
    }
}


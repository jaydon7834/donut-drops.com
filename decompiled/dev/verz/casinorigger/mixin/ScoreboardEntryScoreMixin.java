/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.minecraft.class_9011
 *  org.spongepowered.asm.mixin.Mixin
 *  org.spongepowered.asm.mixin.injection.At
 *  org.spongepowered.asm.mixin.injection.Inject
 *  org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable
 */
package dev.verz.casinorigger.mixin;

import dev.verz.casinorigger.client.CasinoriggerClient;
import net.minecraft.class_9011;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(value={class_9011.class})
public class ScoreboardEntryScoreMixin {
    @Inject(method={"comp_2128()I"}, at={@At(value="RETURN")}, cancellable=true)
    private void casinorigger$spoofMoneyScore(CallbackInfoReturnable<Integer> cir) {
        long add;
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        if (config == null || config.isScoreboardSpoofSuppressed()) {
            return;
        }
        if (config.isFakeScoreboardEnabled()) {
            return;
        }
        if (!config.isScoreboardRigEnabled()) {
            return;
        }
        class_9011 entry = (class_9011)this;
        if (!config.isScoreboardMoneyEntry(entry) && !config.isScoreboardMoneyLine(entry.method_55387())) {
            return;
        }
        int base = (Integer)cir.getReturnValue();
        long spoofed = (long)base + (add = Math.round(config.getScoreboardMoneyAdd()));
        if (spoofed > Integer.MAX_VALUE) {
            spoofed = Integer.MAX_VALUE;
        } else if (spoofed < Integer.MIN_VALUE) {
            spoofed = Integer.MIN_VALUE;
        }
        int result = (int)spoofed;
        if (result != base) {
            cir.setReturnValue((Object)result);
        }
    }
}


/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.minecraft.class_2561
 *  net.minecraft.class_266
 *  org.spongepowered.asm.mixin.Mixin
 *  org.spongepowered.asm.mixin.injection.At
 *  org.spongepowered.asm.mixin.injection.Inject
 *  org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable
 */
package dev.verz.casinorigger.mixin;

import dev.verz.casinorigger.client.CasinoriggerClient;
import net.minecraft.class_2561;
import net.minecraft.class_266;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(value={class_266.class})
public class ScoreboardObjectiveMixin {
    @Inject(method={"method_1114()Lnet/minecraft/class_2561;"}, at={@At(value="RETURN")}, cancellable=true, require=0)
    private void casinorigger$fakeScoreboardTitle(CallbackInfoReturnable<class_2561> cir) {
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        if (config == null || !config.isFakeScoreboardEnabled()) {
            return;
        }
        class_266 objective = (class_266)this;
        if (!config.isFakeScoreboardObjective(objective)) {
            return;
        }
        class_2561 title = config.getFakeScoreboardDisplayTitle();
        if (title == null || title.getString().isBlank()) {
            return;
        }
        cir.setReturnValue((Object)title);
    }
}


/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.minecraft.class_2680
 *  net.minecraft.class_776
 *  org.spongepowered.asm.mixin.Mixin
 *  org.spongepowered.asm.mixin.injection.At
 *  org.spongepowered.asm.mixin.injection.ModifyVariable
 */
package dev.verz.casinorigger.mixin;

import dev.verz.casinorigger.client.CasinoriggerClient;
import net.minecraft.class_2680;
import net.minecraft.class_776;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.ModifyVariable;

@Mixin(value={class_776.class})
public class BlockRenderManagerMixin {
    @ModifyVariable(method={"method_3349(Lnet/minecraft/class_2680;)Lnet/minecraft/class_1087;"}, at=@At(value="HEAD"), argsOnly=true)
    private class_2680 casinorigger$fakeLootdropBlockModel(class_2680 state) {
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null) {
            return state;
        }
        return client.mapFakeLootBlockState(state);
    }
}


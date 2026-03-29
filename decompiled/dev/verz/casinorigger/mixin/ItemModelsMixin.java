/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.minecraft.class_10442
 *  net.minecraft.class_1799
 *  org.spongepowered.asm.mixin.Mixin
 *  org.spongepowered.asm.mixin.injection.At
 *  org.spongepowered.asm.mixin.injection.ModifyVariable
 */
package dev.verz.casinorigger.mixin;

import dev.verz.casinorigger.client.CasinoriggerClient;
import net.minecraft.class_10442;
import net.minecraft.class_1799;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.ModifyVariable;

@Mixin(value={class_10442.class})
public class ItemModelsMixin {
    @ModifyVariable(method={"method_65596(Lnet/minecraft/class_10444;Lnet/minecraft/class_1799;Lnet/minecraft/class_811;Lnet/minecraft/class_1937;Lnet/minecraft/class_11566;I)V", "method_65598(Lnet/minecraft/class_10444;Lnet/minecraft/class_1799;Lnet/minecraft/class_811;Lnet/minecraft/class_1937;Lnet/minecraft/class_11566;I)V", "method_65597(Lnet/minecraft/class_10444;Lnet/minecraft/class_1799;Lnet/minecraft/class_811;Lnet/minecraft/class_1309;)V", "method_65595(Lnet/minecraft/class_10444;Lnet/minecraft/class_1799;Lnet/minecraft/class_811;Lnet/minecraft/class_1297;)V"}, at=@At(value="HEAD"), argsOnly=true)
    private class_1799 casinorigger$fakeLootdropItemModel(class_1799 stack) {
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null) {
            return stack;
        }
        return client.mapFakeLootStack(stack);
    }
}


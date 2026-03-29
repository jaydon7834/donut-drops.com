/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.minecraft.class_1792
 *  net.minecraft.class_1799
 *  net.minecraft.class_2561
 *  org.spongepowered.asm.mixin.Mixin
 *  org.spongepowered.asm.mixin.injection.At
 *  org.spongepowered.asm.mixin.injection.Inject
 *  org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable
 */
package dev.verz.casinorigger.mixin;

import dev.verz.casinorigger.client.CasinoriggerClient;
import net.minecraft.class_1792;
import net.minecraft.class_1799;
import net.minecraft.class_2561;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(value={class_1799.class})
public class ItemStackMixin {
    @Inject(method={"method_7964()Lnet/minecraft/class_2561;"}, at={@At(value="RETURN")}, cancellable=true)
    private void casinorigger$fakeLootdropName(CallbackInfoReturnable<class_2561> cir) {
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null || !client.isFakeLootdropEnabled()) {
            return;
        }
        class_1799 self = (class_1799)this;
        class_1792 mapped = client.mapFakeLootItem(self.method_7909());
        if (mapped != self.method_7909()) {
            cir.setReturnValue((Object)mapped.method_63680());
        }
    }
}


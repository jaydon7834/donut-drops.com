/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.minecraft.class_10090
 *  net.minecraft.class_1799
 *  net.minecraft.class_1802
 *  net.minecraft.class_1806
 *  net.minecraft.class_1937
 *  net.minecraft.class_22
 *  net.minecraft.class_310
 *  net.minecraft.class_327
 *  net.minecraft.class_330
 *  net.minecraft.class_332
 *  net.minecraft.class_638
 *  net.minecraft.class_9209
 *  net.minecraft.class_9334
 *  org.joml.Matrix3x2fStack
 *  org.spongepowered.asm.mixin.Final
 *  org.spongepowered.asm.mixin.Mixin
 *  org.spongepowered.asm.mixin.Shadow
 *  org.spongepowered.asm.mixin.Unique
 *  org.spongepowered.asm.mixin.injection.At
 *  org.spongepowered.asm.mixin.injection.Inject
 *  org.spongepowered.asm.mixin.injection.callback.CallbackInfo
 */
package dev.verz.casinorigger.mixin;

import net.minecraft.class_10090;
import net.minecraft.class_1799;
import net.minecraft.class_1802;
import net.minecraft.class_1806;
import net.minecraft.class_1937;
import net.minecraft.class_22;
import net.minecraft.class_310;
import net.minecraft.class_327;
import net.minecraft.class_330;
import net.minecraft.class_332;
import net.minecraft.class_638;
import net.minecraft.class_9209;
import net.minecraft.class_9334;
import org.joml.Matrix3x2fStack;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.Unique;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(value={class_332.class})
public abstract class ItemRendererMixin {
    @Unique
    private static final float MAP_SCALE = 0.125f;
    @Shadow
    @Final
    private class_310 field_44656;
    @Unique
    private final class_10090 mapInSlot$mapRenderState = new class_10090();

    @Shadow
    public abstract Matrix3x2fStack method_51448();

    @Shadow
    public abstract void method_70857(class_10090 var1);

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    @Inject(method={"method_51432(Lnet/minecraft/class_327;Lnet/minecraft/class_1799;IILjava/lang/String;)V"}, at={@At(value="HEAD")})
    private void mapInSlot$drawMap(class_327 font, class_1799 stack, int x, int y, String text, CallbackInfo ci) {
        if (!stack.method_31574(class_1802.field_8204)) {
            return;
        }
        class_638 world = this.field_44656.field_1687;
        if (world == null) {
            return;
        }
        class_9209 mapId = (class_9209)stack.method_58694(class_9334.field_49646);
        if (mapId == null) {
            return;
        }
        class_22 mapState = class_1806.method_7997((class_9209)mapId, (class_1937)world);
        if (mapState == null) {
            return;
        }
        Matrix3x2fStack matrices = this.method_51448();
        class_330 mapRenderer = this.field_44656.method_61965();
        matrices.pushMatrix();
        try {
            matrices.translate((float)x, (float)y);
            matrices.scale(0.125f, 0.125f);
            mapRenderer.method_62230(mapId, mapState, this.mapInSlot$mapRenderState);
            this.method_70857(this.mapInSlot$mapRenderState);
        }
        finally {
            matrices.popMatrix();
        }
    }
}


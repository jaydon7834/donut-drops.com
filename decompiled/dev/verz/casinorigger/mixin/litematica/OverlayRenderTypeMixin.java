/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.mojang.blaze3d.pipeline.RenderPipeline
 *  org.spongepowered.asm.mixin.Mixin
 *  org.spongepowered.asm.mixin.Pseudo
 *  org.spongepowered.asm.mixin.injection.At
 *  org.spongepowered.asm.mixin.injection.Inject
 *  org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable
 */
package dev.verz.casinorigger.mixin.litematica;

import com.mojang.blaze3d.pipeline.RenderPipeline;
import dev.verz.casinorigger.client.CasinoriggerClient;
import java.lang.reflect.Field;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Pseudo;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Pseudo
@Mixin(targets={"fi/dy/masa/litematica/render/schematic/OverlayRenderType"}, remap=false)
public class OverlayRenderTypeMixin {
    private static RenderPipeline getSolidPipeline() {
        try {
            Class<?> pipelinesClass = Class.forName("fi.dy.masa.malilib.render.MaLiLibPipelines");
            Field solidField = pipelinesClass.getField("SOLID_MASA");
            Object value = solidField.get(null);
            if (value instanceof RenderPipeline) {
                RenderPipeline pipeline = (RenderPipeline)value;
                return pipeline;
            }
        }
        catch (Throwable throwable) {
            // empty catch block
        }
        return null;
    }

    @Inject(method={"isTranslucent()Z"}, at={@At(value="HEAD")}, cancellable=true)
    private void casinorigger$forceSolidOverlay(CallbackInfoReturnable<Boolean> cir) {
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        if (config != null && config.isSolidSchematicEnabled()) {
            cir.setReturnValue((Object)false);
        }
    }

    @Inject(method={"getPipeline()Lcom/mojang/blaze3d/pipeline/RenderPipeline;"}, at={@At(value="HEAD")}, cancellable=true)
    private void casinorigger$forceSolidPipeline(CallbackInfoReturnable<RenderPipeline> cir) {
        RenderPipeline solid;
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        if (config != null && config.isSolidSchematicEnabled() && (solid = OverlayRenderTypeMixin.getSolidPipeline()) != null) {
            cir.setReturnValue((Object)solid);
        }
    }

    @Inject(method={"getRenderThrough()Lcom/mojang/blaze3d/pipeline/RenderPipeline;"}, at={@At(value="HEAD")}, cancellable=true)
    private void casinorigger$forceSolidRenderThrough(CallbackInfoReturnable<RenderPipeline> cir) {
        RenderPipeline solid;
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        if (config != null && config.isSolidSchematicEnabled() && (solid = OverlayRenderTypeMixin.getSolidPipeline()) != null) {
            cir.setReturnValue((Object)solid);
        }
    }
}


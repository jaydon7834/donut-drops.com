/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.minecraft.class_2561
 *  net.minecraft.class_5250
 *  net.minecraft.class_9011
 *  net.minecraft.class_9022
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 *  org.spongepowered.asm.mixin.Mixin
 *  org.spongepowered.asm.mixin.injection.At
 *  org.spongepowered.asm.mixin.injection.Inject
 *  org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable
 */
package dev.verz.casinorigger.mixin;

import dev.verz.casinorigger.client.CasinoriggerClient;
import net.minecraft.class_2561;
import net.minecraft.class_5250;
import net.minecraft.class_9011;
import net.minecraft.class_9022;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(value={class_9011.class})
public class ScoreboardEntryFormattedMixin {
    private static final Logger LOGGER = LoggerFactory.getLogger((String)"CasinoRigger");
    private static boolean loggedOnce;

    @Inject(method={"method_55386(Lnet/minecraft/class_9022;)Lnet/minecraft/class_5250;"}, at={@At(value="RETURN")}, cancellable=true)
    private void casinorigger$spoofMoneyFormattedScore(class_9022 fallbackFormat, CallbackInfoReturnable<class_5250> cir) {
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        if (config == null || config.isScoreboardSpoofSuppressed()) {
            return;
        }
        class_9011 entry = (class_9011)this;
        class_5250 formatted = (class_5250)cir.getReturnValue();
        if (formatted == null) {
            return;
        }
        class_2561 spoofed = config.spoofScoreboardEntryScore(entry, (class_2561)formatted);
        if (spoofed == null) {
            return;
        }
        if (!loggedOnce) {
            loggedOnce = true;
            try {
                LOGGER.info("ScoreboardEntry.formatted hit: name='{}' score='{}' -> '{}'", new Object[]{entry.method_55387().getString(), formatted.getString(), spoofed.getString()});
            }
            catch (Exception ignored) {
                LOGGER.info("ScoreboardEntry.formatted hit (logging failed)");
            }
        }
        if (spoofed instanceof class_5250) {
            class_5250 mutable = (class_5250)spoofed;
            cir.setReturnValue((Object)mutable);
            return;
        }
        cir.setReturnValue((Object)class_2561.method_43470((String)spoofed.getString()).method_10862(spoofed.method_10866()));
    }
}


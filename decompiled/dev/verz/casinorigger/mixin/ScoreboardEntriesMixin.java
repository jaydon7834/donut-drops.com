/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.minecraft.class_266
 *  net.minecraft.class_269
 *  net.minecraft.class_9011
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 *  org.spongepowered.asm.mixin.Mixin
 *  org.spongepowered.asm.mixin.injection.At
 *  org.spongepowered.asm.mixin.injection.Inject
 *  org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable
 */
package dev.verz.casinorigger.mixin;

import dev.verz.casinorigger.client.CasinoriggerClient;
import java.util.ArrayList;
import java.util.Collection;
import net.minecraft.class_266;
import net.minecraft.class_269;
import net.minecraft.class_9011;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(value={class_269.class})
public class ScoreboardEntriesMixin {
    private static final Logger LOGGER = LoggerFactory.getLogger((String)"CasinoRigger");
    private static boolean loggedOnce;
    private static boolean loggedEntriesOnce;

    @Inject(method={"method_1184(Lnet/minecraft/class_266;)Ljava/util/Collection;"}, at={@At(value="RETURN")}, cancellable=true)
    private void casinorigger$spoofMoneyEntries(class_266 objective, CallbackInfoReturnable<Collection<class_9011>> cir) {
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
        Collection original = (Collection)cir.getReturnValue();
        if (original == null || original.isEmpty()) {
            return;
        }
        long add = Math.round(config.getScoreboardMoneyAdd());
        if (!loggedEntriesOnce) {
            loggedEntriesOnce = true;
            int count = 0;
            for (class_9011 entry : original) {
                boolean match;
                String name;
                if (entry == null) continue;
                try {
                    name = entry.method_55387() != null ? entry.method_55387().getString() : "<null>";
                }
                catch (Exception ignored) {
                    name = "<error>";
                }
                try {
                    match = config.isScoreboardMoneyEntry(entry) || config.isScoreboardMoneyLine(entry.method_55387());
                }
                catch (Exception ignored) {
                    match = false;
                }
                LOGGER.info("Scoreboard entry seen: '{}' value={} match={}", new Object[]{name, entry.comp_2128(), match});
                if (++count < 12) continue;
                break;
            }
        }
        if (add == 0L) {
            return;
        }
        boolean changed = false;
        ArrayList<class_9011> rewritten = new ArrayList<class_9011>(original.size());
        for (class_9011 entry : original) {
            boolean moneyRow;
            if (entry == null) continue;
            boolean bl = moneyRow = config.isScoreboardMoneyEntry(entry) || config.isScoreboardMoneyLine(entry.method_55387());
            if (!moneyRow) {
                rewritten.add(entry);
                continue;
            }
            int base = entry.comp_2128();
            long spoofed = (long)base + add;
            if (spoofed > Integer.MAX_VALUE) {
                spoofed = Integer.MAX_VALUE;
            } else if (spoofed < Integer.MIN_VALUE) {
                spoofed = Integer.MIN_VALUE;
            }
            int result = (int)spoofed;
            if (result == base) {
                rewritten.add(entry);
                continue;
            }
            changed = true;
            rewritten.add(new class_9011(entry.comp_2127(), result, entry.comp_2129(), entry.comp_2130()));
            if (loggedOnce) continue;
            loggedOnce = true;
            try {
                LOGGER.info("Scoreboard rig applied: '{}' {} -> {}", new Object[]{entry.method_55387().getString(), base, result});
            }
            catch (Exception ignored) {
                LOGGER.info("Scoreboard rig applied: {} -> {}", (Object)base, (Object)result);
            }
        }
        if (changed) {
            cir.setReturnValue(rewritten);
        }
    }
}


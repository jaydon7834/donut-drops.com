/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.minecraft.class_2561
 *  net.minecraft.class_2583
 *  net.minecraft.class_269
 *  net.minecraft.class_310
 *  net.minecraft.class_329
 *  net.minecraft.class_5250
 *  net.minecraft.class_5251
 *  net.minecraft.class_5348
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
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.Locale;
import java.util.regex.Pattern;
import net.minecraft.class_2561;
import net.minecraft.class_2583;
import net.minecraft.class_269;
import net.minecraft.class_310;
import net.minecraft.class_329;
import net.minecraft.class_5250;
import net.minecraft.class_5251;
import net.minecraft.class_5348;
import net.minecraft.class_9011;
import net.minecraft.class_9022;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(value={class_329.class})
public class InGameHudScoreboardMixin {
    private static final class_5251 MONEY_GREEN = class_5251.method_27717((int)64512);
    private static final class_5251 MONEY_WHITE = class_5251.method_27717((int)0xFFFFFF);
    private static final Pattern LEGACY_COLOR_PATTERN = Pattern.compile("\\u00A7[0-9A-FK-ORa-fk-or]");
    private static final Logger LOGGER = LoggerFactory.getLogger((String)"CasinoRigger");
    private static boolean loggedMoneyRow;

    @Inject(method={"method_55439(Lnet/minecraft/class_269;Lnet/minecraft/class_9022;Lnet/minecraft/class_9011;)Lnet/minecraft/class_329$class_9016;"}, at={@At(value="RETURN")}, cancellable=true)
    private void casinorigger$spoofMoneySidebarEntry(class_269 scoreboard, class_9022 format, class_9011 entry, CallbackInfoReturnable<Object> cir) {
        Object replacement;
        boolean moneyRow;
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        if (config == null || config.isScoreboardSpoofSuppressed()) {
            return;
        }
        if (!config.isFakeScoreboardEnabled() && !config.isScoreboardRigEnabled()) {
            return;
        }
        Object original = cir.getReturnValue();
        if (original == null) {
            return;
        }
        class_2561 name = InGameHudScoreboardMixin.readText(original, "name");
        class_2561 score = InGameHudScoreboardMixin.readText(original, "score");
        if (name == null || score == null) {
            return;
        }
        class_2561 spoofedName = config.spoofScoreboardEntryName(entry, name);
        class_2561 spoofedScore = config.spoofScoreboardEntryScore(entry, score);
        boolean bl = moneyRow = config.isScoreboardMoneyLine(name) || config.isScoreboardMoneyEntry(entry);
        if (moneyRow) {
            spoofedName = InGameHudScoreboardMixin.styleMoneyName(spoofedName);
            spoofedScore = InGameHudScoreboardMixin.forceMoneyGreen(spoofedScore);
        }
        if (!loggedMoneyRow) {
            loggedMoneyRow = true;
            try {
                LOGGER.info("InGameHud money row hit: name='{}' score='{}' -> '{}'", new Object[]{name.getString(), score.getString(), spoofedScore.getString()});
            }
            catch (Exception ignored) {
                LOGGER.info("InGameHud money row hit (logging failed)");
            }
        }
        int width = InGameHudScoreboardMixin.readInt(original, "scoreWidth");
        class_310 client = class_310.method_1551();
        if (client != null) {
            width = client.field_1772.method_27525((class_5348)spoofedScore);
        }
        if ((replacement = InGameHudScoreboardMixin.newSidebarEntryInstance(original.getClass(), spoofedName, spoofedScore, width)) != null) {
            cir.setReturnValue(replacement);
            return;
        }
        InGameHudScoreboardMixin.tryMutateSidebarEntry(original, spoofedName, spoofedScore, width);
    }

    private static class_2561 forceMoneyGreen(class_2561 spoofed) {
        return class_2561.method_43470((String)spoofed.getString()).method_10862(spoofed.method_10866().method_27703(MONEY_GREEN));
    }

    private static class_2561 styleMoneyName(class_2561 spoofedLine) {
        String raw = LEGACY_COLOR_PATTERN.matcher(spoofedLine.getString()).replaceAll("");
        String lowered = raw.toLowerCase(Locale.ROOT);
        int moneyIndex = lowered.indexOf("money");
        if (moneyIndex < 0) {
            return spoofedLine;
        }
        int moneyEnd = Math.min(raw.length(), moneyIndex + "money".length());
        class_2583 base = spoofedLine.method_10866();
        class_5250 rebuilt = class_2561.method_43470((String)raw.substring(0, moneyIndex)).method_10862(base.method_27703(MONEY_GREEN).method_10982(Boolean.valueOf(true)));
        rebuilt.method_10852((class_2561)class_2561.method_43470((String)raw.substring(moneyIndex, moneyEnd)).method_10862(base.method_27703(MONEY_WHITE).method_10982(Boolean.valueOf(false))));
        rebuilt.method_10852((class_2561)class_2561.method_43470((String)raw.substring(moneyEnd)).method_10862(base.method_27703(MONEY_GREEN).method_10982(Boolean.valueOf(false))));
        return rebuilt;
    }

    private static class_2561 readText(Object instance, String methodName) {
        try {
            class_2561 text;
            Object value = instance.getClass().getMethod(methodName, new Class[0]).invoke(instance, new Object[0]);
            return value instanceof class_2561 ? (text = (class_2561)value) : null;
        }
        catch (Exception ignored) {
            return null;
        }
    }

    private static int readInt(Object instance, String methodName) {
        try {
            int n;
            Object value = instance.getClass().getMethod(methodName, new Class[0]).invoke(instance, new Object[0]);
            if (value instanceof Integer) {
                Integer i = (Integer)value;
                n = i;
            } else {
                n = 0;
            }
            return n;
        }
        catch (Exception ignored) {
            return 0;
        }
    }

    private static Object newSidebarEntryInstance(Class<?> sidebarEntryClass, class_2561 name, class_2561 score, int scoreWidth) {
        try {
            Constructor<?> ctor = sidebarEntryClass.getDeclaredConstructor(class_2561.class, class_2561.class, Integer.TYPE);
            ctor.setAccessible(true);
            return ctor.newInstance(name, score, scoreWidth);
        }
        catch (Exception ignored) {
            return null;
        }
    }

    private static void tryMutateSidebarEntry(Object sidebarEntry, class_2561 name, class_2561 score, int scoreWidth) {
        try {
            Class<?> clazz = sidebarEntry.getClass();
            Field nameField = clazz.getDeclaredField("name");
            Field scoreField = clazz.getDeclaredField("score");
            Field widthField = clazz.getDeclaredField("scoreWidth");
            nameField.setAccessible(true);
            scoreField.setAccessible(true);
            widthField.setAccessible(true);
            nameField.set(sidebarEntry, name);
            scoreField.set(sidebarEntry, score);
            widthField.setInt(sidebarEntry, scoreWidth);
        }
        catch (Exception exception) {
            // empty catch block
        }
    }
}


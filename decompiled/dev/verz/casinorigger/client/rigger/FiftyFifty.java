/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.fabricmc.api.EnvType
 *  net.fabricmc.api.Environment
 *  net.minecraft.class_1297
 *  net.minecraft.class_1542
 *  net.minecraft.class_1703
 *  net.minecraft.class_1716
 *  net.minecraft.class_1735
 *  net.minecraft.class_1792
 *  net.minecraft.class_1799
 *  net.minecraft.class_1802
 *  net.minecraft.class_1935
 *  net.minecraft.class_2561
 *  net.minecraft.class_310
 *  net.minecraft.class_9334
 */
package dev.verz.casinorigger.client.rigger;

import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.class_1297;
import net.minecraft.class_1542;
import net.minecraft.class_1703;
import net.minecraft.class_1716;
import net.minecraft.class_1735;
import net.minecraft.class_1792;
import net.minecraft.class_1799;
import net.minecraft.class_1802;
import net.minecraft.class_1935;
import net.minecraft.class_2561;
import net.minecraft.class_310;
import net.minecraft.class_9334;

@Environment(value=EnvType.CLIENT)
public class FiftyFifty {
    private static final FiftyFifty INSTANCE = new FiftyFifty();
    public class_1792 leftSideItem = class_1802.field_8279;
    public class_1792 rightSideItem = class_1802.field_8477;
    public boolean leftWin = true;
    public boolean enabled = false;

    public static FiftyFifty getInstance() {
        return INSTANCE;
    }

    public void tick(class_310 client) {
        if (this.enabled && client.field_1724 != null && client.field_1687 != null) {
            class_1799 cursorStack;
            class_1792 winItem = this.leftWin ? this.leftSideItem : this.rightSideItem;
            class_1792 loseItem = this.leftWin ? this.rightSideItem : this.leftSideItem;
            for (class_1297 entity : client.field_1687.method_18112()) {
                class_1542 itemEntity;
                class_1799 stack;
                if (!(entity instanceof class_1542) || !(stack = (itemEntity = (class_1542)entity).method_6983()).method_31574(loseItem) || this.isProtectedRigStack(stack)) continue;
                itemEntity.method_6979(this.createRiggedStack(winItem, stack));
                itemEntity.field_64356 = true;
                itemEntity.field_64356 = true;
            }
            if (client.field_1724.field_7512 != null && (cursorStack = client.field_1724.field_7512.method_34255()).method_31574(loseItem) && !this.isProtectedRigStack(cursorStack)) {
                client.field_1724.field_7512.method_34254(this.createRiggedStack(winItem, cursorStack));
            }
            for (int i = 0; i < client.field_1724.method_31548().method_5439(); ++i) {
                class_1799 stack = client.field_1724.method_31548().method_5438(i);
                if (!stack.method_31574(loseItem) || this.isProtectedRigStack(stack)) continue;
                client.field_1724.method_31548().method_5447(i, this.createRiggedStack(winItem, stack));
            }
            class_1703 screenHandler = client.field_1724.field_7512;
            if (screenHandler instanceof class_1716) {
                int i;
                class_1716 container = (class_1716)screenHandler;
                boolean winInDropper = false;
                boolean loseInDropper = false;
                for (i = 0; i < 9; ++i) {
                    class_1792 item = container.method_7611(i).method_7677().method_7909();
                    if (item == winItem) {
                        winInDropper = true;
                    }
                    if (item != loseItem) continue;
                    loseInDropper = true;
                }
                if (!loseInDropper && winInDropper) {
                    for (i = 0; i < 9; ++i) {
                        int loseIdx;
                        class_1735 slot = container.method_7611(i);
                        if (slot.method_7677().method_31574(winItem)) {
                            slot.method_53512(class_1799.field_8037);
                        }
                        int n = loseIdx = this.leftWin ? 1 : 0;
                        if (i != loseIdx || slot.method_7681()) continue;
                        slot.method_53512(new class_1799((class_1935)loseItem));
                    }
                }
            }
        }
    }

    public class_1799 createRiggedStack(class_1792 targetItem, class_1799 sourceStack) {
        class_1799 rigged = new class_1799((class_1935)targetItem, sourceStack.method_7947());
        class_2561 customName = (class_2561)sourceStack.method_58694(class_9334.field_49631);
        if (customName != null) {
            rigged.method_57379(class_9334.field_49631, (Object)customName);
        }
        return rigged;
    }

    private boolean isProtectedRigStack(class_1799 stack) {
        String name = stack.method_7964().getString().toLowerCase();
        if (name.contains("[host]") || name.contains("[viewer]")) {
            return true;
        }
        String digits = name.replaceAll("[^0-9]", "");
        if (!digits.isEmpty()) {
            try {
                int value = Integer.parseInt(digits);
                if (value >= 1 && value <= 10 || value == 11) {
                    return true;
                }
            }
            catch (NumberFormatException numberFormatException) {
                // empty catch block
            }
        }
        return false;
    }
}


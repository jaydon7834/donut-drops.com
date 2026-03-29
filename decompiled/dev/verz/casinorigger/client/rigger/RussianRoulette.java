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

import java.util.HashSet;
import java.util.Set;
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
public class RussianRoulette {
    private static final RussianRoulette INSTANCE = new RussianRoulette();
    public class_1792 triggerItem = class_1802.field_8626;
    public class_1792 normalItem = class_1802.field_8407;
    public boolean enabled = false;
    public boolean armed = false;
    private int trackedInventorySlot = -1;
    private int trackedEntityId = -1;
    private int[] normalCountSnapshot = null;
    private final Set<Integer> knownNormalDropIds = new HashSet<Integer>();
    private boolean pendingOuterCompensation = false;

    public static RussianRoulette getInstance() {
        return INSTANCE;
    }

    public void arm() {
        this.armed = true;
        this.trackedInventorySlot = -1;
        this.trackedEntityId = -1;
        this.captureNormalSnapshot();
        this.captureKnownNormalDropIds();
        this.pendingOuterCompensation = false;
    }

    public void tick(class_310 client) {
        class_1799 cursorStack;
        if (!this.enabled || client.field_1724 == null || client.field_1687 == null) {
            this.armed = false;
            this.trackedInventorySlot = -1;
            this.trackedEntityId = -1;
            this.normalCountSnapshot = null;
            this.knownNormalDropIds.clear();
            this.pendingOuterCompensation = false;
            return;
        }
        if (!this.armed) {
            this.trackedInventorySlot = -1;
            this.trackedEntityId = -1;
            this.normalCountSnapshot = null;
            this.knownNormalDropIds.clear();
            this.pendingOuterCompensation = false;
            return;
        }
        class_1703 class_17032 = client.field_1724.field_7512;
        if (class_17032 instanceof class_1716) {
            class_1716 container = (class_1716)class_17032;
            this.spoofRouletteContainer(client, container);
        }
        this.spoofSingleDroppedStack(client);
        if (client.field_1724.field_7512 != null && (cursorStack = client.field_1724.field_7512.method_34255()).method_31574(this.normalItem)) {
            client.field_1724.field_7512.method_34254(this.createTriggerSpoofStack(cursorStack));
        }
        this.spoofTrackedInventoryStack(client);
    }

    private void spoofRouletteContainer(class_310 client, class_1716 container) {
        if (!this.hasRoulettePattern(container) && !this.armed) {
            return;
        }
        class_1799 centerReal = container.method_7611(4).method_7677();
        if (this.armed && centerReal.method_31574(this.normalItem)) {
            this.armed = false;
            this.trackedInventorySlot = -1;
            this.trackedEntityId = -1;
            this.normalCountSnapshot = null;
            this.knownNormalDropIds.clear();
            this.pendingOuterCompensation = false;
        } else if (this.armed && centerReal.method_7960() && !this.playerStillHasTrigger(client)) {
            this.armed = false;
            this.trackedInventorySlot = -1;
            this.trackedEntityId = -1;
            this.normalCountSnapshot = null;
            this.knownNormalDropIds.clear();
            this.pendingOuterCompensation = false;
        }
        boolean showCenterEmpty = this.armed;
        int emptyOuterToRestore = this.armed && this.pendingOuterCompensation ? this.findEmptyOuterSlot(container) : -1;
        for (int i = 0; i < 9; ++i) {
            class_1735 slot = container.method_7611(i);
            if (i == 4) {
                if (showCenterEmpty) {
                    slot.method_53512(class_1799.field_8037);
                    continue;
                }
                if (!slot.method_7681()) {
                    slot.method_53512(new class_1799((class_1935)this.triggerItem));
                    continue;
                }
                if (slot.method_7677().method_31574(this.triggerItem)) continue;
                slot.method_53512(this.createTriggerSpoofStack(slot.method_7677()));
                continue;
            }
            if (i == emptyOuterToRestore && !slot.method_7681()) {
                slot.method_53512(new class_1799((class_1935)this.normalItem));
                this.pendingOuterCompensation = false;
                continue;
            }
            if (!slot.method_7681() || slot.method_7677().method_31574(this.normalItem)) continue;
            slot.method_53512(this.createNormalSpoofStack(slot.method_7677()));
        }
    }

    private boolean hasRoulettePattern(class_1716 container) {
        class_1799 center = container.method_7611(4).method_7677();
        if (center.method_7960() || !center.method_31574(this.triggerItem)) {
            return false;
        }
        for (int i = 0; i < 9; ++i) {
            class_1799 stack;
            if (i == 4 || (stack = container.method_7611(i).method_7677()).method_7960() || stack.method_31574(this.normalItem)) continue;
            return false;
        }
        return true;
    }

    private class_1799 createTriggerSpoofStack(class_1799 sourceStack) {
        return new class_1799((class_1935)this.triggerItem, sourceStack.method_7947());
    }

    private class_1799 createNormalSpoofStack(class_1799 sourceStack) {
        class_1799 rigged = new class_1799((class_1935)this.normalItem, sourceStack.method_7947());
        class_2561 customName = (class_2561)sourceStack.method_58694(class_9334.field_49631);
        if (customName != null) {
            rigged.method_57379(class_9334.field_49631, (Object)customName);
        }
        return rigged;
    }

    private boolean playerStillHasTrigger(class_310 client) {
        if (client == null || client.field_1724 == null) {
            return false;
        }
        if (client.field_1724.field_7512 != null && client.field_1724.field_7512.method_34255().method_31574(this.triggerItem)) {
            return true;
        }
        for (int i = 0; i < client.field_1724.method_31548().method_5439(); ++i) {
            if (!client.field_1724.method_31548().method_5438(i).method_31574(this.triggerItem)) continue;
            return true;
        }
        return false;
    }

    private void spoofSingleDroppedStack(class_310 client) {
        if (client == null || client.field_1724 == null || client.field_1687 == null) {
            this.trackedEntityId = -1;
            return;
        }
        if (this.trackedEntityId != -1) {
            class_1297 tracked = client.field_1687.method_8469(this.trackedEntityId);
            if (tracked instanceof class_1542) {
                class_1542 itemEntity = (class_1542)tracked;
                class_1799 stack = itemEntity.method_6983();
                if (stack.method_31574(this.normalItem)) {
                    itemEntity.method_6979(this.createTriggerSpoofStack(stack));
                    itemEntity.field_64356 = true;
                    itemEntity.field_64356 = true;
                    return;
                }
                if (stack.method_31574(this.triggerItem)) {
                    return;
                }
            }
            this.trackedEntityId = -1;
        }
        class_1542 best = null;
        double bestDistance = Double.MAX_VALUE;
        for (class_1297 entity : client.field_1687.method_18112()) {
            double distSq;
            class_1542 itemEntity;
            if (!(entity instanceof class_1542) || !(itemEntity = (class_1542)entity).method_6983().method_31574(this.normalItem) || this.knownNormalDropIds.contains(itemEntity.method_5628()) || !((distSq = itemEntity.method_5858((class_1297)client.field_1724)) < bestDistance)) continue;
            bestDistance = distSq;
            best = itemEntity;
        }
        if (best != null) {
            class_1799 stack = best.method_6983();
            best.method_6979(this.createTriggerSpoofStack(stack));
            best.field_64356 = true;
            best.field_64356 = true;
            this.trackedEntityId = best.method_5628();
            this.knownNormalDropIds.add(best.method_5628());
            this.pendingOuterCompensation = true;
        }
    }

    private void spoofTrackedInventoryStack(class_310 client) {
        class_1799 stack;
        int newNormalSlot;
        if (client == null || client.field_1724 == null) {
            this.trackedInventorySlot = -1;
            return;
        }
        if (this.trackedInventorySlot >= 0) {
            class_1799 tracked = client.field_1724.method_31548().method_5438(this.trackedInventorySlot);
            if (tracked.method_31574(this.normalItem)) {
                client.field_1724.method_31548().method_5447(this.trackedInventorySlot, this.createTriggerSpoofStack(tracked));
                return;
            }
            if (tracked.method_31574(this.triggerItem)) {
                return;
            }
            this.trackedInventorySlot = -1;
        }
        if ((newNormalSlot = this.findNewNormalSlot(client)) >= 0 && (stack = client.field_1724.method_31548().method_5438(newNormalSlot)).method_31574(this.normalItem)) {
            client.field_1724.method_31548().method_5447(newNormalSlot, this.createTriggerSpoofStack(stack));
            this.trackedInventorySlot = newNormalSlot;
        }
    }

    private void captureNormalSnapshot() {
        class_310 client = class_310.method_1551();
        if (client == null || client.field_1724 == null) {
            this.normalCountSnapshot = null;
            return;
        }
        int size = client.field_1724.method_31548().method_5439();
        this.normalCountSnapshot = new int[size];
        for (int i = 0; i < size; ++i) {
            class_1799 stack = client.field_1724.method_31548().method_5438(i);
            this.normalCountSnapshot[i] = stack.method_31574(this.normalItem) ? stack.method_7947() : 0;
        }
    }

    private int findNewNormalSlot(class_310 client) {
        if (client == null || client.field_1724 == null) {
            return -1;
        }
        int size = client.field_1724.method_31548().method_5439();
        if (this.normalCountSnapshot == null || this.normalCountSnapshot.length != size) {
            this.captureNormalSnapshot();
        }
        if (this.normalCountSnapshot == null) {
            return -1;
        }
        int bestSlot = -1;
        for (int i = 0; i < size; ++i) {
            int previous;
            class_1799 stack = client.field_1724.method_31548().method_5438(i);
            int current = stack.method_31574(this.normalItem) ? stack.method_7947() : 0;
            if (current > (previous = this.normalCountSnapshot[i])) {
                if (previous == 0) {
                    this.normalCountSnapshot[i] = current;
                    return i;
                }
                if (bestSlot == -1) {
                    bestSlot = i;
                }
            }
            this.normalCountSnapshot[i] = current;
        }
        return bestSlot;
    }

    private int findEmptyOuterSlot(class_1716 container) {
        for (int i = 0; i < 9; ++i) {
            if (i == 4 || container.method_7611(i).method_7681()) continue;
            return i;
        }
        return -1;
    }

    private void captureKnownNormalDropIds() {
        this.knownNormalDropIds.clear();
        class_310 client = class_310.method_1551();
        if (client == null || client.field_1687 == null) {
            return;
        }
        for (class_1297 entity : client.field_1687.method_18112()) {
            class_1542 itemEntity;
            if (!(entity instanceof class_1542) || !(itemEntity = (class_1542)entity).method_6983().method_31574(this.normalItem)) continue;
            this.knownNormalDropIds.add(itemEntity.method_5628());
        }
    }
}


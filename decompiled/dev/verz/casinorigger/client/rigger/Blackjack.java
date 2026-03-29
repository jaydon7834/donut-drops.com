/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.fabricmc.api.EnvType
 *  net.fabricmc.api.Environment
 *  net.minecraft.class_1297
 *  net.minecraft.class_1542
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
import net.minecraft.class_1799;
import net.minecraft.class_1802;
import net.minecraft.class_1935;
import net.minecraft.class_2561;
import net.minecraft.class_310;
import net.minecraft.class_9334;

@Environment(value=EnvType.CLIENT)
public class Blackjack {
    private static final Blackjack INSTANCE = new Blackjack();
    public boolean enabled = false;
    private int queuedValue = -1;
    private int activeValue = -1;
    private boolean waitingForInventoryGain = false;
    private int stickyForcedSlot = -1;
    private int stickyForcedValue = -1;
    private boolean stickyOnCursor = false;
    private int stickyMissingTicks = 0;
    private int cursorForcedValue = -1;
    private int lastProcessedPlayerAge = Integer.MIN_VALUE;
    private class_1799 queuedTemplate = class_1799.field_8037;
    private class_1799 activeTemplate = class_1799.field_8037;
    private int[] lockedForcedValues = null;
    private int[] cardCountSnapshot = null;
    private int[] cardValueSnapshot = null;
    private final Set<Integer> knownCardDropIds = new HashSet<Integer>();

    private Blackjack() {
    }

    public static Blackjack getInstance() {
        return INSTANCE;
    }

    public void queueForce(int value) {
        this.queueForce(value, class_1799.field_8037);
    }

    public void queueForce(int value, class_1799 template) {
        class_1799 templateCopy;
        if (value < 1 || value > 10) {
            return;
        }
        class_1799 class_17992 = templateCopy = template == null ? class_1799.field_8037 : template.method_7972();
        if (!templateCopy.method_7960()) {
            templateCopy.method_7939(1);
        }
        if (this.activeValue != -1) {
            this.queuedValue = value;
            this.queuedTemplate = templateCopy;
            return;
        }
        this.queuedValue = value;
        this.queuedTemplate = templateCopy;
    }

    public void clearPendingForce() {
        this.queuedValue = -1;
        this.activeValue = -1;
        this.waitingForInventoryGain = false;
        this.knownCardDropIds.clear();
        this.stickyForcedSlot = -1;
        this.stickyForcedValue = -1;
        this.stickyOnCursor = false;
        this.stickyMissingTicks = 0;
        this.cursorForcedValue = -1;
        this.lastProcessedPlayerAge = Integer.MIN_VALUE;
        this.queuedTemplate = class_1799.field_8037;
        this.activeTemplate = class_1799.field_8037;
    }

    public void clearQueuedForce() {
        this.clearPendingForce();
    }

    public int getQueuedValue() {
        return this.queuedValue;
    }

    public String queuedLabel() {
        return this.queuedValue == -1 ? "none" : this.cardLabel(this.queuedValue);
    }

    public int getPendingValue() {
        return this.activeValue != -1 ? this.activeValue : this.queuedValue;
    }

    public String pendingLabel() {
        int pendingValue = this.getPendingValue();
        return pendingValue == -1 ? "none" : this.cardLabel(pendingValue);
    }

    public boolean hasPendingForce() {
        return this.getPendingValue() != -1;
    }

    public void tick(class_310 client) {
        if (!this.enabled || client.field_1724 == null || client.field_1687 == null) {
            this.clearTransient();
            return;
        }
        int playerAge = client.field_1724.field_6012;
        if (playerAge == this.lastProcessedPlayerAge) {
            return;
        }
        this.lastProcessedPlayerAge = playerAge;
        if (this.activeValue == -1 && this.queuedValue != -1) {
            this.startForcedSpin(client);
        }
        if (this.activeValue != -1) {
            this.tryForceDroppedCard(client);
            this.tryForceInventoryGain(client);
        }
        this.maintainLockedForcedSlots(client);
        this.updateCardSnapshot(client);
    }

    private void startForcedSpin(class_310 client) {
        this.activeValue = this.queuedValue;
        this.queuedValue = -1;
        this.activeTemplate = this.queuedTemplate;
        this.queuedTemplate = class_1799.field_8037;
        this.waitingForInventoryGain = true;
        this.captureKnownDropIds(client);
        this.captureCardSnapshot(client);
    }

    private void tryForceDroppedCard(class_310 client) {
        class_1542 best = null;
        double bestDistance = Double.MAX_VALUE;
        boolean useTemplate = this.activeTemplate != null && !this.activeTemplate.method_7960();
        for (class_1297 entity : client.field_1687.method_18112()) {
            double distSq;
            class_1542 itemEntity;
            if (!(entity instanceof class_1542) || this.knownCardDropIds.contains((itemEntity = (class_1542)entity).method_5628())) continue;
            class_1799 stack = itemEntity.method_6983();
            if ((!useTemplate ? !this.isBlackjackCardStack(stack) : !stack.method_31574(this.activeTemplate.method_7909())) || !((distSq = itemEntity.method_5858((class_1297)client.field_1724)) < bestDistance)) continue;
            bestDistance = distSq;
            best = itemEntity;
        }
        if (best == null) {
            return;
        }
        best.method_6979(this.createForcedCardStack(best.method_6983(), this.activeValue));
        best.field_64356 = true;
        best.field_64356 = true;
        this.knownCardDropIds.add(best.method_5628());
    }

    private void tryForceInventoryGain(class_310 client) {
        if (!this.waitingForInventoryGain) {
            return;
        }
        if (client.field_1755 != null) {
            this.captureCardSnapshot(client);
            return;
        }
        int forcedValue = this.activeValue;
        int size = client.field_1724.method_31548().method_5439();
        if (this.cardCountSnapshot == null || this.cardCountSnapshot.length != size) {
            this.captureCardSnapshot(client);
        }
        if (this.cardCountSnapshot == null) {
            return;
        }
        boolean forcedOne = false;
        boolean useTemplate = this.activeTemplate != null && !this.activeTemplate.method_7960();
        boolean templateIsMap = useTemplate && this.activeTemplate.method_31574(class_1802.field_8204);
        for (int i = 0; i < size; ++i) {
            int previous;
            class_1799 stack = client.field_1724.method_31548().method_5438(i);
            boolean eligible = this.isBlackjackCardStack(stack) || templateIsMap && stack.method_31574(class_1802.field_8204) || useTemplate && stack.method_31574(this.activeTemplate.method_7909());
            int current = eligible ? stack.method_7947() : 0;
            if (current > (previous = this.cardCountSnapshot[i]) && eligible) {
                client.field_1724.method_31548().method_5447(i, this.createForcedCardStack(stack, forcedValue));
                this.ensureLockedArray(client);
                this.lockedForcedValues[i] = forcedValue;
                forcedOne = true;
            }
            this.cardCountSnapshot[i] = current;
        }
        if (forcedOne) {
            this.cursorForcedValue = -1;
            this.captureCardSnapshot(client);
            this.waitingForInventoryGain = false;
            this.activeValue = -1;
        }
    }

    private class_1799 createForcedCardStack(class_1799 sourceStack, int value) {
        if (this.activeTemplate != null && !this.activeTemplate.method_7960()) {
            class_1799 spoofed = this.activeTemplate.method_7972();
            spoofed.method_7939(sourceStack.method_7947());
            if (spoofed.method_31574(class_1802.field_8407) && spoofed.method_58694(class_9334.field_49631) == null) {
                spoofed.method_57379(class_9334.field_49631, (Object)class_2561.method_43470((String)this.cardLabel(value)));
            }
            return spoofed;
        }
        class_1799 spoofed = new class_1799((class_1935)class_1802.field_8407, sourceStack.method_7947());
        spoofed.method_57379(class_9334.field_49631, (Object)class_2561.method_43470((String)this.cardLabel(value)));
        return spoofed;
    }

    private boolean isBlackjackCardStack(class_1799 stack) {
        int value;
        if (!stack.method_31574(class_1802.field_8407) && !stack.method_31574(class_1802.field_8204)) {
            return false;
        }
        if (stack.method_31574(class_1802.field_8204)) {
            boolean templateIsMap;
            boolean bl = templateIsMap = this.activeTemplate != null && this.activeTemplate.method_31574(class_1802.field_8204) || this.queuedTemplate != null && this.queuedTemplate.method_31574(class_1802.field_8204);
            if (templateIsMap) {
                return true;
            }
        }
        return (value = this.parseCardValue(stack.method_7964().getString())) >= 1 && value <= 10;
    }

    private int parseCardValue(String name) {
        if (name == null) {
            return -1;
        }
        String normalized = name.trim();
        if (normalized.equalsIgnoreCase("1/11")) {
            return 1;
        }
        String digitsOnly = normalized.replaceAll("[^0-9]", "");
        if (digitsOnly.isEmpty()) {
            return -1;
        }
        try {
            int parsed = Integer.parseInt(digitsOnly);
            if (parsed == 11) {
                return 1;
            }
            return parsed;
        }
        catch (NumberFormatException ignored) {
            return -1;
        }
    }

    private String cardLabel(int value) {
        return value == 1 ? "1/11" : String.valueOf(value);
    }

    private void captureCardSnapshot(class_310 client) {
        if (client == null || client.field_1724 == null) {
            this.cardCountSnapshot = null;
            return;
        }
        int size = client.field_1724.method_31548().method_5439();
        this.cardCountSnapshot = new int[size];
        boolean useTemplate = this.activeTemplate != null && !this.activeTemplate.method_7960();
        boolean templateIsMap = useTemplate && this.activeTemplate.method_31574(class_1802.field_8204);
        for (int i = 0; i < size; ++i) {
            class_1799 stack = client.field_1724.method_31548().method_5438(i);
            boolean eligible = this.isBlackjackCardStack(stack) || templateIsMap && stack.method_31574(class_1802.field_8204) || useTemplate && stack.method_31574(this.activeTemplate.method_7909());
            this.cardCountSnapshot[i] = eligible ? stack.method_7947() : 0;
        }
    }

    private void captureKnownDropIds(class_310 client) {
        this.knownCardDropIds.clear();
        if (client == null || client.field_1687 == null) {
            return;
        }
        boolean useTemplate = this.activeTemplate != null && !this.activeTemplate.method_7960();
        boolean templateIsMap = useTemplate && this.activeTemplate.method_31574(class_1802.field_8204);
        for (class_1297 entity : client.field_1687.method_18112()) {
            class_1542 itemEntity;
            class_1799 stack;
            boolean eligible;
            if (!(entity instanceof class_1542) || !(eligible = this.isBlackjackCardStack(stack = (itemEntity = (class_1542)entity).method_6983()) || templateIsMap && stack.method_31574(class_1802.field_8204) || useTemplate && stack.method_31574(this.activeTemplate.method_7909()))) continue;
            this.knownCardDropIds.add(entity.method_5628());
        }
    }

    private void clearTransient() {
        this.queuedValue = -1;
        this.activeValue = -1;
        this.waitingForInventoryGain = false;
        this.stickyForcedSlot = -1;
        this.stickyForcedValue = -1;
        this.stickyOnCursor = false;
        this.stickyMissingTicks = 0;
        this.cursorForcedValue = -1;
        this.lastProcessedPlayerAge = Integer.MIN_VALUE;
        this.lockedForcedValues = null;
        this.cardCountSnapshot = null;
        this.cardValueSnapshot = null;
        this.knownCardDropIds.clear();
    }

    private void maintainStickyForcedCard(class_310 client) {
        class_1799 tracked;
        class_1799 cursor;
        if (this.stickyForcedValue == -1 || client.field_1724 == null) {
            return;
        }
        String forcedLabel = this.cardLabel(this.stickyForcedValue);
        class_1799 class_17992 = cursor = client.field_1724.field_7512 != null ? client.field_1724.field_7512.method_34255() : class_1799.field_8037;
        if (this.stickyOnCursor) {
            if (this.isBlackjackCardStack(cursor)) {
                if (!cursor.method_7964().getString().equals(forcedLabel)) {
                    client.field_1724.field_7512.method_34254(this.createForcedCardStack(cursor, this.stickyForcedValue));
                }
                this.stickyMissingTicks = 0;
                return;
            }
            int movedSlot = this.findMovedStickySlot(client);
            if (movedSlot >= 0) {
                class_1799 moved = client.field_1724.method_31548().method_5438(movedSlot);
                client.field_1724.method_31548().method_5447(movedSlot, this.createForcedCardStack(moved, this.stickyForcedValue));
                this.ensureLockedArray(client);
                this.lockedForcedValues[movedSlot] = this.stickyForcedValue;
                this.stickyForcedSlot = movedSlot;
                this.stickyOnCursor = false;
                this.stickyMissingTicks = 0;
                return;
            }
            if (++this.stickyMissingTicks > 20) {
                this.clearSticky();
            }
            return;
        }
        if (this.stickyForcedSlot >= 0 && this.stickyForcedSlot < client.field_1724.method_31548().method_5439() && this.isBlackjackCardStack(tracked = client.field_1724.method_31548().method_5438(this.stickyForcedSlot))) {
            if (!tracked.method_7964().getString().equals(forcedLabel)) {
                client.field_1724.method_31548().method_5447(this.stickyForcedSlot, this.createForcedCardStack(tracked, this.stickyForcedValue));
            }
            this.stickyMissingTicks = 0;
            return;
        }
        if (this.isBlackjackCardStack(cursor)) {
            if (!cursor.method_7964().getString().equals(forcedLabel)) {
                client.field_1724.field_7512.method_34254(this.createForcedCardStack(cursor, this.stickyForcedValue));
            }
            this.stickyOnCursor = true;
            this.stickyForcedSlot = -1;
            this.stickyMissingTicks = 0;
            return;
        }
        int movedSlot = this.findMovedStickySlot(client);
        if (movedSlot >= 0) {
            class_1799 moved = client.field_1724.method_31548().method_5438(movedSlot);
            client.field_1724.method_31548().method_5447(movedSlot, this.createForcedCardStack(moved, this.stickyForcedValue));
            this.ensureLockedArray(client);
            this.lockedForcedValues[movedSlot] = this.stickyForcedValue;
            this.stickyForcedSlot = movedSlot;
            this.stickyMissingTicks = 0;
            return;
        }
        if (++this.stickyMissingTicks > 20) {
            this.clearSticky();
        }
    }

    private void updateCardSnapshot(class_310 client) {
        if (client.field_1724 == null) {
            this.cardCountSnapshot = null;
            this.cardValueSnapshot = null;
            return;
        }
        int invSize = client.field_1724.method_31548().method_5439();
        if (this.cardCountSnapshot == null || this.cardCountSnapshot.length != invSize) {
            this.cardCountSnapshot = new int[invSize];
        }
        if (this.cardValueSnapshot == null || this.cardValueSnapshot.length != invSize) {
            this.cardValueSnapshot = new int[invSize];
        }
        this.ensureLockedArray(client);
        boolean useTemplate = this.activeTemplate != null && !this.activeTemplate.method_7960();
        boolean templateIsMap = useTemplate && this.activeTemplate.method_31574(class_1802.field_8204);
        for (int i = 0; i < invSize; ++i) {
            class_1799 stack = client.field_1724.method_31548().method_5438(i);
            boolean eligible = this.isBlackjackCardStack(stack) || templateIsMap && stack.method_31574(class_1802.field_8204) || useTemplate && stack.method_31574(this.activeTemplate.method_7909());
            this.cardCountSnapshot[i] = eligible ? stack.method_7947() : 0;
            this.cardValueSnapshot[i] = this.isBlackjackCardStack(stack) ? this.parseCardValue(stack.method_7964().getString()) : -1;
        }
    }

    private void maintainLockedForcedSlots(class_310 client) {
        class_1799 stack;
        int i;
        class_1799 cursor;
        if (client.field_1724 == null) {
            return;
        }
        this.ensureLockedArray(client);
        if (this.lockedForcedValues == null) {
            return;
        }
        int invSize = client.field_1724.method_31548().method_5439();
        boolean screenOpen = client.field_1755 != null;
        class_1799 class_17992 = cursor = client.field_1724.field_7512 != null ? client.field_1724.field_7512.method_34255() : class_1799.field_8037;
        if (!this.isBlackjackCardStack(cursor)) {
            this.cursorForcedValue = -1;
        } else if (this.cursorForcedValue == -1) {
            int inferred = this.inferCursorForcedValueFromMovedSlot(client);
            int n = this.cursorForcedValue = inferred != -1 ? inferred : this.parseCardValue(cursor.method_7964().getString());
        }
        if (this.cursorForcedValue != -1) {
            for (i = 0; i < invSize; ++i) {
                boolean swappedOrReplaced;
                stack = client.field_1724.method_31548().method_5438(i);
                if (!this.isBlackjackCardStack(stack)) continue;
                int current = stack.method_7947();
                int previous = this.cardCountSnapshot != null && this.cardCountSnapshot.length == invSize ? this.cardCountSnapshot[i] : 0;
                int currentValue = this.parseCardValue(stack.method_7964().getString());
                int previousValue = this.cardValueSnapshot != null && this.cardValueSnapshot.length == invSize ? this.cardValueSnapshot[i] : -1;
                boolean gainedCards = current > previous;
                boolean bl = swappedOrReplaced = previous > 0 && current > 0 && previousValue != -1 && currentValue != previousValue;
                if (!gainedCards && !swappedOrReplaced) continue;
                this.lockedForcedValues[i] = this.cursorForcedValue;
            }
        }
        if (screenOpen) {
            for (i = 0; i < invSize; ++i) {
                stack = client.field_1724.method_31548().method_5438(i);
                if (!this.isBlackjackCardStack(stack)) {
                    this.lockedForcedValues[i] = -1;
                    continue;
                }
                if (this.lockedForcedValues[i] == -1) {
                    this.lockedForcedValues[i] = this.parseCardValue(stack.method_7964().getString());
                    continue;
                }
                String forcedLabel = this.cardLabel(this.lockedForcedValues[i]);
                if (stack.method_7964().getString().equals(forcedLabel)) continue;
                client.field_1724.method_31548().method_5447(i, this.createForcedCardStack(stack, this.lockedForcedValues[i]));
            }
            if (client.field_1724.field_7512 != null && this.isBlackjackCardStack(cursor)) {
                String forcedLabel = this.cardLabel(this.cursorForcedValue);
                if (!cursor.method_7964().getString().equals(forcedLabel)) {
                    client.field_1724.field_7512.method_34254(this.createForcedCardStack(cursor, this.cursorForcedValue));
                }
            }
            return;
        }
        for (i = 0; i < invSize; ++i) {
            stack = client.field_1724.method_31548().method_5438(i);
            int forcedValue = this.lockedForcedValues[i];
            if (!this.isBlackjackCardStack(stack)) {
                this.lockedForcedValues[i] = -1;
                continue;
            }
            int observedValue = this.parseCardValue(stack.method_7964().getString());
            if (forcedValue == -1) {
                this.lockedForcedValues[i] = observedValue;
                continue;
            }
            String forcedLabel = this.cardLabel(forcedValue);
            if (stack.method_7964().getString().equals(forcedLabel)) continue;
            client.field_1724.method_31548().method_5447(i, this.createForcedCardStack(stack, forcedValue));
        }
        if (client.field_1724.field_7512 != null && this.isBlackjackCardStack(cursor)) {
            String forcedLabel = this.cardLabel(this.cursorForcedValue);
            if (!cursor.method_7964().getString().equals(forcedLabel)) {
                client.field_1724.field_7512.method_34254(this.createForcedCardStack(cursor, this.cursorForcedValue));
            }
        }
    }

    private int findMovedStickySlot(class_310 client) {
        class_1799 stack;
        int i;
        if (client.field_1724 == null || this.cardCountSnapshot == null || this.cardValueSnapshot == null) {
            return -1;
        }
        int invSize = client.field_1724.method_31548().method_5439();
        for (i = 0; i < invSize; ++i) {
            int currentCount;
            stack = client.field_1724.method_31548().method_5438(i);
            int n = currentCount = this.isBlackjackCardStack(stack) ? stack.method_7947() : 0;
            if (currentCount <= this.cardCountSnapshot[i] || !this.isBlackjackCardStack(stack)) continue;
            return i;
        }
        for (i = 0; i < invSize; ++i) {
            int currentValue;
            stack = client.field_1724.method_31548().method_5438(i);
            if (!this.isBlackjackCardStack(stack) || (currentValue = this.parseCardValue(stack.method_7964().getString())) != this.stickyForcedValue || this.cardValueSnapshot[i] == currentValue) continue;
            return i;
        }
        return -1;
    }

    private void clearSticky() {
        this.stickyForcedSlot = -1;
        this.stickyForcedValue = -1;
        this.stickyOnCursor = false;
        this.stickyMissingTicks = 0;
    }

    private void ensureLockedArray(class_310 client) {
        if (client.field_1724 == null) {
            this.lockedForcedValues = null;
            return;
        }
        int invSize = client.field_1724.method_31548().method_5439();
        if (this.lockedForcedValues != null && this.lockedForcedValues.length == invSize) {
            return;
        }
        int[] next = new int[invSize];
        for (int i = 0; i < invSize; ++i) {
            next[i] = -1;
        }
        if (this.lockedForcedValues != null) {
            int copy = Math.min(this.lockedForcedValues.length, invSize);
            System.arraycopy(this.lockedForcedValues, 0, next, 0, copy);
        }
        this.lockedForcedValues = next;
    }

    private int findIncreasedSlot(class_310 client, int ignoreSlot) {
        if (client.field_1724 == null || this.cardCountSnapshot == null) {
            return -1;
        }
        int invSize = client.field_1724.method_31548().method_5439();
        for (int i = 0; i < invSize; ++i) {
            int current;
            if (i == ignoreSlot) continue;
            class_1799 stack = client.field_1724.method_31548().method_5438(i);
            int n = current = this.isBlackjackCardStack(stack) ? stack.method_7947() : 0;
            if (current <= this.cardCountSnapshot[i]) continue;
            return i;
        }
        return -1;
    }

    private int inferCursorForcedValueFromMovedSlot(class_310 client) {
        int previousValue;
        int locked;
        if (client.field_1724 == null || this.cardCountSnapshot == null) {
            return -1;
        }
        int invSize = client.field_1724.method_31548().method_5439();
        if (this.cardCountSnapshot.length != invSize) {
            return -1;
        }
        int bestSlot = -1;
        int bestDecrease = 0;
        for (int i = 0; i < invSize; ++i) {
            int previous = this.cardCountSnapshot[i];
            class_1799 stack = client.field_1724.method_31548().method_5438(i);
            int current = this.isBlackjackCardStack(stack) ? stack.method_7947() : 0;
            int decrease = previous - current;
            if (decrease <= bestDecrease) continue;
            bestDecrease = decrease;
            bestSlot = i;
        }
        if (bestSlot == -1) {
            return -1;
        }
        int n = locked = this.lockedForcedValues != null && bestSlot < this.lockedForcedValues.length ? this.lockedForcedValues[bestSlot] : -1;
        if (locked >= 1 && locked <= 10) {
            return locked;
        }
        if (this.cardValueSnapshot != null && bestSlot < this.cardValueSnapshot.length && (previousValue = this.cardValueSnapshot[bestSlot]) >= 1 && previousValue <= 10) {
            return previousValue;
        }
        return -1;
    }
}


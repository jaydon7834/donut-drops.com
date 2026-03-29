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
public class FortyFiveTen {
    private static final FortyFiveTen INSTANCE = new FortyFiveTen();
    private static final class_2561 GHOST_MARKER_NAME = class_2561.method_43470((String)"\u200b");
    public class_1792 firstItem;
    public class_1792 secondItem;
    public class_1792 middleItem;
    public WinnerTarget winner;
    public boolean enabled = false;
    private int trackedContainerSyncId = -1;
    private final class_1799[] hiddenRealStacks = new class_1799[9];
    private WinnerTarget lastWinner = WinnerTarget.FIRST;
    private static final int[] FIRST_SLOTS = new int[]{0, 1, 3, 6};
    private static final int[] SECOND_SLOTS = new int[]{2, 5, 7, 8};
    private static final int MIDDLE_SLOT = 4;

    public FortyFiveTen() {
        this.firstItem = class_1802.field_20391;
        this.secondItem = class_1802.field_20412;
        this.middleItem = class_1802.field_8477;
        this.winner = WinnerTarget.FIRST;
        for (int i = 0; i < this.hiddenRealStacks.length; ++i) {
            this.hiddenRealStacks[i] = null;
        }
        this.lastWinner = this.winner;
    }

    public static FortyFiveTen getInstance() {
        return INSTANCE;
    }

    public void cycleWinner() {
        this.winner = this.winner.next();
    }

    public class_1792 getWinnerItem() {
        return switch (this.winner.ordinal()) {
            default -> throw new MatchException(null, null);
            case 0 -> this.firstItem;
            case 1 -> this.secondItem;
            case 2 -> this.middleItem;
        };
    }

    public void tick(class_310 client) {
        class_1792 cursorItem;
        class_1799 cursorStack;
        if (!this.enabled || client == null || client.field_1724 == null || client.field_1687 == null) {
            return;
        }
        class_1792 winItem = this.getWinnerItem();
        class_1792 loseA = this.firstItem;
        class_1792 loseB = this.secondItem;
        class_1792 loseC = this.middleItem;
        for (class_1297 entity : client.field_1687.method_18112()) {
            class_1792 item;
            class_1542 itemEntity;
            class_1799 stack;
            if (!(entity instanceof class_1542) || (stack = (itemEntity = (class_1542)entity).method_6983()) == null || stack.method_7960() || (item = stack.method_7909()) == winItem || item != loseA && item != loseB && item != loseC || FortyFiveTen.isProtectedRigStack(stack)) continue;
            itemEntity.method_6979(FortyFiveTen.createRiggedStack(winItem, stack));
            itemEntity.field_64356 = true;
            itemEntity.field_64356 = true;
        }
        class_1703 screenHandler = client.field_1724.field_7512;
        if (!(screenHandler == null || (cursorStack = screenHandler.method_34255()) == null || cursorStack.method_7960() || (cursorItem = cursorStack.method_7909()) == winItem || cursorItem != loseA && cursorItem != loseB && cursorItem != loseC || FortyFiveTen.isProtectedRigStack(cursorStack))) {
            screenHandler.method_34254(FortyFiveTen.createRiggedStack(winItem, cursorStack));
        }
        for (int i = 0; i < client.field_1724.method_31548().method_5439(); ++i) {
            class_1792 item;
            class_1799 stack = client.field_1724.method_31548().method_5438(i);
            if (stack == null || stack.method_7960() || (item = stack.method_7909()) == winItem || item != loseA && item != loseB && item != loseC || FortyFiveTen.isProtectedRigStack(stack)) continue;
            client.field_1724.method_31548().method_5447(i, FortyFiveTen.createRiggedStack(winItem, stack));
        }
        if (screenHandler instanceof class_1716) {
            class_1716 container = (class_1716)screenHandler;
            this.spoofContainer(screenHandler, container);
        }
    }

    private void spoofContainer(class_1703 screenHandler, class_1716 container) {
        boolean winnerChanged;
        if (container == null || screenHandler == null) {
            return;
        }
        boolean hasForeign = false;
        for (int i = 0; i < 9; ++i) {
            class_1792 item;
            class_1799 stack = container.method_7611(i).method_7677();
            if (stack == null || stack.method_7960() || (item = stack.method_7909()) == this.firstItem || item == this.secondItem || item == this.middleItem) continue;
            hasForeign = true;
            break;
        }
        if (hasForeign) {
            return;
        }
        int syncId = screenHandler.field_7763;
        boolean containerChanged = syncId != this.trackedContainerSyncId;
        boolean bl = winnerChanged = this.winner != this.lastWinner;
        if (containerChanged || winnerChanged) {
            int i;
            if (winnerChanged && !containerChanged) {
                for (i = 0; i < 9; ++i) {
                    boolean isEmptyOrGhost;
                    if (this.hiddenRealStacks[i] == null) continue;
                    class_1735 slot = container.method_7611(i);
                    class_1799 current = slot.method_7677();
                    boolean bl2 = isEmptyOrGhost = current == null || current.method_7960() || FortyFiveTen.isGhostStack(current);
                    if (isEmptyOrGhost) {
                        slot.method_53512(this.hiddenRealStacks[i]);
                    }
                    this.hiddenRealStacks[i] = null;
                }
            }
            this.trackedContainerSyncId = syncId;
            for (i = 0; i < 9; ++i) {
                this.hiddenRealStacks[i] = null;
            }
            this.lastWinner = this.winner;
        }
        boolean[] realHas = new boolean[9];
        boolean[] serverEmpty = new boolean[9];
        int serverEmptyCount = 0;
        for (int i = 0; i < 9; ++i) {
            class_1799 stack = container.method_7611(i).method_7677();
            boolean isReal = stack != null && !stack.method_7960() && !FortyFiveTen.isGhostStack(stack);
            realHas[i] = isReal || this.hiddenRealStacks[i] != null;
            boolean bl3 = serverEmpty[i] = !isReal && this.hiddenRealStacks[i] == null;
            if (!serverEmpty[i]) continue;
            ++serverEmptyCount;
        }
        boolean[] displayEmpty = this.computeDisplayEmptySlots(serverEmpty, serverEmptyCount);
        for (int i = 0; i < 9; ++i) {
            class_1792 intended;
            boolean isEmptyOrGhost;
            class_1735 slot = container.method_7611(i);
            class_1799 current = slot.method_7677();
            boolean bl4 = isEmptyOrGhost = current == null || current.method_7960() || FortyFiveTen.isGhostStack(current);
            if (displayEmpty[i]) {
                if (!isEmptyOrGhost && this.hiddenRealStacks[i] == null) {
                    this.hiddenRealStacks[i] = current.method_7972();
                }
                if (isEmptyOrGhost) continue;
                slot.method_53512(class_1799.field_8037);
                continue;
            }
            if (this.hiddenRealStacks[i] != null) {
                if (isEmptyOrGhost) {
                    slot.method_53512(this.hiddenRealStacks[i]);
                }
                this.hiddenRealStacks[i] = null;
                current = slot.method_7677();
                boolean bl5 = isEmptyOrGhost = current == null || current.method_7960() || FortyFiveTen.isGhostStack(current);
            }
            if ((intended = this.intendedItemForSlot(i)) == null || intended == class_1802.field_8162 || realHas[i] || !isEmptyOrGhost) continue;
            class_1799 ghost = new class_1799((class_1935)intended, 1);
            ghost.method_57379(class_9334.field_49631, (Object)GHOST_MARKER_NAME);
            slot.method_53512(ghost);
        }
    }

    private WinnerTarget groupForSlot(int slotIndex) {
        if (slotIndex == 4) {
            return WinnerTarget.MIDDLE;
        }
        for (int idx : FIRST_SLOTS) {
            if (idx != slotIndex) continue;
            return WinnerTarget.FIRST;
        }
        for (int idx : SECOND_SLOTS) {
            if (idx != slotIndex) continue;
            return WinnerTarget.SECOND;
        }
        return WinnerTarget.MIDDLE;
    }

    private boolean[] computeDisplayEmptySlots(boolean[] serverEmpty, int serverEmptyCount) {
        boolean[] display = new boolean[9];
        if (serverEmptyCount <= 0) {
            return display;
        }
        if (this.winner == WinnerTarget.MIDDLE) {
            display[4] = true;
            return display;
        }
        int[] winnerSlots = this.winner == WinnerTarget.FIRST ? FIRST_SLOTS : SECOND_SLOTS;
        boolean[] used = new boolean[9];
        for (int source = 0; source < 9; ++source) {
            if (!serverEmpty[source]) continue;
            int target = source;
            WinnerTarget sourceGroup = this.groupForSlot(source);
            if (sourceGroup != this.winner) {
                int ordinal = this.ordinalInGroup(source, sourceGroup);
                if (ordinal < 0) {
                    ordinal = 0;
                }
                target = winnerSlots[Math.min(ordinal, winnerSlots.length - 1)];
            }
            target = this.pickUnusedWinnerSlot(target, used, winnerSlots);
            used[target] = true;
            display[target] = true;
        }
        boolean any = false;
        for (int i = 0; i < 9; ++i) {
            if (!display[i]) continue;
            any = true;
            break;
        }
        if (!any) {
            display[winnerSlots[0]] = true;
        }
        return display;
    }

    private int pickUnusedWinnerSlot(int preferred, boolean[] used, int[] winnerSlots) {
        if (!used[preferred]) {
            return preferred;
        }
        int startIndex = 0;
        for (int i = 0; i < winnerSlots.length; ++i) {
            if (winnerSlots[i] != preferred) continue;
            startIndex = i;
            break;
        }
        for (int offset = 1; offset < winnerSlots.length; ++offset) {
            int candidate = winnerSlots[(startIndex + offset) % winnerSlots.length];
            if (used[candidate]) continue;
            return candidate;
        }
        return preferred;
    }

    private int ordinalInGroup(int slotIndex, WinnerTarget group) {
        if (group == WinnerTarget.MIDDLE) {
            return 0;
        }
        int[] groupSlots = group == WinnerTarget.FIRST ? FIRST_SLOTS : SECOND_SLOTS;
        for (int i = 0; i < groupSlots.length; ++i) {
            if (groupSlots[i] != slotIndex) continue;
            return i;
        }
        return -1;
    }

    private class_1792 intendedItemForSlot(int slotIndex) {
        if (slotIndex == 4) {
            return this.middleItem;
        }
        for (int idx : FIRST_SLOTS) {
            if (idx != slotIndex) continue;
            return this.firstItem;
        }
        for (int idx : SECOND_SLOTS) {
            if (idx != slotIndex) continue;
            return this.secondItem;
        }
        return null;
    }

    public static class_1799 createRiggedStack(class_1792 targetItem, class_1799 sourceStack) {
        class_1799 rigged = new class_1799((class_1935)targetItem, sourceStack.method_7947());
        class_2561 customName = (class_2561)sourceStack.method_58694(class_9334.field_49631);
        if (customName != null) {
            rigged.method_57379(class_9334.field_49631, (Object)customName);
        }
        return rigged;
    }

    private static boolean isProtectedRigStack(class_1799 stack) {
        String name = stack.method_7964().getString().toLowerCase();
        return name.contains("[host]") || name.contains("[viewer]");
    }

    private static boolean isGhostStack(class_1799 stack) {
        class_2561 customName = (class_2561)stack.method_58694(class_9334.field_49631);
        return customName != null && "\u200b".equals(customName.getString());
    }

    public static enum WinnerTarget {
        FIRST("1st (45%)"),
        SECOND("2nd (45%)"),
        MIDDLE("Middle (10%)");

        public final String label;

        private WinnerTarget(String label) {
            this.label = label;
        }

        public WinnerTarget next() {
            return switch (this.ordinal()) {
                default -> throw new MatchException(null, null);
                case 0 -> MIDDLE;
                case 2 -> SECOND;
                case 1 -> FIRST;
            };
        }
    }
}


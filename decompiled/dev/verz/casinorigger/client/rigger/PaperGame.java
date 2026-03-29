package dev.verz.casinorigger.client.rigger;

import java.util.HashSet;
import java.util.Set;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.class_1263;
import net.minecraft.class_1297;
import net.minecraft.class_1542;
import net.minecraft.class_1661;
import net.minecraft.class_1703;
import net.minecraft.class_1735;
import net.minecraft.class_1792;
import net.minecraft.class_1799;
import net.minecraft.class_1802;
import net.minecraft.class_1935;
import net.minecraft.class_2561;
import net.minecraft.class_310;
import net.minecraft.class_5250;
import net.minecraft.class_746;
import net.minecraft.class_9209;
import net.minecraft.class_9334;

@Environment(value=EnvType.CLIENT)
public class PaperGame {
    private static final class_1792[] DEFAULT_NUMBER_ITEMS = new class_1792[]{class_1802.field_8831, class_1802.field_27022, class_1802.field_8620, class_1802.field_8477, class_1802.field_23847, class_1802.field_22019, class_1802.field_22020, class_1802.field_49814, class_1802.field_8547};
    private static final String DEFAULT_SUFFIX_HOST = "Host";
    private static final String DEFAULT_SUFFIX_VIEWER = "Viewer";
    public class_1792 leftSideItem = class_1802.field_8279;
    public class_1792 rightSideItem = class_1802.field_8477;
    public boolean leftWin = true;
    public boolean enabled = false;
    private final class_1792[] hostItems = new class_1792[9];
    private final class_1792[] viewerItems = new class_1792[9];
    private boolean universalItems = true;
    private boolean singleItemPaper = false;
    private boolean mapMode = true;
    private boolean sidesSwitched = false;
    private boolean mapModeWriteLock = false;
    private String hostSuffix = "Host";
    private String viewerSuffix = "Viewer";
    public final Set<Integer> trackedSlots = new HashSet<Integer>();
    private int singleCachedWinningNumber = -1;
    private class_1792 singleLastCheckedItem = class_1802.field_8162;
    private class_2561 singleOriginalNameBackup;
    private static final PaperGame INSTANCE = new PaperGame();

    public PaperGame() {
        for (int i = 0; i < 9; ++i) {
            this.hostItems[i] = DEFAULT_NUMBER_ITEMS[i];
            this.viewerItems[i] = DEFAULT_NUMBER_ITEMS[i];
        }
    }

    public static PaperGame getInstance() {
        return INSTANCE;
    }

    public boolean isUniversalItems() {
        return this.universalItems;
    }

    public void setUniversalItems(boolean enabled) {
        this.universalItems = enabled;
    }

    public boolean isSingleItemPaper() {
        return this.singleItemPaper;
    }

    public void setSingleItemPaper(boolean enabled) {
        this.singleItemPaper = enabled;
        if (enabled) {
            this.mapMode = false;
        }
    }

    public boolean isMapMode() {
        return this.mapMode;
    }

    public void setMapMode(boolean enabled) {
        this.mapMode = enabled;
        if (enabled) {
            this.singleItemPaper = false;
        }
    }

    public boolean isSidesSwitched() {
        return this.sidesSwitched;
    }

    public void setSidesSwitched(boolean sidesSwitched) {
        this.sidesSwitched = sidesSwitched;
    }

    public String getHostSuffix() {
        return this.hostSuffix;
    }

    public void setHostSuffix(String suffix) {
        this.hostSuffix = suffix == null ? "Host" : suffix;
    }

    public String getViewerSuffix() {
        return this.viewerSuffix;
    }

    public void setViewerSuffix(String suffix) {
        this.viewerSuffix = suffix == null ? "Viewer" : suffix;
    }

    public String suffixForSide(boolean hostSide) {
        return hostSide ? this.hostSuffix : this.viewerSuffix;
    }

    public class_1799 getOverlayWinnerStack() {
        if (!this.mapMode) {
            return new class_1799((class_1935)(this.leftWin ? this.leftSideItem : this.rightSideItem));
        }
        return class_1799.field_8037;
    }

    public String getOverlayWinnerLabel() {
        if (this.mapMode) {
            return "Mode: Map";
        }
        return this.leftWin ? this.hostSuffix : this.viewerSuffix;
    }

    public void Rig(class_310 client) {
        if (client == null || client.field_1724 == null || !this.enabled) {
            return;
        }

        if (this.mapMode) {
            if (this.mapModeWriteLock) {
                return;
            }
            this.mapModeWriteLock = true;
            this.runMapMode(client);
            this.mapModeWriteLock = false;
            return;
        }

        int hostNumber = -1;
        int viewerNumber = -1;

        class_1661 inventory = client.field_1724.method_31548();
        for (int i = 0; i < inventory.method_5439(); ++i) {
            class_1799 stack = inventory.method_5438(i);
            int mapId = PaperGame.getMapId(stack);
            int number = PaperGame.getNumberFromMapId(mapId);
            Side side = PaperGame.getSideFromMapId(mapId);
            PaperGame.debugMap(mapId, number, side);
            if (number < 1 || number > 9 || side == null) {
                continue;
            }
            if (side == Side.HOST) {
                hostNumber = Math.max(hostNumber, number);
            } else if (side == Side.VIEWER) {
                viewerNumber = Math.max(viewerNumber, number);
            }
        }

        class_1703 handler = client.field_1724.field_7512;
        if (handler != null) {
            class_1263 playerInventory = client.field_1724.method_31548();
            for (class_1735 slot : handler.field_7761) {
                if (!slot.method_7681()) {
                    continue;
                }
                if (slot.field_7871 == playerInventory && slot.method_34266() <= 8) {
                    continue;
                }
                class_1799 stack = slot.method_7677();
                int mapId = PaperGame.getMapId(stack);
                int number = PaperGame.getNumberFromMapId(mapId);
                Side side = PaperGame.getSideFromMapId(mapId);
                PaperGame.debugMap(mapId, number, side);
                if (number < 1 || number > 9 || side == null) {
                    continue;
                }
                if (side == Side.HOST) {
                    hostNumber = Math.max(hostNumber, number);
                } else if (side == Side.VIEWER) {
                    viewerNumber = Math.max(viewerNumber, number);
                }
            }

            class_1799 cursor = handler.method_34255();
            int cursorMapId = PaperGame.getMapId(cursor);
            int cursorNumber = PaperGame.getNumberFromMapId(cursorMapId);
            Side cursorSide = PaperGame.getSideFromMapId(cursorMapId);
            PaperGame.debugMap(cursorMapId, cursorNumber, cursorSide);
            if (cursorNumber >= 1 && cursorNumber <= 9 && cursorSide != null) {
                if (cursorSide == Side.HOST) {
                    hostNumber = Math.max(hostNumber, cursorNumber);
                } else if (cursorSide == Side.VIEWER) {
                    viewerNumber = Math.max(viewerNumber, cursorNumber);
                }
            }
        }

        if (client.field_1687 != null) {
            for (class_1297 entity : client.field_1687.method_18112()) {
                if (!(entity instanceof class_1542)) {
                    continue;
                }
                class_1799 stack = ((class_1542)entity).method_6983();
                int mapId = PaperGame.getMapId(stack);
                int number = PaperGame.getNumberFromMapId(mapId);
                Side side = PaperGame.getSideFromMapId(mapId);
                PaperGame.debugMap(mapId, number, side);
                if (number < 1 || number > 9 || side == null) {
                    continue;
                }
                if (side == Side.HOST) {
                    hostNumber = Math.max(hostNumber, number);
                } else if (side == Side.VIEWER) {
                    viewerNumber = Math.max(viewerNumber, number);
                }
            }
        }

        System.out.println("Host: " + hostNumber + " Viewer: " + viewerNumber);

        boolean hostWins = hostNumber > viewerNumber;
        if (this.sidesSwitched) {
            hostWins = !hostWins;
        }
        Side winningSide = hostWins ? Side.HOST : Side.VIEWER;
        int winningNumber = hostWins ? hostNumber : viewerNumber;

        this.leftWin = hostWins;
    }

    private void runMapMode(class_310 client) {
        class_1703 handler = client.field_1724.field_7512;
        if (handler == null) {
            return;
        }

        int hostNumber = -1;
        int viewerNumber = -1;

        for (int i = 0; i < handler.field_7761.size(); ++i) {
            class_1735 slot = (class_1735)handler.field_7761.get(i);
            class_1799 stack = slot.method_7677();
            if (stack == null || stack.method_7960()) {
                continue;
            }

            int mapId = PaperGame.getMapId(stack);
            int number = -1;
            Side side = null;

            if (mapId >= 100 && mapId < 200) {
                number = mapId - 100;
                side = this.sidesSwitched ? Side.VIEWER : Side.HOST;
            } else if (mapId >= 200 && mapId < 300) {
                number = mapId - 200;
                side = this.sidesSwitched ? Side.HOST : Side.VIEWER;
            }

            if (number < 1 || number > 9) {
                continue;
            }

            if (side == Side.HOST) {
                hostNumber = Math.max(hostNumber, number);
            } else if (side == Side.VIEWER) {
                viewerNumber = Math.max(viewerNumber, number);
            }
        }

        if (hostNumber == -1 || viewerNumber == -1) {
            return;
        }

        boolean hostWins = hostNumber > viewerNumber;
        int winningNumber = hostWins ? hostNumber : viewerNumber;
        Side winningSide = hostWins ? Side.HOST : Side.VIEWER;
        this.leftWin = hostWins;

        int mapId = (winningSide == Side.HOST ? 100 : 200) + winningNumber;
        class_1799 result = new class_1799((class_1935)class_1802.field_8204);
        result.method_57379(class_9334.field_49646, new class_9209(mapId));
        PaperGame.updateDisplayName(result);
        ((class_1735)handler.field_7761.get(0)).method_53512(result);
    }

    public void reset() {
        this.trackedSlots.clear();
    }

    public class_1792 getItem(boolean hostSide, int index) {
        if (index < 0 || index >= 9) {
            return class_1802.field_8407;
        }
        if (this.universalItems) {
            return this.hostItems[index];
        }
        return hostSide ? this.hostItems[index] : this.viewerItems[index];
    }

    public void setItem(boolean hostSide, int index, class_1792 item) {
        if (index < 0 || index >= 9 || item == null || item == class_1802.field_8162) {
            return;
        }
        if (this.universalItems) {
            this.hostItems[index] = item;
            this.viewerItems[index] = item;
            return;
        }
        if (hostSide) {
            this.hostItems[index] = item;
        } else {
            this.viewerItems[index] = item;
        }
    }

    public boolean acceptsStack(class_1799 stack, String side) {
        if (side == null) {
            return false;
        }
        String lowered = side.toLowerCase();
        boolean hostSide = lowered.contains(DEFAULT_SUFFIX_HOST.toLowerCase());
        return this.acceptsStack(stack, hostSide);
    }

    public boolean acceptsStack(class_1799 stack, boolean hostSide) {
        if (stack == null || stack.method_7960()) {
            return false;
        }
        Side expectedSide = hostSide ? Side.HOST : Side.VIEWER;
        return PaperGame.getSideFromMapId(PaperGame.getMapId(stack)) == expectedSide;
    }

    public class_1799 normalizeStack(class_1799 stack, String side) {
        if (side == null) {
            return stack;
        }
        String lowered = side.toLowerCase();
        return this.normalizeStack(stack, lowered.contains(DEFAULT_SUFFIX_HOST.toLowerCase()));
    }

    public class_1799 normalizeStack(class_1799 stack, boolean hostSide) {
        if (stack == null || stack.method_7960()) {
            return stack;
        }
        Side expectedSide = hostSide ? Side.HOST : Side.VIEWER;
        if (PaperGame.getSideFromMapId(PaperGame.getMapId(stack)) == expectedSide) {
            PaperGame.updateDisplayName(stack);
            return stack.method_7972();
        }
        return stack;
    }

    private void restoreOriginals(class_310 client) {
        this.reset();
    }

    private void rigSingleItemMode(class_310 client) {
    }

    private void restoreSingleOriginals(class_310 client, class_1792 mySideItem) {
    }

    private static int extractFirstIntegerAnywhere(String name) {
        return -1;
    }

    private int spoofWorldItems(class_310 client, Side mySide, Side oppSide, int oppMaxNumber) {
        return -1;
    }

    private void spoofInventoryStacks(class_310 client, Side mySide) {
    }

    private int numberFromStackForSide(class_1799 stack, Side side) {
        int mapId = PaperGame.getMapId(stack);
        return PaperGame.getSideFromMapId(mapId) == side ? PaperGame.getNumberFromMapId(mapId) : -1;
    }

    private Side detectSideFromStack(class_1799 stack) {
        return PaperGame.getSideFromMapId(PaperGame.getMapId(stack));
    }

    private boolean isStackForSide(class_1799 stack, Side side, Side oppSide) {
        return this.detectSideFromStack(stack) == side;
    }

    private boolean isUniqueSideItem(class_1792 item, Side side) {
        return item == class_1802.field_8204;
    }

    private int numberForSideItem(class_1792 item, Side side) {
        for (int i = 0; i < 9; ++i) {
            if (this.getItem(side == Side.HOST, i) == item) {
                return i + 1;
            }
        }
        return -1;
    }

    private boolean isSideStack(class_1799 stack, Side side) {
        return this.detectSideFromStack(stack) == side;
    }

    private boolean isSideItem(class_1792 item, Side side) {
        return this.numberForSideItem(item, side) != -1;
    }

    private boolean hasSideTag(String name, Side side) {
        return false;
    }

    private boolean hasAnySideTag(String name) {
        return false;
    }

    private String suffixForSide(Side side) {
        return side == Side.HOST ? this.hostSuffix : this.viewerSuffix;
    }

    private boolean isLegacyBracketMode() {
        return false;
    }

    private String configuredNumericSuffix(Side side) {
        return "";
    }

    private String formatSideNumberLabel(Side side, int number) {
        return number + (side == Side.HOST ? " [Host]" : " [Viewer]");
    }

    private class_1792 itemForSideNumber(Side side, int number) {
        return this.getItem(side == Side.HOST, number - 1);
    }

    private static int parseTaggedNumber(String name, Side side, PaperGame settings) {
        return -1;
    }

    private static int parseTaggedNumber(String name, Side side) {
        return -1;
    }

    private static int maxNumberForSide(class_310 client, Side side, PaperGame settings) {
        return -1;
    }

    private static int pickNextNumber(int currentMax) {
        return -1;
    }

    static int extractNumber(String name) {
        return -1;
    }

    private static ParsedNumber parseLeadingNumber(String name) {
        return null;
    }

    private static String cleanSuffix(String value) {
        return value == null ? null : value.trim();
    }

    public static int getMapId(class_1799 stack) {
        if (stack == null || stack.method_7960() || !stack.method_31574(class_1802.field_8204)) {
            return -1;
        }
        Object value = stack.method_58694(class_9334.field_49646);
        if (value instanceof class_9209) {
            return ((class_9209)value).comp_2315();
        }
        if (value instanceof Integer) {
            return (Integer)value;
        }
        return -1;
    }

    public static Side getSideFromMapId(int mapId) {
        return INSTANCE.getDetectedSideFromMapId(mapId);
    }

    private Side getDetectedSideFromMapId(int mapId) {
        boolean isHost = mapId >= 100 && mapId < 200;
        boolean isViewer = mapId >= 200 && mapId < 300;
        if (!this.sidesSwitched) {
            if (isHost) {
                return Side.HOST;
            }
            if (isViewer) {
                return Side.VIEWER;
            }
        } else {
            if (isHost) {
                return Side.VIEWER;
            }
            if (isViewer) {
                return Side.HOST;
            }
        }
        return null;
    }

    public static int getNumberFromMapId(int mapId) {
        if (mapId >= 100 && mapId < 200) {
            return mapId - 100;
        }
        if (mapId >= 200 && mapId < 300) {
            return mapId - 200;
        }
        return -1;
    }

    public static int getNumberFromMap(class_1799 stack) {
        return PaperGame.getNumberFromMapId(PaperGame.getMapId(stack));
    }

    public static class_1799 createMapForNumber(int number) {
        return PaperGame.createMapForSideNumber(Side.HOST, number);
    }

    public static class_1799 createMapForSideNumber(Side side, int number) {
        int mapId = PaperGame.getMapIdForSideNumber(side, number);
        if (mapId == -1) {
            return class_1799.field_8037;
        }
        class_1799 stack = new class_1799((class_1935)class_1802.field_8204);
        stack.method_57379(class_9334.field_49646, new class_9209(mapId));
        PaperGame.updateDisplayName(stack);
        return stack;
    }

    private static int getMapIdForSideNumber(Side side, int number) {
        if (side == null || number < 1 || number > 9) {
            return -1;
        }
        return side == Side.HOST ? 100 + number : 200 + number;
    }

    private static void updateDisplayName(class_1799 stack) {
        int mapId = PaperGame.getMapId(stack);
        int number = PaperGame.getNumberFromMapId(mapId);
        Side side = PaperGame.getSideFromMapId(mapId);
        if (side == null || number < 1 || number > 9) {
            return;
        }
        String label = number + (side == Side.HOST ? " [Host]" : " [Viewer]");
        stack.method_57379(class_9334.field_49631, class_2561.method_43470(label));
    }

    private static void debugMap(int mapId, int number, Side side) {
        System.out.println("[PaperGame] mapId=" + mapId + " number=" + number + " side=" + side);
    }

    public static enum Side {
        HOST,
        VIEWER
    }

    private static final class ParsedNumber {
        private final int number;
        private final String suffix;

        private ParsedNumber(int number, String suffix) {
            this.number = number;
            this.suffix = suffix;
        }
    }
}

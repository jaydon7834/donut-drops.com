/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.fabricmc.api.EnvType
 *  net.fabricmc.api.Environment
 *  net.minecraft.class_1792
 *  net.minecraft.class_1799
 *  net.minecraft.class_1802
 *  net.minecraft.class_1935
 *  net.minecraft.class_2248
 *  net.minecraft.class_2561
 *  net.minecraft.class_2960
 *  net.minecraft.class_310
 *  net.minecraft.class_332
 *  net.minecraft.class_342
 *  net.minecraft.class_364
 *  net.minecraft.class_437
 *  net.minecraft.class_7923
 */
package dev.verz.casinorigger.client.gui;

import dev.verz.casinorigger.client.gui.SmoothButtonWidget;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.function.Consumer;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.class_1792;
import net.minecraft.class_1799;
import net.minecraft.class_1802;
import net.minecraft.class_1935;
import net.minecraft.class_2248;
import net.minecraft.class_2561;
import net.minecraft.class_2960;
import net.minecraft.class_310;
import net.minecraft.class_332;
import net.minecraft.class_342;
import net.minecraft.class_364;
import net.minecraft.class_437;
import net.minecraft.class_7923;

@Environment(value=EnvType.CLIENT)
public class ItemPickerScreen
extends class_437 {
    private final class_437 parent;
    private final Consumer<class_2960> onPick;
    private class_342 searchField;
    private final List<BlockEntry> allEntries = new ArrayList<BlockEntry>();
    private final List<BlockEntry> filteredEntries = new ArrayList<BlockEntry>();
    private final List<ItemIconButton> itemButtons = new ArrayList<ItemIconButton>();
    private int scrollOffsetRows;

    public ItemPickerScreen(class_437 parent, Consumer<class_2960> onPick) {
        super((class_2561)class_2561.method_43470((String)"Pick Item"));
        this.parent = parent;
        this.onPick = onPick;
    }

    protected void method_25426() {
        this.method_37067();
        this.itemButtons.clear();
        this.scrollOffsetRows = 0;
        this.allEntries.clear();
        for (class_2960 id : class_7923.field_41175.method_10235()) {
            class_1792 item = ((class_2248)class_7923.field_41175.method_63535(id)).method_8389();
            if (item == class_1802.field_8162) continue;
            this.allEntries.add(new BlockEntry(id, new class_1799((class_1935)item)));
        }
        this.allEntries.sort(Comparator.comparing(entry -> entry.id.toString()));
        int searchWidth = Math.min(320, this.field_22789 - 40);
        int searchX = (this.field_22789 - searchWidth) / 2;
        int searchY = 18;
        this.searchField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, searchX, searchY, searchWidth, 20, (class_2561)class_2561.method_43470((String)"Search")));
        this.searchField.method_1863(this::applyFilter);
        this.searchField.method_1880(64);
        this.searchField.method_25365(true);
        this.applyFilter("");
        int doneWidth = 90;
        this.method_37063((class_364)new SmoothButtonWidget((this.field_22789 - doneWidth) / 2, this.field_22790 - 28, doneWidth, 20, (class_2561)class_2561.method_43470((String)"Cancel"), btn -> this.method_25419()));
    }

    public void method_25419() {
        if (this.field_22787 != null) {
            this.field_22787.method_1507(this.parent);
        }
    }

    private void applyFilter(String query) {
        String needle = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        this.filteredEntries.clear();
        if (needle.isEmpty()) {
            this.filteredEntries.addAll(this.allEntries);
        } else {
            for (BlockEntry entry : this.allEntries) {
                String text = entry.id.toString().toLowerCase(Locale.ROOT);
                if (!text.contains(needle)) continue;
                this.filteredEntries.add(entry);
            }
        }
        this.scrollOffsetRows = 0;
        this.rebuildButtons();
    }

    private void rebuildButtons() {
        int baseIndex;
        for (ItemIconButton button : this.itemButtons) {
            this.method_37066((class_364)button);
        }
        this.itemButtons.clear();
        int listTop = 52;
        int listBottom = this.field_22790 - 40;
        int cell = 22;
        int columns = Math.max(1, Math.min(10, (this.field_22789 - 40) / cell));
        int visibleRows = Math.max(1, (listBottom - listTop) / cell);
        int totalRows = (this.filteredEntries.size() + columns - 1) / columns;
        int maxOffset = Math.max(0, totalRows - visibleRows);
        if (this.scrollOffsetRows > maxOffset) {
            this.scrollOffsetRows = maxOffset;
        }
        int gridWidth = columns * cell;
        int startX = (this.field_22789 - gridWidth) / 2;
        int startRow = this.scrollOffsetRows;
        for (int row = 0; row < visibleRows && (baseIndex = (startRow + row) * columns) < this.filteredEntries.size(); ++row) {
            int index;
            int y = listTop + row * cell;
            for (int col = 0; col < columns && (index = baseIndex + col) < this.filteredEntries.size(); ++col) {
                BlockEntry entry = this.filteredEntries.get(index);
                int x = startX + col * cell;
                ItemIconButton button = new ItemIconButton(this, x, y, 20, 20, entry);
                this.itemButtons.add(button);
                this.method_37063((class_364)button);
            }
        }
    }

    public boolean method_25401(double mouseX, double mouseY, double horizontalAmount, double verticalAmount) {
        int listTop = 52;
        int listBottom = this.field_22790 - 40;
        if (mouseY < (double)listTop || mouseY > (double)listBottom) {
            return super.method_25401(mouseX, mouseY, horizontalAmount, verticalAmount);
        }
        if (verticalAmount > 0.0) {
            this.scrollOffsetRows = Math.max(0, this.scrollOffsetRows - 1);
        } else if (verticalAmount < 0.0) {
            this.scrollOffsetRows = Math.min(Integer.MAX_VALUE, this.scrollOffsetRows + 1);
        }
        this.rebuildButtons();
        return true;
    }

    public void method_25394(class_332 context, int mouseX, int mouseY, float delta) {
        super.method_25394(context, mouseX, mouseY, delta);
        context.method_27534(this.field_22793, (class_2561)class_2561.method_43470((String)"Select Block"), this.field_22789 / 2, 8, 0xFFFFFF);
        for (ItemIconButton button : this.itemButtons) {
            if (!button.method_49606()) continue;
            context.method_51438(this.field_22793, (class_2561)class_2561.method_43470((String)button.entry.id.toString()), mouseX, mouseY);
            break;
        }
    }

    private static final class BlockEntry {
        private final class_2960 id;
        private final class_1799 icon;

        private BlockEntry(class_2960 id, class_1799 icon) {
            this.id = id;
            this.icon = icon;
        }
    }

    private final class ItemIconButton
    extends SmoothButtonWidget {
        private final BlockEntry entry;

        private ItemIconButton(ItemPickerScreen itemPickerScreen, int x, int y, int width, int height, BlockEntry entry) {
            super(x, y, width, height, (class_2561)class_2561.method_43473(), (SmoothButtonWidget btn) -> {
                if (dev$verz$casinorigger$client$gui$ItemPickerScreen$this.onPick != null) {
                    dev$verz$casinorigger$client$gui$ItemPickerScreen$this.onPick.accept(entry.id);
                }
                itemPickerScreen.method_25419();
            });
            this.entry = entry;
        }

        @Override
        protected void method_48579(class_332 context, int mouseX, int mouseY, float delta) {
            int x = this.method_46426();
            int y = this.method_46427();
            int bg = this.method_49606() ? -1605678261 : -2144325584;
            context.method_25294(x, y, x + this.method_25368(), y + this.method_25364(), bg);
            int iconX = x + (this.method_25368() - 16) / 2;
            int iconY = y + (this.method_25364() - 16) / 2;
            context.method_51427(this.entry.icon, iconX, iconY);
            context.method_51431(class_310.method_1551().field_1772, this.entry.icon, iconX, iconY);
        }
    }
}


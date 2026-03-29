/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.fabricmc.api.EnvType
 *  net.fabricmc.api.Environment
 *  net.minecraft.class_2561
 *  net.minecraft.class_2960
 *  net.minecraft.class_332
 *  net.minecraft.class_342
 *  net.minecraft.class_364
 *  net.minecraft.class_437
 */
package dev.verz.casinorigger.client.gui;

import dev.verz.casinorigger.client.CasinoriggerClient;
import dev.verz.casinorigger.client.gui.ItemPickerScreen;
import dev.verz.casinorigger.client.gui.SmoothButtonWidget;
import java.util.List;
import java.util.function.Consumer;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.class_2561;
import net.minecraft.class_2960;
import net.minecraft.class_332;
import net.minecraft.class_342;
import net.minecraft.class_364;
import net.minecraft.class_437;

@Environment(value=EnvType.CLIENT)
public class LarpingConfigScreen
extends class_437 {
    private final class_437 parent;
    private float layoutScale = 1.0f;
    private class_342 fakeScoreboardTitleField;
    private class_342 fakeScoreboardMoneyField;
    private class_342 fakeScoreboardShardsField;
    private class_342 fakeScoreboardKillsField;
    private class_342 fakeScoreboardDeathsField;
    private class_342 fakeScoreboardKeyallField;
    private class_342 fakeScoreboardPlaytimeField;
    private class_342 fakeScoreboardTeamField;
    private class_342 fakeScoreboardFooterField;
    private class_342 fakeLootSourceField;
    private class_342 fakeLootTargetField;
    private String pendingLootSourceId;
    private String pendingLootTargetId;
    private int editingLootIndex = -1;
    private int lastEditingLootIndex = -2;

    public LarpingConfigScreen(class_437 parent) {
        super((class_2561)class_2561.method_43470((String)"Larping Config"));
        this.parent = parent;
    }

    protected void method_25426() {
        this.layoutScale = this.computeLayoutScale();
        this.method_37067();
        this.buildContent();
    }

    public void method_25419() {
        if (this.field_22787 != null) {
            this.field_22787.method_1507(this.parent);
        }
    }

    public void method_25394(class_332 context, int mouseX, int mouseY, float delta) {
        super.method_25394(context, mouseX, mouseY, delta);
    }

    private void buildContent() {
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null) {
            return;
        }
        int width = Math.min(this.field_22789 - 12, this.s(440));
        int x = (this.field_22789 - width) / 2;
        int y = this.s(18);
        this.method_37063((class_364)new SmoothButtonWidget(x, y, width, this.s(20), (class_2561)class_2561.method_43470((String)"Back"), btn -> this.method_25419()));
        this.fakeScoreboardTitleField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(30), width, this.s(20), (class_2561)class_2561.method_43470((String)"Scoreboard Title")));
        this.fakeScoreboardTitleField.method_1880(64);
        this.fakeScoreboardTitleField.method_1852(client.getFakeScoreboardTitle());
        this.fakeScoreboardTitleField.method_1863(client::setFakeScoreboardTitle);
        int scoreboardColWidth = (width - this.s(8)) / 2;
        this.fakeScoreboardMoneyField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(24), scoreboardColWidth, this.s(20), (class_2561)class_2561.method_43470((String)"Money")));
        this.fakeScoreboardMoneyField.method_1880(64);
        this.fakeScoreboardMoneyField.method_1852(client.getFakeScoreboardMoney());
        this.fakeScoreboardMoneyField.method_1863(client::setFakeScoreboardMoney);
        this.fakeScoreboardShardsField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x + scoreboardColWidth + this.s(8), y, scoreboardColWidth, this.s(20), (class_2561)class_2561.method_43470((String)"Shards")));
        this.fakeScoreboardShardsField.method_1880(64);
        this.fakeScoreboardShardsField.method_1852(client.getFakeScoreboardShards());
        this.fakeScoreboardShardsField.method_1863(client::setFakeScoreboardShards);
        this.fakeScoreboardKillsField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(24), scoreboardColWidth, this.s(20), (class_2561)class_2561.method_43470((String)"Kills")));
        this.fakeScoreboardKillsField.method_1880(64);
        this.fakeScoreboardKillsField.method_1852(client.getFakeScoreboardKills());
        this.fakeScoreboardKillsField.method_1863(client::setFakeScoreboardKills);
        this.fakeScoreboardDeathsField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x + scoreboardColWidth + this.s(8), y, scoreboardColWidth, this.s(20), (class_2561)class_2561.method_43470((String)"Deaths")));
        this.fakeScoreboardDeathsField.method_1880(64);
        this.fakeScoreboardDeathsField.method_1852(client.getFakeScoreboardDeaths());
        this.fakeScoreboardDeathsField.method_1863(client::setFakeScoreboardDeaths);
        this.fakeScoreboardKeyallField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(24), scoreboardColWidth, this.s(20), (class_2561)class_2561.method_43470((String)"Keyall Timer")));
        this.fakeScoreboardKeyallField.method_1880(64);
        this.fakeScoreboardKeyallField.method_1852(client.getFakeScoreboardKeyall());
        this.fakeScoreboardKeyallField.method_1863(client::setFakeScoreboardKeyall);
        this.fakeScoreboardPlaytimeField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x + scoreboardColWidth + this.s(8), y, scoreboardColWidth, this.s(20), (class_2561)class_2561.method_43470((String)"Playtime")));
        this.fakeScoreboardPlaytimeField.method_1880(64);
        this.fakeScoreboardPlaytimeField.method_1852(client.getFakeScoreboardPlaytime());
        this.fakeScoreboardPlaytimeField.method_1863(client::setFakeScoreboardPlaytime);
        this.fakeScoreboardTeamField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(24), scoreboardColWidth, this.s(20), (class_2561)class_2561.method_43470((String)"Team")));
        this.fakeScoreboardTeamField.method_1880(64);
        this.fakeScoreboardTeamField.method_1852(client.getFakeScoreboardTeam());
        this.fakeScoreboardTeamField.method_1863(client::setFakeScoreboardTeam);
        this.fakeScoreboardFooterField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x + scoreboardColWidth + this.s(8), y, scoreboardColWidth, this.s(20), (class_2561)class_2561.method_43470((String)"Footer")));
        this.fakeScoreboardFooterField.method_1880(64);
        this.fakeScoreboardFooterField.method_1852(client.getFakeScoreboardFooter());
        this.fakeScoreboardFooterField.method_1863(client::setFakeScoreboardFooter);
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(30), width, this.s(20), (class_2561)class_2561.method_43470((String)("Fake Lootdrop: " + LarpingConfigScreen.onOff(client.isFakeLootdropEnabled()))), btn -> {
            client.setFakeLootdropEnabled(!client.isFakeLootdropEnabled());
            btn.method_25355((class_2561)class_2561.method_43470((String)("Fake Lootdrop: " + LarpingConfigScreen.onOff(client.isFakeLootdropEnabled()))));
        }));
        y += this.s(24);
        int pickerWidth = width - this.s(48);
        int pickerButtonSize = this.s(20);
        int pickerGap = this.s(4);
        int pickerX = x;
        if (this.editingLootIndex != this.lastEditingLootIndex) {
            CasinoriggerClient.FakeLootEntry editing;
            this.lastEditingLootIndex = this.editingLootIndex;
            if (this.editingLootIndex >= 0 && this.editingLootIndex < client.getFakeLootEntries().size() && (editing = client.getFakeLootEntries().get(this.editingLootIndex)) != null) {
                this.pendingLootSourceId = editing.sourceId;
                this.pendingLootTargetId = editing.targetId;
            }
        }
        this.fakeLootSourceField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, pickerX, y, pickerWidth, this.s(20), (class_2561)class_2561.method_43470((String)"Lootdrop Block 1")));
        this.fakeLootSourceField.method_1880(64);
        this.fakeLootSourceField.method_1852(this.pendingLootSourceId == null ? "" : this.pendingLootSourceId);
        this.fakeLootSourceField.method_1863(text -> {
            this.pendingLootSourceId = text;
        });
        this.method_37063((class_364)new SmoothButtonWidget(pickerX + pickerWidth + pickerGap, y, pickerButtonSize, this.s(20), (class_2561)class_2561.method_43470((String)"..."), btn -> this.openItemPicker(id -> {
            if (this.fakeLootSourceField != null) {
                this.fakeLootSourceField.method_1852(id.toString());
            }
            this.pendingLootSourceId = id.toString();
        })));
        this.fakeLootTargetField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, pickerX, y += this.s(24), pickerWidth, this.s(20), (class_2561)class_2561.method_43470((String)"Lootdrop Block 2")));
        this.fakeLootTargetField.method_1880(64);
        this.fakeLootTargetField.method_1852(this.pendingLootTargetId == null ? "" : this.pendingLootTargetId);
        this.fakeLootTargetField.method_1863(text -> {
            this.pendingLootTargetId = text;
        });
        this.method_37063((class_364)new SmoothButtonWidget(pickerX + pickerWidth + pickerGap, y, pickerButtonSize, this.s(20), (class_2561)class_2561.method_43470((String)"..."), btn -> this.openItemPicker(id -> {
            if (this.fakeLootTargetField != null) {
                this.fakeLootTargetField.method_1852(id.toString());
            }
            this.pendingLootTargetId = id.toString();
        })));
        String actionLabel = this.editingLootIndex >= 0 ? "Update Loot Entry" : "Add Loot Entry";
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)actionLabel), btn -> {
            String source = this.normalizeItemId(this.fakeLootSourceField != null ? this.fakeLootSourceField.method_1882() : "");
            String target = this.normalizeItemId(this.fakeLootTargetField != null ? this.fakeLootTargetField.method_1882() : "");
            if (source.isBlank() || target.isBlank()) {
                return;
            }
            if (this.editingLootIndex >= 0) {
                client.updateFakeLootEntry(this.editingLootIndex, source, target);
            } else {
                client.addFakeLootEntry(source, target);
            }
            this.editingLootIndex = -1;
            this.lastEditingLootIndex = -2;
            this.pendingLootSourceId = "";
            this.pendingLootTargetId = "";
            if (this.fakeLootSourceField != null) {
                this.fakeLootSourceField.method_1852("");
            }
            if (this.fakeLootTargetField != null) {
                this.fakeLootTargetField.method_1852("");
            }
            this.method_25426();
        }));
        y += this.s(28);
        List<CasinoriggerClient.FakeLootEntry> entries = client.getFakeLootEntries();
        int rowHeight = this.s(20);
        int rowGap = this.s(4);
        int buttonSize = this.s(34);
        int labelWidth = Math.max(this.s(80), width - (buttonSize * 3 + this.s(12)));
        for (int i = 0; i < entries.size(); ++i) {
            CasinoriggerClient.FakeLootEntry entry = entries.get(i);
            if (entry == null) continue;
            int index = i;
            int rowY = y + i * (rowHeight + rowGap);
            String label = LarpingConfigScreen.trimName(entry.sourceId, 24) + " -> " + LarpingConfigScreen.trimName(entry.targetId, 24);
            this.method_37063((class_364)new SmoothButtonWidget(x, rowY, labelWidth, rowHeight, (class_2561)class_2561.method_43470((String)label), btn -> {}));
            this.method_37063((class_364)new SmoothButtonWidget(x + labelWidth + this.s(4), rowY, buttonSize, rowHeight, (class_2561)class_2561.method_43470((String)(entry.enabled ? "ON" : "OFF")), btn -> {
                client.setFakeLootEntryEnabled(index, !entry.enabled);
                this.method_25426();
            }));
            this.method_37063((class_364)new SmoothButtonWidget(x + labelWidth + this.s(4) + buttonSize + this.s(2), rowY, buttonSize, rowHeight, (class_2561)class_2561.method_43470((String)"EDIT"), btn -> {
                this.editingLootIndex = index;
                this.method_25426();
            }));
            this.method_37063((class_364)new SmoothButtonWidget(x + labelWidth + this.s(4) + buttonSize * 2 + this.s(4), rowY, buttonSize, rowHeight, (class_2561)class_2561.method_43470((String)"DEL"), btn -> {
                client.removeFakeLootEntry(index);
                if (this.editingLootIndex == index) {
                    this.editingLootIndex = -1;
                }
                this.method_25426();
            }));
        }
    }

    private void openItemPicker(Consumer<class_2960> onPick) {
        if (this.field_22787 == null) {
            return;
        }
        this.field_22787.method_1507((class_437)new ItemPickerScreen(this, onPick));
    }

    private static String trimName(String name, int max) {
        if (name == null || name.length() <= max) {
            return name;
        }
        return name.substring(0, Math.max(0, max - 1)) + "~";
    }

    private static String onOff(boolean value) {
        return value ? "ON" : "OFF";
    }

    private String normalizeItemId(String raw) {
        if (raw == null) {
            return "";
        }
        Object trimmed = raw.trim();
        if (((String)trimmed).isEmpty()) {
            return "";
        }
        if (!((String)trimmed).contains(":")) {
            trimmed = "minecraft:" + (String)trimmed;
        }
        try {
            class_2960 id = class_2960.method_60654((String)trimmed);
            return id.toString();
        }
        catch (Exception ignored) {
            return trimmed;
        }
    }

    private int s(int value) {
        return Math.max(1, Math.round((float)value * this.layoutScale));
    }

    private float computeLayoutScale() {
        float widthScale = ((float)this.field_22789 - 12.0f) / 460.0f;
        float heightScale = ((float)this.field_22790 - 12.0f) / 360.0f;
        float scale = Math.min(widthScale, heightScale);
        return Math.max(0.7f, Math.min(1.0f, scale));
    }
}


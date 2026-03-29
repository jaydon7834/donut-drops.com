/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.fabricmc.api.EnvType
 *  net.fabricmc.api.Environment
 *  net.minecraft.class_11908
 *  net.minecraft.class_1792
 *  net.minecraft.class_1799
 *  net.minecraft.class_1802
 *  net.minecraft.class_1935
 *  net.minecraft.class_2561
 *  net.minecraft.class_2960
 *  net.minecraft.class_310
 *  net.minecraft.class_332
 *  net.minecraft.class_342
 *  net.minecraft.class_364
 *  net.minecraft.class_437
 *  net.minecraft.class_5250
 *  net.minecraft.class_7923
 */
package dev.verz.casinorigger.client.gui;

import dev.verz.casinorigger.client.CasinoriggerClient;
import dev.verz.casinorigger.client.gui.ItemPickerScreen;
import dev.verz.casinorigger.client.gui.LarpingConfigScreen;
import dev.verz.casinorigger.client.gui.SmoothButtonWidget;
import dev.verz.casinorigger.client.gui.UiTheme;
import dev.verz.casinorigger.client.rigger.Blackjack;
import dev.verz.casinorigger.client.rigger.FiftyFifty;
import dev.verz.casinorigger.client.rigger.FortyFiveTen;
import dev.verz.casinorigger.client.rigger.PaperGame;
import dev.verz.casinorigger.client.rigger.RussianRoulette;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Consumer;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.class_11908;
import net.minecraft.class_1792;
import net.minecraft.class_1799;
import net.minecraft.class_1802;
import net.minecraft.class_1935;
import net.minecraft.class_2561;
import net.minecraft.class_2960;
import net.minecraft.class_310;
import net.minecraft.class_332;
import net.minecraft.class_342;
import net.minecraft.class_364;
import net.minecraft.class_437;
import net.minecraft.class_5250;
import net.minecraft.class_7923;

@Environment(value=EnvType.CLIENT)
public class OptimizationSettingsScreen
extends class_437 {
    private final class_437 parent;
    private Tab currentTab = Tab.SETTINGS;
    private boolean paperEditHost = true;
    private KeyAction listeningAction;
    private final Map<KeyAction, SmoothButtonWidget> keyButtons = new EnumMap<KeyAction, SmoothButtonWidget>(KeyAction.class);
    private float layoutScale = 1.0f;
    private class_342 paperLeftField;
    private class_342 paperRightField;
    private class_342 paperHostSuffixField;
    private class_342 paperViewerSuffixField;
    private class_342 fiftyLeftField;
    private class_342 fiftyRightField;
    private class_342 fakePayTargetField;
    private class_342 fakePayAmountField;
    private class_342 scoreboardMoneyAddField;
    private class_342 fakeLootSourceField;
    private class_342 fakeLootTargetField;
    private String pendingLootSourceId;
    private String pendingLootTargetId;
    private int lastEditingLootIndex = -2;
    private class_342 fakeScoreboardTitleField;
    private class_342 fakeScoreboardMoneyField;
    private class_342 fakeScoreboardShardsField;
    private class_342 fakeScoreboardKillsField;
    private class_342 fakeScoreboardDeathsField;
    private class_342 fakeScoreboardKeyallField;
    private class_342 fakeScoreboardPlaytimeField;
    private class_342 fakeScoreboardTeamField;
    private class_342 fakeScoreboardFooterField;
    private class_342 russianTriggerField;
    private class_342 russianNormalField;
    private class_342 fortyFirstField;
    private class_342 fortySecondField;
    private class_342 fortyMiddleField;
    private boolean blurredThisFrame;
    private boolean showScoreboardRigSettings;
    private boolean showFakeLootdropSettings;
    private int editingLootIndex = -1;

    public OptimizationSettingsScreen(class_437 parent) {
        super((class_2561)class_2561.method_43470((String)"Optimization Settings"));
        this.parent = parent;
    }

    protected void method_25426() {
        this.rebuildUi();
    }

    public void method_25394(class_332 context, int mouseX, int mouseY, float delta) {
        this.blurredThisFrame = false;
        super.method_25394(context, mouseX, mouseY, delta);
        int titleY = this.s(12);
        int subtitleY = this.s(24);
        context.method_27534(this.field_22793, (class_2561)class_2561.method_43470((String)"Verz's Casino Rigger"), this.field_22789 / 2, titleY, 0xFFFFFF);
        context.method_27534(this.field_22793, (class_2561)class_2561.method_43470((String)"Optimization Settings"), this.field_22789 / 2, subtitleY, 0xFFFFFF);
        int hintY = this.s(36);
        context.method_27534(this.field_22793, (class_2561)class_2561.method_43470((String)this.currentTab.subtitle), this.field_22789 / 2, hintY, 0xB0B0B0);
        if (this.currentTab == Tab.FAKE_PAY) {
            String editing = this.focusedFakeScoreboardFieldLabel();
            int editY = hintY + this.s(12);
            context.method_27534(this.field_22793, (class_2561)class_2561.method_43470((String)("Editing: " + editing)), this.field_22789 / 2, editY, 16765567);
            this.drawFieldLabel(context, this.fakePayTargetField, "Target");
            this.drawFieldLabel(context, this.fakePayAmountField, "Amount (e.g. 1.2M)");
            this.drawFieldLabel(context, this.scoreboardMoneyAddField, "Score Add (e.g. +10M)");
            this.drawFieldLabel(context, this.fakeLootSourceField, "Lootdrop Item 1");
            this.drawFieldLabel(context, this.fakeLootTargetField, "Lootdrop Item 2");
            this.drawFieldLabel(context, this.fakeScoreboardTitleField, "Scoreboard Title");
            this.drawFieldLabel(context, this.fakeScoreboardMoneyField, "Money");
            this.drawFieldLabel(context, this.fakeScoreboardShardsField, "Shards");
            this.drawFieldLabel(context, this.fakeScoreboardKillsField, "Kills");
            this.drawFieldLabel(context, this.fakeScoreboardDeathsField, "Deaths");
            this.drawFieldLabel(context, this.fakeScoreboardKeyallField, "Keyall Timer");
            this.drawFieldLabel(context, this.fakeScoreboardPlaytimeField, "Playtime");
            this.drawFieldLabel(context, this.fakeScoreboardTeamField, "Team");
            this.drawFieldLabel(context, this.fakeScoreboardFooterField, "Footer (AUTO or region)");
        }
    }

    public void method_25420(class_332 context, int mouseX, int mouseY, float delta) {
        if (this.blurredThisFrame) {
            return;
        }
        this.blurredThisFrame = true;
        super.method_25420(context, mouseX, mouseY, delta);
    }

    public void method_25419() {
        if (this.field_22787 != null) {
            this.field_22787.method_1507(this.parent);
        }
    }

    public boolean method_25404(class_11908 keyInput) {
        if (this.listeningAction != null) {
            int keyCode = keyInput.comp_4795();
            int resolved = keyCode == 256 || keyCode == 259 || keyCode == 261 ? -1 : keyCode;
            this.setActionKey(this.listeningAction, resolved);
            this.listeningAction = null;
            this.refreshKeyLabels();
            return true;
        }
        int keyCode = keyInput.comp_4795();
        if (keyCode == 257 || keyCode == 335) {
            this.applyAllFields();
            return true;
        }
        if (keyCode == 256) {
            this.method_25419();
            return true;
        }
        return super.method_25404(keyInput);
    }

    private void rebuildUi() {
        this.method_37067();
        this.keyButtons.clear();
        this.listeningAction = null;
        this.layoutScale = this.computeLayoutScale();
        int contentWidth = Math.min(this.s(460), this.field_22789 - this.s(24));
        int contentLeft = (this.field_22789 - contentWidth) / 2;
        int tabsY = this.s(44);
        Tab[] tabs = Tab.values();
        int tabGap = this.s(4);
        int tabWidth = (contentWidth - (tabs.length - 1) * tabGap) / tabs.length;
        for (int i = 0; i < tabs.length; ++i) {
            Tab tab = tabs[i];
            int x = contentLeft + i * (tabWidth + tabGap);
            class_5250 label = this.currentTab == tab ? class_2561.method_43470((String)("[" + tab.label + "]")) : class_2561.method_43470((String)tab.label);
            this.method_37063((class_364)new SmoothButtonWidget(x, tabsY, tabWidth, this.s(20), (class_2561)label, btn -> {
                this.currentTab = tab;
                this.rebuildUi();
            }));
        }
        int contentX = contentLeft + this.s(20);
        int contentInnerWidth = contentWidth - this.s(40);
        int y = tabsY + this.s(34);
        switch (this.currentTab.ordinal()) {
            case 0: {
                this.buildSettings(contentX, contentInnerWidth, y);
                break;
            }
            case 1: {
                this.buildPaper(contentX, contentInnerWidth, y);
                break;
            }
            case 2: {
                this.buildFifty(contentX, contentInnerWidth, y);
                break;
            }
            case 3: {
                this.buildRussian(contentX, contentInnerWidth, y);
                break;
            }
            case 4: {
                this.buildFortyFiveTen(contentX, contentInnerWidth, y);
                break;
            }
            case 5: {
                this.buildBlackjack(contentX, contentInnerWidth, y);
                break;
            }
            case 6: {
                this.buildFakePay(contentX, contentInnerWidth, y);
            }
        }
        int doneWidth = this.s(120);
        this.method_37063((class_364)new SmoothButtonWidget(contentLeft + (contentWidth - doneWidth) / 2, this.field_22790 - this.s(30), doneWidth, this.s(20), (class_2561)class_2561.method_43470((String)"Done"), btn -> this.method_25419()));
    }

    private void buildSettings(int x, int width, int y) {
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null) {
            return;
        }
        this.method_37063((class_364)new SmoothButtonWidget(x, y, width, this.s(20), (class_2561)class_2561.method_43470((String)("Overlay: " + OptimizationSettingsScreen.onOff(client.isOverlayEnabled()))), btn -> {
            client.setOverlayEnabled(!client.isOverlayEnabled());
            btn.method_25355((class_2561)class_2561.method_43470((String)("Overlay: " + OptimizationSettingsScreen.onOff(client.isOverlayEnabled()))));
        }));
        this.addKeyButton(KeyAction.OPEN_MENU, x, y += this.s(24), width);
        this.addKeyButton(KeyAction.OPEN_EXTERNAL_OVERLAY, x, y += this.s(24), width);
        this.addKeyButton(KeyAction.TOGGLE_OVERLAY, x, y += this.s(24), width);
        this.addKeyButton(KeyAction.CYCLE_MODE_UP, x, y += this.s(24), width);
        this.addKeyButton(KeyAction.CYCLE_MODE_DOWN, x, y += this.s(24), width);
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)("Theme: " + UiTheme.byIndex((int)client.getUiThemeIndex()).label)), btn -> {
            client.setUiThemeIndex(client.getUiThemeIndex() + 1);
            btn.method_25355((class_2561)class_2561.method_43470((String)("Theme: " + UiTheme.byIndex((int)client.getUiThemeIndex()).label)));
        }));
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)"Open External Overlay"), btn -> client.launchExternalOverlay()));
    }

    private void buildFakePay(int x, int width, int y) {
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null) {
            return;
        }
        int gearSize = this.s(20);
        int gearGap = this.s(4);
        int mainWidth = Math.max(this.s(80), width - gearSize - gearGap);
        this.method_37063((class_364)new SmoothButtonWidget(x, y, width, this.s(20), (class_2561)class_2561.method_43470((String)("Fake Pay Enabled: " + OptimizationSettingsScreen.onOff(client.isFakePayEnabled()))), btn -> {
            client.setFakePayEnabled(!client.isFakePayEnabled());
            btn.method_25355((class_2561)class_2561.method_43470((String)("Fake Pay Enabled: " + OptimizationSettingsScreen.onOff(client.isFakePayEnabled()))));
        }));
        this.addKeyButton(KeyAction.TOGGLE_FAKE_PAY, x, y += this.s(24), width);
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)("Fake Media: " + OptimizationSettingsScreen.onOff(client.isFakeMediaEnabled()))), btn -> {
            client.setFakeMediaEnabled(!client.isFakeMediaEnabled());
            btn.method_25355((class_2561)class_2561.method_43470((String)("Fake Media: " + OptimizationSettingsScreen.onOff(client.isFakeMediaEnabled()))));
        }));
        SmoothButtonWidget scoreboardRigBtn = new SmoothButtonWidget(x, y += this.s(24), mainWidth, this.s(20), (class_2561)class_2561.method_43470((String)("Scoreboard Rig: " + OptimizationSettingsScreen.onOff(client.isScoreboardRigEnabled()))), btn -> {
            client.setScoreboardRigEnabled(!client.isScoreboardRigEnabled());
            btn.method_25355((class_2561)class_2561.method_43470((String)("Scoreboard Rig: " + OptimizationSettingsScreen.onOff(client.isScoreboardRigEnabled()))));
        });
        this.method_37063((class_364)scoreboardRigBtn);
        this.method_37063((class_364)new SmoothButtonWidget(x + mainWidth + gearGap, y, gearSize, this.s(20), (class_2561)class_2561.method_43470((String)"S"), btn -> this.openLarpingConfig()));
        y += this.s(24);
        if (this.showScoreboardRigSettings) {
            this.scoreboardMoneyAddField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y, width, this.s(20), (class_2561)class_2561.method_43470((String)"Score Add (e.g. +10M)")));
            this.scoreboardMoneyAddField.method_1880(32);
            this.scoreboardMoneyAddField.method_1852(OptimizationSettingsScreen.formatScoreboardAdd(client));
            this.scoreboardMoneyAddField.method_1863(value -> {
                double parsed = client.parseScoreboardAmountInput((String)value);
                if (!Double.isNaN(parsed)) {
                    client.setScoreboardMoneyAdd(parsed);
                }
            });
            this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)("Fake Scoreboard: " + OptimizationSettingsScreen.onOff(client.isFakeScoreboardEnabled()))), btn -> {
                client.setFakeScoreboardEnabled(!client.isFakeScoreboardEnabled());
                btn.method_25355((class_2561)class_2561.method_43470((String)("Fake Scoreboard: " + OptimizationSettingsScreen.onOff(client.isFakeScoreboardEnabled()))));
            }));
            y += this.s(24);
        }
        SmoothButtonWidget lootdropBtn = new SmoothButtonWidget(x, y, mainWidth, this.s(20), (class_2561)class_2561.method_43470((String)("Fake Lootdrop: " + OptimizationSettingsScreen.onOff(client.isFakeLootdropEnabled()))), btn -> {
            client.setFakeLootdropEnabled(!client.isFakeLootdropEnabled());
            btn.method_25355((class_2561)class_2561.method_43470((String)("Fake Lootdrop: " + OptimizationSettingsScreen.onOff(client.isFakeLootdropEnabled()))));
        });
        this.method_37063((class_364)lootdropBtn);
        this.method_37063((class_364)new SmoothButtonWidget(x + mainWidth + gearGap, y, gearSize, this.s(20), (class_2561)class_2561.method_43470((String)"S"), btn -> this.openLarpingConfig()));
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)("Solid Schematic: " + OptimizationSettingsScreen.onOff(client.isSolidSchematicEnabled()))), btn -> {
            client.setSolidSchematicEnabled(!client.isSolidSchematicEnabled());
            btn.method_25355((class_2561)class_2561.method_43470((String)("Solid Schematic: " + OptimizationSettingsScreen.onOff(client.isSolidSchematicEnabled()))));
        }));
        int colWidth = (width - this.s(8)) / 2;
        this.fakePayTargetField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(26), colWidth, this.s(20), (class_2561)class_2561.method_43470((String)"Target")));
        this.fakePayTargetField.method_1880(32);
        this.fakePayAmountField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x + colWidth + this.s(8), y, colWidth, this.s(20), (class_2561)class_2561.method_43470((String)"Amount (e.g. 1.2M)")));
        this.fakePayAmountField.method_1880(32);
        y += this.s(32);
        if (this.showFakeLootdropSettings) {
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
                this.rebuildUi();
            }));
            y += this.s(28);
            List<CasinoriggerClient.FakeLootEntry> entries = client.getFakeLootEntries();
            int rowHeight = this.s(20);
            int rowGap = this.s(4);
            int buttonSize = this.s(20);
            int labelWidth = Math.max(this.s(80), width - (buttonSize * 3 + this.s(8)));
            for (int i = 0; i < entries.size(); ++i) {
                CasinoriggerClient.FakeLootEntry entry = entries.get(i);
                if (entry == null) continue;
                int index = i;
                int rowY = y + i * (rowHeight + rowGap);
                String label = OptimizationSettingsScreen.trimName(entry.sourceId, 24) + " -> " + OptimizationSettingsScreen.trimName(entry.targetId, 24);
                this.method_37063((class_364)new SmoothButtonWidget(x, rowY, labelWidth, rowHeight, (class_2561)class_2561.method_43470((String)label), btn -> {}));
                this.method_37063((class_364)new SmoothButtonWidget(x + labelWidth + this.s(4), rowY, buttonSize, rowHeight, (class_2561)class_2561.method_43470((String)(entry.enabled ? "ON" : "OFF")), btn -> {
                    client.setFakeLootEntryEnabled(index, !entry.enabled);
                    this.rebuildUi();
                }));
                this.method_37063((class_364)new SmoothButtonWidget(x + labelWidth + this.s(4) + buttonSize + this.s(2), rowY, buttonSize, rowHeight, (class_2561)class_2561.method_43470((String)"Edit"), btn -> {
                    this.editingLootIndex = index;
                    this.rebuildUi();
                }));
                this.method_37063((class_364)new SmoothButtonWidget(x + labelWidth + this.s(4) + buttonSize * 2 + this.s(4), rowY, buttonSize, rowHeight, (class_2561)class_2561.method_43470((String)"X"), btn -> {
                    client.removeFakeLootEntry(index);
                    if (this.editingLootIndex == index) {
                        this.editingLootIndex = -1;
                    }
                    this.rebuildUi();
                }));
            }
            y += entries.size() * (rowHeight + rowGap);
        }
        if (this.showScoreboardRigSettings) {
            this.fakeScoreboardTitleField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y, width, this.s(20), (class_2561)class_2561.method_43470((String)"Scoreboard Title")));
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
        }
    }

    private void drawFieldLabel(class_332 context, class_342 field, String label) {
        if (field == null) {
            return;
        }
        int x = field.method_46426();
        int y = field.method_46427() - this.s(10);
        context.method_27535(this.field_22793, (class_2561)class_2561.method_43470((String)label), x + this.s(2), y, 0xB0B0B0);
    }

    private String focusedFakeScoreboardFieldLabel() {
        if (this.fakePayTargetField != null && this.fakePayTargetField.method_25370()) {
            return "Target";
        }
        if (this.fakePayAmountField != null && this.fakePayAmountField.method_25370()) {
            return "Amount";
        }
        if (this.scoreboardMoneyAddField != null && this.scoreboardMoneyAddField.method_25370()) {
            return "Score Add";
        }
        if (this.fakeLootSourceField != null && this.fakeLootSourceField.method_25370()) {
            return "Lootdrop Item 1";
        }
        if (this.fakeLootTargetField != null && this.fakeLootTargetField.method_25370()) {
            return "Lootdrop Item 2";
        }
        if (this.fakeScoreboardTitleField != null && this.fakeScoreboardTitleField.method_25370()) {
            return "Scoreboard Title";
        }
        if (this.fakeScoreboardMoneyField != null && this.fakeScoreboardMoneyField.method_25370()) {
            return "Money";
        }
        if (this.fakeScoreboardShardsField != null && this.fakeScoreboardShardsField.method_25370()) {
            return "Shards";
        }
        if (this.fakeScoreboardKillsField != null && this.fakeScoreboardKillsField.method_25370()) {
            return "Kills";
        }
        if (this.fakeScoreboardDeathsField != null && this.fakeScoreboardDeathsField.method_25370()) {
            return "Deaths";
        }
        if (this.fakeScoreboardKeyallField != null && this.fakeScoreboardKeyallField.method_25370()) {
            return "Keyall Timer";
        }
        if (this.fakeScoreboardPlaytimeField != null && this.fakeScoreboardPlaytimeField.method_25370()) {
            return "Playtime";
        }
        if (this.fakeScoreboardTeamField != null && this.fakeScoreboardTeamField.method_25370()) {
            return "Team";
        }
        if (this.fakeScoreboardFooterField != null && this.fakeScoreboardFooterField.method_25370()) {
            return "Footer";
        }
        return "None";
    }

    private void buildPaper(int x, int width, int y) {
        PaperGame paper = PaperGame.getInstance();
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null) {
            return;
        }
        this.method_37063((class_364)new SmoothButtonWidget(x, y, width, this.s(20), (class_2561)class_2561.method_43470((String)"Active Rig: Paper"), btn -> client.selectPaperRig()));
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)("Winner: " + (paper.leftWin ? "Host" : "Viewer"))), btn -> {
            paper.leftWin = !paper.leftWin;
            client.saveItemConfig();
            btn.method_25355((class_2561)class_2561.method_43470((String)("Winner: " + (paper.leftWin ? "Host" : "Viewer"))));
        }));
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)("Mode: " + (paper.isSingleItemPaper() ? "Single Item" : "Multi Item"))), btn -> {
            paper.setSingleItemPaper(!paper.isSingleItemPaper());
            if (!paper.isSingleItemPaper()) {
                paper.setUniversalItems(false);
            }
            client.saveItemConfig();
            this.rebuildUi();
        }));
        this.addKeyButton(KeyAction.TOGGLE_PAPER, x, y += this.s(24), width);
        this.addKeyButton(KeyAction.SWITCH_PAPER_SIDE, x, y += this.s(24), width);
        this.paperHostSuffixField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(26), (width - this.s(8)) / 2, this.s(20), (class_2561)class_2561.method_43470((String)"Host suffix (after number)")));
        this.paperHostSuffixField.method_1852(paper.getHostSuffix());
        this.paperViewerSuffixField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x + (width + this.s(8)) / 2, y, (width - this.s(8)) / 2, this.s(20), (class_2561)class_2561.method_43470((String)"Player suffix (after number)")));
        this.paperViewerSuffixField.method_1852(paper.getViewerSuffix());
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(26), width, this.s(20), (class_2561)class_2561.method_43470((String)"Import Hotbar -> 1-9"), btn -> {
            this.importHotbarToPaperItems(this.paperEditHost);
            this.rebuildUi();
        }));
        y += this.s(26);
        if (!paper.isSingleItemPaper()) {
            this.method_37063((class_364)new SmoothButtonWidget(x, y, width, this.s(20), (class_2561)class_2561.method_43470((String)("Editing: " + (this.paperEditHost ? "Host [1-9]" : "Viewer [1-9]"))), btn -> {
                this.paperEditHost = !this.paperEditHost;
                this.rebuildUi();
            }));
            y += this.s(24);
            int colWidth = (width - this.s(8)) / 2;
            for (int i = 0; i < 9; ++i) {
                int index = i;
                int colX = x + i % 2 * (colWidth + this.s(8));
                int rowY = y + i / 2 * this.s(24);
                class_1792 item = paper.getItem(this.paperEditHost, index);
                class_1799 stack = new class_1799((class_1935)item);
                String label = Integer.toString(index + 1);
                this.method_37063((class_364)new IconSlotButton(colX, rowY, colWidth, this.s(20), (class_2561)class_2561.method_43470((String)label), stack, btn -> {
                    this.setPaperSlotFromHand(this.paperEditHost, index);
                    this.rebuildUi();
                }));
            }
            return;
        }
        this.paperLeftField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y, width - this.s(96), this.s(20), (class_2561)class_2561.method_43470((String)"host")));
        this.paperLeftField.method_1852(OptimizationSettingsScreen.itemId(paper.leftSideItem));
        this.method_37063((class_364)new SmoothButtonWidget(x + width - this.s(92), y, this.s(92), this.s(20), (class_2561)class_2561.method_43470((String)"Host Item"), btn -> this.setFromHand(true, false, false)));
        this.paperRightField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(24), width - this.s(96), this.s(20), (class_2561)class_2561.method_43470((String)"viewer")));
        this.paperRightField.method_1852(OptimizationSettingsScreen.itemId(paper.rightSideItem));
        this.method_37063((class_364)new SmoothButtonWidget(x + width - this.s(92), y, this.s(92), this.s(20), (class_2561)class_2561.method_43470((String)"Viewer Item"), btn -> this.setFromHand(false, false, false)));
    }

    private void buildFifty(int x, int width, int y) {
        FiftyFifty fifty = FiftyFifty.getInstance();
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null) {
            return;
        }
        this.method_37063((class_364)new SmoothButtonWidget(x, y, width, this.s(20), (class_2561)class_2561.method_43470((String)"Active Rig: 50/50"), btn -> client.selectFiftyRig()));
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)("Winner: " + (fifty.leftWin ? "1st Item" : "2nd Item"))), btn -> {
            fifty.leftWin = !fifty.leftWin;
            client.saveItemConfig();
            btn.method_25355((class_2561)class_2561.method_43470((String)("Winner: " + (fifty.leftWin ? "1st Item" : "2nd Item"))));
        }));
        this.addKeyButton(KeyAction.TOGGLE_FIFTY, x, y += this.s(24), width);
        this.addKeyButton(KeyAction.SWITCH_FIFTY_SIDE, x, y += this.s(24), width);
        this.fiftyLeftField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(26), width - this.s(96), this.s(20), (class_2561)class_2561.method_43470((String)"left")));
        this.fiftyLeftField.method_1852(OptimizationSettingsScreen.itemId(fifty.leftSideItem));
        this.method_37063((class_364)new SmoothButtonWidget(x + width - this.s(92), y, this.s(92), this.s(20), (class_2561)class_2561.method_43470((String)"From Hand"), btn -> this.setFromHand(true, true, false)));
        this.fiftyRightField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(24), width - this.s(96), this.s(20), (class_2561)class_2561.method_43470((String)"right")));
        this.fiftyRightField.method_1852(OptimizationSettingsScreen.itemId(fifty.rightSideItem));
        this.method_37063((class_364)new SmoothButtonWidget(x + width - this.s(92), y, this.s(92), this.s(20), (class_2561)class_2561.method_43470((String)"From Hand"), btn -> this.setFromHand(false, true, false)));
    }

    private void buildRussian(int x, int width, int y) {
        RussianRoulette russian = RussianRoulette.getInstance();
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null) {
            return;
        }
        this.method_37063((class_364)new SmoothButtonWidget(x, y, width, this.s(20), (class_2561)class_2561.method_43470((String)"Active Rig: Russian"), btn -> client.selectRussianRig()));
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)(russian.armed ? "Armed" : "Arm Next Spin")), btn -> {
            russian.arm();
            btn.method_25355((class_2561)class_2561.method_43470((String)"Armed"));
        }));
        this.addKeyButton(KeyAction.ARM_RUSSIAN_NEXT_SPIN, x, y += this.s(24), width);
        this.russianTriggerField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(26), width - this.s(96), this.s(20), (class_2561)class_2561.method_43470((String)"trigger")));
        this.russianTriggerField.method_1852(OptimizationSettingsScreen.itemId(russian.triggerItem));
        this.method_37063((class_364)new SmoothButtonWidget(x + width - this.s(92), y, this.s(92), this.s(20), (class_2561)class_2561.method_43470((String)"Set Trigger"), btn -> this.setFromHand(true, false, true)));
        this.russianNormalField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(24), width - this.s(96), this.s(20), (class_2561)class_2561.method_43470((String)"normal")));
        this.russianNormalField.method_1852(OptimizationSettingsScreen.itemId(russian.normalItem));
        this.method_37063((class_364)new SmoothButtonWidget(x + width - this.s(92), y, this.s(92), this.s(20), (class_2561)class_2561.method_43470((String)"Set Normal"), btn -> this.setFromHand(false, false, true)));
    }

    private void buildFortyFiveTen(int x, int width, int y) {
        FortyFiveTen fortyFiveTen = FortyFiveTen.getInstance();
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null) {
            return;
        }
        this.method_37063((class_364)new SmoothButtonWidget(x, y, width, this.s(20), (class_2561)class_2561.method_43470((String)"Active Rig: 45/45/10"), btn -> client.selectFortyFiveTenRig()));
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)("Winner: " + fortyFiveTen.winner.label)), btn -> {
            fortyFiveTen.cycleWinner();
            client.saveItemConfig();
            btn.method_25355((class_2561)class_2561.method_43470((String)("Winner: " + fortyFiveTen.winner.label)));
        }));
        this.addKeyButton(KeyAction.TOGGLE_FORTY_FIVE_TEN, x, y += this.s(24), width);
        this.addKeyButton(KeyAction.SWITCH_FORTY_FIVE_TEN, x, y += this.s(24), width);
        this.fortyFirstField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(26), width, this.s(20), (class_2561)class_2561.method_43470((String)"1st Item ID (slots 1,2,4,7)")));
        this.fortyFirstField.method_1852(OptimizationSettingsScreen.itemId(fortyFiveTen.firstItem));
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)"Set 1st From Hand"), btn -> this.setFortyFiveTenFromHand(FortyFiveTen.WinnerTarget.FIRST)));
        this.fortySecondField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(26), width, this.s(20), (class_2561)class_2561.method_43470((String)"2nd Item ID (slots 3,6,8,9)")));
        this.fortySecondField.method_1852(OptimizationSettingsScreen.itemId(fortyFiveTen.secondItem));
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)"Set 2nd From Hand"), btn -> this.setFortyFiveTenFromHand(FortyFiveTen.WinnerTarget.SECOND)));
        this.fortyMiddleField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, x, y += this.s(26), width, this.s(20), (class_2561)class_2561.method_43470((String)"Middle Item ID (slot 5)")));
        this.fortyMiddleField.method_1852(OptimizationSettingsScreen.itemId(fortyFiveTen.middleItem));
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)"Set Middle From Hand"), btn -> this.setFortyFiveTenFromHand(FortyFiveTen.WinnerTarget.MIDDLE)));
    }

    private void buildBlackjack(int x, int width, int y) {
        Blackjack blackjack = Blackjack.getInstance();
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null) {
            return;
        }
        this.method_37063((class_364)new SmoothButtonWidget(x, y, width, this.s(20), (class_2561)class_2561.method_43470((String)"Active Rig: Blackjack"), btn -> client.selectBlackjackRig()));
        this.method_37063((class_364)new SmoothButtonWidget(x, y += this.s(24), width, this.s(20), (class_2561)class_2561.method_43470((String)("Clear Pending Force (" + blackjack.pendingLabel() + ")")), btn -> {
            blackjack.clearPendingForce();
            btn.method_25355((class_2561)class_2561.method_43470((String)("Clear Pending Force (" + blackjack.pendingLabel() + ")")));
        }));
        this.addKeyButton(KeyAction.TOGGLE_BLACKJACK, x, y += this.s(24), width);
        this.addKeyButton(KeyAction.CLEAR_BLACKJACK_FORCE, x, y += this.s(24), width);
        y += this.s(28);
        int colWidth = (width - this.s(8)) / 2;
        for (int i = 1; i <= 10; ++i) {
            KeyAction action = KeyAction.blackjack(i);
            int index = i - 1;
            int colX = x + index % 2 * (colWidth + this.s(8));
            int rowY = y + index / 2 * this.s(24);
            this.addKeyButton(action, colX, rowY, colWidth);
        }
        this.method_37063((class_364)new SmoothButtonWidget(x, y += 5 * this.s(24) + this.s(8), width, this.s(20), (class_2561)class_2561.method_43470((String)"Reset Blackjack Force Keys"), btn -> {
            client.resetBlackjackForceKeys();
            this.refreshKeyLabels();
        }));
    }

    private void addKeyButton(KeyAction action, int x, int y, int width) {
        SmoothButtonWidget button = new SmoothButtonWidget(x, y, width, this.s(20), (class_2561)class_2561.method_43470((String)""), btn -> {
            this.listeningAction = action;
            this.refreshKeyLabels();
        });
        this.keyButtons.put(action, button);
        this.method_37063((class_364)button);
        this.refreshKeyLabel(action);
    }

    private void refreshKeyLabels() {
        for (KeyAction action : this.keyButtons.keySet()) {
            this.refreshKeyLabel(action);
        }
    }

    private void refreshKeyLabel(KeyAction action) {
        SmoothButtonWidget button = this.keyButtons.get((Object)action);
        if (button == null) {
            return;
        }
        if (this.listeningAction == action) {
            button.method_25355((class_2561)class_2561.method_43470((String)(action.label + ": <press key>")));
            return;
        }
        button.method_25355((class_2561)class_2561.method_43470((String)(action.label + ": " + this.actionKeyName(action))));
    }

    private String actionKeyName(KeyAction action) {
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null) {
            return "UNBOUND";
        }
        if (action.isBlackjackForce) {
            int primary = client.getBlackjackForcePrimaryKeyCode(action.blackjackValue);
            int secondary = client.getBlackjackForceSecondaryKeyCode(action.blackjackValue);
            String primaryName = client.keyName(primary);
            if (secondary < 0) {
                return primaryName;
            }
            String secondaryName = client.keyName(secondary);
            return secondaryName + "+" + primaryName;
        }
        return client.keyName(this.getActionKey(action));
    }

    private int getActionKey(KeyAction action) {
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null) {
            return -1;
        }
        return switch (action.ordinal()) {
            default -> throw new MatchException(null, null);
            case 0 -> client.getOpenMenuKeyCode();
            case 1 -> client.getOpenExternalOverlayKeyCode();
            case 2 -> client.getToggleOverlayKeyCode();
            case 3 -> client.getToggleFakePayKeyCode();
            case 6 -> client.getTogglePaperKeyCode();
            case 7 -> client.getSwitchSideKeyCode();
            case 4 -> client.getCycleModeUpKeyCode();
            case 5 -> client.getCycleModeDownKeyCode();
            case 8 -> client.getToggleFiftyFiftyKeyCode();
            case 9 -> client.getSwitchSideKeyCode();
            case 10 -> client.getToggleFortyFiveTenKeyCode();
            case 11 -> client.getSwitchFortyFiveTenKeyCode();
            case 12 -> client.getTriggerRussianRouletteKeyCode();
            case 13 -> client.getToggleBlackjackKeyCode();
            case 14 -> client.getClearBlackjackForceKeyCode();
            case 15, 16, 17, 18, 19, 20, 21, 22, 23, 24 -> client.getBlackjackForcePrimaryKeyCode(action.blackjackValue);
        };
    }

    private void setActionKey(KeyAction action, int keyCode) {
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null) {
            return;
        }
        switch (action.ordinal()) {
            case 0: {
                client.setOpenMenuKeyCode(keyCode);
                break;
            }
            case 1: {
                client.setOpenExternalOverlayKeyCode(keyCode);
                break;
            }
            case 2: {
                client.setToggleOverlayKeyCode(keyCode);
                break;
            }
            case 3: {
                client.setToggleFakePayKeyCode(keyCode);
                break;
            }
            case 6: {
                client.setTogglePaperKeyCode(keyCode);
                break;
            }
            case 7: {
                client.setSwitchSideKeyCode(keyCode);
                break;
            }
            case 4: {
                client.setCycleModeUpKeyCode(keyCode);
                break;
            }
            case 5: {
                client.setCycleModeDownKeyCode(keyCode);
                break;
            }
            case 8: {
                client.setToggleFiftyFiftyKeyCode(keyCode);
                break;
            }
            case 9: {
                client.setSwitchSideKeyCode(keyCode);
                break;
            }
            case 10: {
                client.setToggleFortyFiveTenKeyCode(keyCode);
                break;
            }
            case 11: {
                client.setSwitchFortyFiveTenKeyCode(keyCode);
                break;
            }
            case 12: {
                client.setTriggerRussianRouletteKeyCode(keyCode);
                break;
            }
            case 13: {
                client.setToggleBlackjackKeyCode(keyCode);
                break;
            }
            case 14: {
                client.setClearBlackjackForceKeyCode(keyCode);
                break;
            }
            case 15: 
            case 16: 
            case 17: 
            case 18: 
            case 19: 
            case 20: 
            case 21: 
            case 22: 
            case 23: 
            case 24: {
                int secondary = client.getBlackjackForceSecondaryKeyCode(action.blackjackValue);
                client.setBlackjackForceKeyCombo(action.blackjackValue, keyCode, secondary);
            }
        }
    }

    private void applyAllFields() {
        if (this.paperHostSuffixField != null) {
            PaperGame.getInstance().setHostSuffix(this.paperHostSuffixField.method_1882());
        }
        if (this.paperViewerSuffixField != null) {
            PaperGame.getInstance().setViewerSuffix(this.paperViewerSuffixField.method_1882());
        }
        this.applyItemId(this.paperLeftField, true, false, false);
        this.applyItemId(this.paperRightField, false, false, false);
        this.applyItemId(this.fiftyLeftField, true, true, false);
        this.applyItemId(this.fiftyRightField, false, true, false);
        this.applyFortyFiveTenItemId(this.fortyFirstField, FortyFiveTen.WinnerTarget.FIRST);
        this.applyFortyFiveTenItemId(this.fortySecondField, FortyFiveTen.WinnerTarget.SECOND);
        this.applyFortyFiveTenItemId(this.fortyMiddleField, FortyFiveTen.WinnerTarget.MIDDLE);
        this.applyItemId(this.russianTriggerField, true, false, true);
        this.applyItemId(this.russianNormalField, false, false, true);
    }

    private void setPaperSlotFromHand(boolean hostSide, int index) {
        if (this.field_22787 == null || this.field_22787.field_1724 == null) {
            return;
        }
        class_1792 item = this.field_22787.field_1724.method_6047().method_7909();
        if (item == class_1802.field_8162) {
            return;
        }
        PaperGame.getInstance().setItem(hostSide, index, item);
        CasinoriggerClient.getInstance().saveItemConfig();
    }

    private void importHotbarToPaperItems(boolean hostSide) {
        class_310 client = class_310.method_1551();
        if (client == null || client.field_1724 == null) {
            return;
        }
        PaperGame paper = PaperGame.getInstance();
        for (int i = 0; i < 9; ++i) {
            class_1792 item = client.field_1724.method_31548().method_5438(i).method_7909();
            if (item == class_1802.field_8162) continue;
            paper.setItem(hostSide, i, item);
        }
        CasinoriggerClient.getInstance().saveItemConfig();
    }

    private void setFromHand(boolean left, boolean fifty, boolean russian) {
        if (this.field_22787 == null || this.field_22787.field_1724 == null) {
            return;
        }
        class_1792 item = this.field_22787.field_1724.method_6047().method_7909();
        if (item == class_1802.field_8162) {
            return;
        }
        if (russian) {
            RussianRoulette rr = RussianRoulette.getInstance();
            if (left) {
                rr.triggerItem = item;
                if (this.russianTriggerField != null) {
                    this.russianTriggerField.method_1852(OptimizationSettingsScreen.itemId(item));
                }
            } else {
                rr.normalItem = item;
                if (this.russianNormalField != null) {
                    this.russianNormalField.method_1852(OptimizationSettingsScreen.itemId(item));
                }
            }
        } else if (fifty) {
            FiftyFifty ff = FiftyFifty.getInstance();
            if (left) {
                ff.leftSideItem = item;
                if (this.fiftyLeftField != null) {
                    this.fiftyLeftField.method_1852(OptimizationSettingsScreen.itemId(item));
                }
            } else {
                ff.rightSideItem = item;
                if (this.fiftyRightField != null) {
                    this.fiftyRightField.method_1852(OptimizationSettingsScreen.itemId(item));
                }
            }
        } else {
            PaperGame paper = PaperGame.getInstance();
            if (left) {
                paper.leftSideItem = item;
                if (this.paperLeftField != null) {
                    this.paperLeftField.method_1852(OptimizationSettingsScreen.itemId(item));
                }
            } else {
                paper.rightSideItem = item;
                if (this.paperRightField != null) {
                    this.paperRightField.method_1852(OptimizationSettingsScreen.itemId(item));
                }
            }
        }
        CasinoriggerClient.getInstance().saveItemConfig();
    }

    private void setFortyFiveTenFromHand(FortyFiveTen.WinnerTarget target) {
        if (this.field_22787 == null || this.field_22787.field_1724 == null) {
            return;
        }
        class_1792 item = this.field_22787.field_1724.method_6047().method_7909();
        if (item == class_1802.field_8162) {
            return;
        }
        FortyFiveTen fortyFiveTen = FortyFiveTen.getInstance();
        switch (target) {
            case FIRST: {
                fortyFiveTen.firstItem = item;
                if (this.fortyFirstField == null) break;
                this.fortyFirstField.method_1852(OptimizationSettingsScreen.itemId(item));
                break;
            }
            case SECOND: {
                fortyFiveTen.secondItem = item;
                if (this.fortySecondField == null) break;
                this.fortySecondField.method_1852(OptimizationSettingsScreen.itemId(item));
                break;
            }
            case MIDDLE: {
                fortyFiveTen.middleItem = item;
                if (this.fortyMiddleField == null) break;
                this.fortyMiddleField.method_1852(OptimizationSettingsScreen.itemId(item));
            }
        }
        CasinoriggerClient.getInstance().saveItemConfig();
    }

    private void applyItemId(class_342 field, boolean left, boolean fifty, boolean russian) {
        class_2960 id;
        if (field == null) {
            return;
        }
        String raw = field.method_1882().trim();
        if (raw.isEmpty()) {
            return;
        }
        class_2960 class_29602 = id = raw.contains(":") ? class_2960.method_12829((String)raw) : class_2960.method_12829((String)("minecraft:" + raw));
        if (id == null || !class_7923.field_41178.method_10250(id)) {
            return;
        }
        class_1792 item = (class_1792)class_7923.field_41178.method_63535(id);
        if (russian) {
            RussianRoulette rr = RussianRoulette.getInstance();
            if (left) {
                rr.triggerItem = item;
            } else {
                rr.normalItem = item;
            }
        } else if (fifty) {
            FiftyFifty ff = FiftyFifty.getInstance();
            if (left) {
                ff.leftSideItem = item;
            } else {
                ff.rightSideItem = item;
            }
        } else {
            PaperGame paper = PaperGame.getInstance();
            if (left) {
                paper.leftSideItem = item;
            } else {
                paper.rightSideItem = item;
            }
        }
        field.method_1852(OptimizationSettingsScreen.itemId(item));
        CasinoriggerClient.getInstance().saveItemConfig();
    }

    private void applyFortyFiveTenItemId(class_342 field, FortyFiveTen.WinnerTarget target) {
        class_2960 id;
        if (field == null) {
            return;
        }
        String raw = field.method_1882().trim();
        if (raw.isEmpty()) {
            return;
        }
        class_2960 class_29602 = id = raw.contains(":") ? class_2960.method_12829((String)raw) : class_2960.method_12829((String)("minecraft:" + raw));
        if (id == null || !class_7923.field_41178.method_10250(id)) {
            return;
        }
        class_1792 item = (class_1792)class_7923.field_41178.method_63535(id);
        FortyFiveTen fortyFiveTen = FortyFiveTen.getInstance();
        switch (target) {
            case FIRST: {
                fortyFiveTen.firstItem = item;
                break;
            }
            case SECOND: {
                fortyFiveTen.secondItem = item;
                break;
            }
            case MIDDLE: {
                fortyFiveTen.middleItem = item;
            }
        }
        field.method_1852(OptimizationSettingsScreen.itemId(item));
        CasinoriggerClient.getInstance().saveItemConfig();
    }

    private static String itemId(class_1792 item) {
        return class_7923.field_41178.method_10221((Object)item).toString();
    }

    private static String onOff(boolean value) {
        return value ? "ON" : "OFF";
    }

    private static String formatScoreboardAdd(CasinoriggerClient client) {
        if (client == null) {
            return "0";
        }
        double value = client.getScoreboardMoneyAdd();
        if (Math.abs(value) < 1.0E-7) {
            return "0";
        }
        Object formatted = client.formatScoreboardAmount(value);
        if (value > 0.0 && !((String)formatted).startsWith("+")) {
            formatted = "+" + (String)formatted;
        }
        return formatted;
    }

    private String normalizeItemId(String raw) {
        if (raw == null) {
            return "";
        }
        String trimmed = raw.trim().toLowerCase(Locale.ROOT);
        if (trimmed.isEmpty()) {
            return "";
        }
        Object withNamespace = trimmed.contains(":") ? trimmed : "minecraft:" + trimmed;
        class_2960 id = class_2960.method_12829((String)withNamespace);
        if (id == null || !class_7923.field_41178.method_10250(id)) {
            return "";
        }
        return id.toString();
    }

    private void openItemPicker(Consumer<class_2960> onPick) {
        if (this.field_22787 == null) {
            return;
        }
        this.field_22787.method_1507((class_437)new ItemPickerScreen(this, onPick));
    }

    private void openLarpingConfig() {
        if (this.field_22787 == null) {
            return;
        }
        this.field_22787.method_1507((class_437)new LarpingConfigScreen(this));
    }

    private static String trimName(String name, int max) {
        if (name == null || name.length() <= max) {
            return name;
        }
        return name.substring(0, Math.max(0, max - 1)) + "~";
    }

    private int s(int value) {
        return Math.max(1, Math.round((float)value * this.layoutScale));
    }

    private float computeLayoutScale() {
        int targetHeight = this.currentTab == Tab.BLACKJACK ? 360 : 290;
        float widthScale = ((float)this.field_22789 - 12.0f) / 460.0f;
        float heightScale = ((float)this.field_22790 - 12.0f) / (float)targetHeight;
        float scale = Math.min(widthScale, heightScale);
        return Math.max(0.7f, Math.min(1.0f, scale));
    }

    private static enum Tab {
        SETTINGS("Settings", "Global menu + overlay"),
        PAPER("PaperGame", "Paper rig controls (Host/Viewer items)"),
        FIFTY("50/50", "50/50 rig controls"),
        RUSSIAN("Russian", "Russian roulette controls (Trigger/Normal items)"),
        FORTY_FIVE_TEN("45/45/10", "45/45/10 rig controls"),
        BLACKJACK("Blackjack", "Blackjack controls"),
        FAKE_PAY("Larping", "Fake /pay + media badge");

        final String label;
        final String subtitle;

        private Tab(String label, String subtitle) {
            this.label = label;
            this.subtitle = subtitle;
        }
    }

    private static enum KeyAction {
        OPEN_MENU("Open Menu"),
        OPEN_EXTERNAL_OVERLAY("Open External Overlay"),
        TOGGLE_OVERLAY("Toggle Overlay"),
        TOGGLE_FAKE_PAY("Toggle Fake Pay"),
        CYCLE_MODE_UP("Cycle Mode Up"),
        CYCLE_MODE_DOWN("Cycle Mode Down"),
        TOGGLE_PAPER("Select Paper Rig"),
        SWITCH_PAPER_SIDE("Switch Paper Side"),
        TOGGLE_FIFTY("Select 50/50 Rig"),
        SWITCH_FIFTY_SIDE("Switch 50/50 Side"),
        TOGGLE_FORTY_FIVE_TEN("Select 45/45/10 Rig"),
        SWITCH_FORTY_FIVE_TEN("Switch 45/45/10 Winner"),
        ARM_RUSSIAN_NEXT_SPIN("Arm Russian Next Spin"),
        TOGGLE_BLACKJACK("Select Blackjack Rig"),
        CLEAR_BLACKJACK_FORCE("Clear Blackjack Force"),
        BLACKJACK_FORCE_1("Force 1/11", 1, true),
        BLACKJACK_FORCE_2("Force 2", 2, true),
        BLACKJACK_FORCE_3("Force 3", 3, true),
        BLACKJACK_FORCE_4("Force 4", 4, true),
        BLACKJACK_FORCE_5("Force 5", 5, true),
        BLACKJACK_FORCE_6("Force 6", 6, true),
        BLACKJACK_FORCE_7("Force 7", 7, true),
        BLACKJACK_FORCE_8("Force 8", 8, true),
        BLACKJACK_FORCE_9("Force 9", 9, true),
        BLACKJACK_FORCE_10("Force 10", 10, true);

        final String label;
        final int blackjackValue;
        final boolean isBlackjackForce;

        private KeyAction(String label) {
            this(label, -1, false);
        }

        private KeyAction(String label, int blackjackValue, boolean isBlackjackForce) {
            this.label = label;
            this.blackjackValue = blackjackValue;
            this.isBlackjackForce = isBlackjackForce;
        }

        static KeyAction blackjack(int value) {
            return switch (value) {
                case 1 -> BLACKJACK_FORCE_1;
                case 2 -> BLACKJACK_FORCE_2;
                case 3 -> BLACKJACK_FORCE_3;
                case 4 -> BLACKJACK_FORCE_4;
                case 5 -> BLACKJACK_FORCE_5;
                case 6 -> BLACKJACK_FORCE_6;
                case 7 -> BLACKJACK_FORCE_7;
                case 8 -> BLACKJACK_FORCE_8;
                case 9 -> BLACKJACK_FORCE_9;
                default -> BLACKJACK_FORCE_10;
            };
        }
    }

    private static final class IconSlotButton
    extends SmoothButtonWidget {
        private final class_1799 iconStack;

        private IconSlotButton(int x, int y, int width, int height, class_2561 message, class_1799 iconStack, SmoothButtonWidget.PressAction onPress) {
            super(x, y, width, height, message, onPress);
            this.iconStack = iconStack;
        }

        @Override
        protected void method_48579(class_332 context, int mouseX, int mouseY, float delta) {
            super.method_48579(context, mouseX, mouseY, delta);
            if (!this.iconStack.method_7960()) {
                int iconX = this.method_46426() + 6;
                int iconY = this.method_46427() + (this.method_25364() - 16) / 2;
                context.method_51427(this.iconStack, iconX, iconY);
                context.method_51431(class_310.method_1551().field_1772, this.iconStack, iconX, iconY);
            }
        }
    }
}


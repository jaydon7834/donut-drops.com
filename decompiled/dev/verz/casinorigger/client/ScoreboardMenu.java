/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.fabricmc.api.EnvType
 *  net.fabricmc.api.Environment
 *  net.minecraft.class_11908
 *  net.minecraft.class_11909
 *  net.minecraft.class_2561
 *  net.minecraft.class_332
 *  net.minecraft.class_342
 *  net.minecraft.class_364
 *  net.minecraft.class_4185
 *  net.minecraft.class_437
 */
package dev.verz.casinorigger.client;

import dev.verz.casinorigger.client.CasinoriggerClient;
import dev.verz.casinorigger.client.gui.MenuSidebar;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.class_11908;
import net.minecraft.class_11909;
import net.minecraft.class_2561;
import net.minecraft.class_332;
import net.minecraft.class_342;
import net.minecraft.class_364;
import net.minecraft.class_4185;
import net.minecraft.class_437;

@Environment(value=EnvType.CLIENT)
public class ScoreboardMenu
extends class_437 {
    private final class_437 parent;
    private class_342 moneyAddField;
    private class_4185 toggleButton;
    private int panelLeft;
    private int panelRight;
    private int topY;
    private int controlX;
    private int controlWidth;

    public ScoreboardMenu(class_437 parent) {
        super((class_2561)class_2561.method_43470((String)"Scoreboard"));
        this.parent = parent;
    }

    protected void method_25426() {
        this.panelLeft = MenuSidebar.contentLeft(this.field_22789);
        this.panelRight = MenuSidebar.contentRight(this.field_22789);
        this.topY = MenuSidebar.contentTop(this.field_22790);
        int padX = MenuSidebar.scalePx(12, this.field_22789, this.field_22790);
        int insetX = MenuSidebar.scalePx(24, this.field_22789, this.field_22790);
        int buttonHeight = MenuSidebar.controlHeight(this.field_22789, this.field_22790);
        int rowStep = MenuSidebar.controlStep(this.field_22789, this.field_22790);
        this.controlX = this.panelLeft + padX;
        this.controlWidth = Math.max(120, this.panelRight - this.panelLeft - insetX);
        int rowY = MenuSidebar.controlsStartY(this.topY, this.field_22789, this.field_22790);
        this.toggleButton = (class_4185)this.method_37063((class_364)MenuSidebar.styledButton((class_2561)class_2561.method_43473(), button -> {
            CasinoriggerClient config;
            config.setScoreboardRigEnabled(!(config = CasinoriggerClient.getInstance()).isScoreboardRigEnabled());
            this.refreshLabels();
        }, this.controlX, rowY, this.controlWidth, buttonHeight));
        int fieldY = rowY + buttonHeight + MenuSidebar.scalePx(20, this.field_22789, this.field_22790);
        this.moneyAddField = new class_342(this.field_22793, this.controlX, fieldY, this.controlWidth, buttonHeight, (class_2561)class_2561.method_43470((String)"Money Add"));
        this.moneyAddField.method_1880(20);
        this.moneyAddField.method_1858(true);
        this.method_37063((class_364)this.moneyAddField);
        this.method_37063((class_364)MenuSidebar.styledButton((class_2561)class_2561.method_43470((String)"Apply Money Add"), button -> this.applyMoneyAdd(), this.controlX, fieldY + rowStep, this.controlWidth, buttonHeight));
        this.refreshLabels();
    }

    private void refreshLabels() {
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        if (this.toggleButton != null) {
            this.toggleButton.method_25355((class_2561)class_2561.method_43470((String)("Scoreboard Rig: " + (config.isScoreboardRigEnabled() ? "ON" : "OFF"))));
        }
        if (this.moneyAddField != null) {
            this.moneyAddField.method_1852(config.formatScoreboardAmount(config.getScoreboardMoneyAdd()));
        }
    }

    private void applyMoneyAdd() {
        if (this.moneyAddField == null) {
            return;
        }
        String value = this.moneyAddField.method_1882().trim();
        if (value.isEmpty()) {
            return;
        }
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        double parsed = config.parseScoreboardAmountInput(value);
        if (!Double.isNaN(parsed)) {
            config.setScoreboardMoneyAdd(parsed);
        }
        this.refreshLabels();
    }

    public void method_25420(class_332 context, int mouseX, int mouseY, float delta) {
    }

    public void method_25394(class_332 context, int mouseX, int mouseY, float delta) {
        MenuSidebar.render(context, this.field_22793, this.field_22789, this.field_22790, mouseX, mouseY, (class_2561)class_2561.method_43470((String)"Score Menu"), MenuSidebar.Target.SCOREBOARD);
        int rowY = MenuSidebar.controlsStartY(this.topY, this.field_22789, this.field_22790);
        int buttonHeight = MenuSidebar.controlHeight(this.field_22789, this.field_22790);
        int rowStep = MenuSidebar.controlStep(this.field_22789, this.field_22790);
        int fieldY = rowY + buttonHeight + MenuSidebar.scalePx(20, this.field_22789, this.field_22790);
        int lastControlBottom = fieldY + rowStep + buttonHeight;
        int cardBottom = MenuSidebar.contentCardBottomForLastControl(lastControlBottom, this.field_22790);
        MenuSidebar.drawContentCard(context, this.panelLeft, this.topY, this.panelRight, cardBottom);
        int headerY = MenuSidebar.headerY(this.topY, this.field_22789, this.field_22790);
        int subtitleY = MenuSidebar.subtitleY(headerY, this.field_22793, this.field_22789, this.field_22790);
        MenuSidebar.drawLargeHeaderCentered(context, this.field_22793, (class_2561)class_2561.method_43470((String)"SCOREBOARD"), this.panelLeft, this.panelRight, headerY);
        MenuSidebar.drawSubtitleCentered(context, this.field_22793, (class_2561)class_2561.method_43470((String)"Spoof money line values"), this.panelLeft, this.panelRight, subtitleY);
        int panelPad = MenuSidebar.scalePx(6, this.field_22789, this.field_22790);
        MenuSidebar.drawSectionPanel(context, this.controlX - panelPad, rowY - panelPad, this.controlX + this.controlWidth + panelPad, rowY + buttonHeight + panelPad);
        MenuSidebar.drawSectionPanel(context, this.controlX - panelPad, fieldY - panelPad, this.controlX + this.controlWidth + panelPad, lastControlBottom + panelPad);
        super.method_25394(context, mouseX, mouseY, delta);
        if (this.moneyAddField != null) {
            int labelPad = MenuSidebar.labelPad(this.field_22789, this.field_22790);
            MenuSidebar.drawScaledTextWithShadow(context, this.field_22793, (class_2561)class_2561.method_43470((String)"Money Add (e.g. 500, 12.25K, 1M, 2.5B)"), this.moneyAddField.method_46426() + labelPad, this.moneyAddField.method_46427() - MenuSidebar.scalePx(12, this.field_22789, this.field_22790), -1, this.field_22789, this.field_22790);
        }
    }

    public boolean method_25402(class_11909 click, boolean doubled) {
        if (MenuSidebar.handleNavigationClick(this, this.field_22787, click, doubled, MenuSidebar.Target.SCOREBOARD, false)) {
            return true;
        }
        return super.method_25402(click, doubled);
    }

    public boolean method_25404(class_11908 keyInput) {
        int keyCode = keyInput.comp_4795();
        if (keyCode == 257 || keyCode == 335) {
            this.applyMoneyAdd();
            return true;
        }
        return super.method_25404(keyInput);
    }
}


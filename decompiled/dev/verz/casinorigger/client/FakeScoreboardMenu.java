/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.fabricmc.api.EnvType
 *  net.fabricmc.api.Environment
 *  net.minecraft.class_11909
 *  net.minecraft.class_2561
 *  net.minecraft.class_332
 *  net.minecraft.class_342
 *  net.minecraft.class_364
 *  net.minecraft.class_4185
 *  net.minecraft.class_437
 *  net.minecraft.class_5250
 */
package dev.verz.casinorigger.client;

import dev.verz.casinorigger.client.CasinoriggerClient;
import dev.verz.casinorigger.client.gui.MenuSidebar;
import java.util.function.Consumer;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.class_11909;
import net.minecraft.class_2561;
import net.minecraft.class_332;
import net.minecraft.class_342;
import net.minecraft.class_364;
import net.minecraft.class_4185;
import net.minecraft.class_437;
import net.minecraft.class_5250;

@Environment(value=EnvType.CLIENT)
public class FakeScoreboardMenu
extends class_437 {
    private final class_437 parent;
    private class_4185 toggleButton;
    private class_342 titleField;
    private class_342 moneyField;
    private class_342 shardsField;
    private class_342 killsField;
    private class_342 deathsField;
    private class_342 keyallField;
    private class_342 playtimeField;
    private class_342 teamField;
    private class_342 footerField;
    private int panelLeft;
    private int panelRight;
    private int topY;
    private int controlX;
    private int controlWidth;

    public FakeScoreboardMenu(class_437 parent) {
        super((class_2561)class_2561.method_43470((String)"Fake Scoreboard"));
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
        int labelGap = MenuSidebar.scalePx(12, this.field_22789, this.field_22790);
        int fieldStep = rowStep + labelGap;
        this.controlX = this.panelLeft + padX;
        this.controlWidth = Math.max(120, this.panelRight - this.panelLeft - insetX);
        int rowY = MenuSidebar.controlsStartY(this.topY, this.field_22789, this.field_22790);
        this.toggleButton = (class_4185)this.method_37063((class_364)MenuSidebar.styledButton((class_2561)class_2561.method_43473(), button -> {
            CasinoriggerClient config;
            config.setFakeScoreboardEnabled(!(config = CasinoriggerClient.getInstance()).isFakeScoreboardEnabled());
            this.refreshLabels();
        }, this.controlX, rowY, this.controlWidth, buttonHeight));
        int fieldY = rowY + rowStep + labelGap;
        this.titleField = this.addField("Title", fieldY, buttonHeight, value -> CasinoriggerClient.getInstance().setFakeScoreboardTitle((String)value));
        this.moneyField = this.addField("Money", fieldY += fieldStep, buttonHeight, value -> CasinoriggerClient.getInstance().setFakeScoreboardMoney((String)value));
        this.shardsField = this.addField("Shards", fieldY += fieldStep, buttonHeight, value -> CasinoriggerClient.getInstance().setFakeScoreboardShards((String)value));
        this.killsField = this.addField("Kills", fieldY += fieldStep, buttonHeight, value -> CasinoriggerClient.getInstance().setFakeScoreboardKills((String)value));
        this.deathsField = this.addField("Deaths", fieldY += fieldStep, buttonHeight, value -> CasinoriggerClient.getInstance().setFakeScoreboardDeaths((String)value));
        this.keyallField = this.addField("Keyall Timer", fieldY += fieldStep, buttonHeight, value -> CasinoriggerClient.getInstance().setFakeScoreboardKeyall((String)value));
        this.playtimeField = this.addField("Playtime", fieldY += fieldStep, buttonHeight, value -> CasinoriggerClient.getInstance().setFakeScoreboardPlaytime((String)value));
        this.teamField = this.addField("Team", fieldY += fieldStep, buttonHeight, value -> CasinoriggerClient.getInstance().setFakeScoreboardTeam((String)value));
        this.footerField = this.addField("Footer", fieldY += fieldStep, buttonHeight, value -> CasinoriggerClient.getInstance().setFakeScoreboardFooter((String)value));
        this.refreshLabels();
    }

    private class_342 addField(String label, int y, int height, Consumer<String> onChanged) {
        class_342 field = new class_342(this.field_22793, this.controlX, y, this.controlWidth, height, (class_2561)class_2561.method_43470((String)label));
        field.method_1880(64);
        field.method_1858(true);
        field.method_1863(onChanged);
        this.method_37063((class_364)field);
        return field;
    }

    private void refreshLabels() {
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        if (this.toggleButton != null) {
            this.toggleButton.method_25355((class_2561)class_2561.method_43470((String)("Fake Scoreboard: " + (config.isFakeScoreboardEnabled() ? "ON" : "OFF"))));
        }
        if (this.titleField != null) {
            this.titleField.method_1852(config.getFakeScoreboardTitle());
        }
        if (this.moneyField != null) {
            this.moneyField.method_1852(config.getFakeScoreboardMoney());
        }
        if (this.shardsField != null) {
            this.shardsField.method_1852(config.getFakeScoreboardShards());
        }
        if (this.killsField != null) {
            this.killsField.method_1852(config.getFakeScoreboardKills());
        }
        if (this.deathsField != null) {
            this.deathsField.method_1852(config.getFakeScoreboardDeaths());
        }
        if (this.keyallField != null) {
            this.keyallField.method_1852(config.getFakeScoreboardKeyall());
        }
        if (this.playtimeField != null) {
            this.playtimeField.method_1852(config.getFakeScoreboardPlaytime());
        }
        if (this.teamField != null) {
            this.teamField.method_1852(config.getFakeScoreboardTeam());
        }
        if (this.footerField != null) {
            this.footerField.method_1852(config.getFakeScoreboardFooter());
        }
    }

    public void method_25420(class_332 context, int mouseX, int mouseY, float delta) {
    }

    public void method_25394(class_332 context, int mouseX, int mouseY, float delta) {
        MenuSidebar.render(context, this.field_22793, this.field_22789, this.field_22790, mouseX, mouseY, (class_2561)class_2561.method_43470((String)"Fake Scoreboard"), MenuSidebar.Target.FAKEBOARD);
        int rowY = MenuSidebar.controlsStartY(this.topY, this.field_22789, this.field_22790);
        int buttonHeight = MenuSidebar.controlHeight(this.field_22789, this.field_22790);
        int rowStep = MenuSidebar.controlStep(this.field_22789, this.field_22790);
        int labelGap = MenuSidebar.scalePx(12, this.field_22789, this.field_22790);
        int fieldStep = rowStep + labelGap;
        int lastControlBottom = rowY + rowStep + labelGap + fieldStep * 8 + buttonHeight;
        int cardBottom = MenuSidebar.contentCardBottomForLastControl(lastControlBottom, this.field_22790);
        MenuSidebar.drawContentCard(context, this.panelLeft, this.topY, this.panelRight, cardBottom);
        int headerY = MenuSidebar.headerY(this.topY, this.field_22789, this.field_22790);
        int subtitleY = MenuSidebar.subtitleY(headerY, this.field_22793, this.field_22789, this.field_22790);
        MenuSidebar.drawLargeHeaderCentered(context, this.field_22793, (class_2561)class_2561.method_43470((String)"FAKE SCOREBOARD"), this.panelLeft, this.panelRight, headerY);
        MenuSidebar.drawSubtitleCentered(context, this.field_22793, (class_2561)class_2561.method_43470((String)"Glazed-style custom sidebar"), this.panelLeft, this.panelRight, subtitleY);
        int panelPad = MenuSidebar.scalePx(6, this.field_22789, this.field_22790);
        MenuSidebar.drawSectionPanel(context, this.controlX - panelPad, rowY - panelPad, this.controlX + this.controlWidth + panelPad, lastControlBottom + panelPad);
        this.drawGradientTitleLabel(context, this.titleField, "Title");
        this.drawFieldLabel(context, this.moneyField, "Money");
        this.drawFieldLabel(context, this.shardsField, "Shards");
        this.drawFieldLabel(context, this.killsField, "Kills");
        this.drawFieldLabel(context, this.deathsField, "Deaths");
        this.drawFieldLabel(context, this.keyallField, "Keyall Timer (e.g. 59m 59s)");
        this.drawFieldLabel(context, this.playtimeField, "Playtime");
        this.drawFieldLabel(context, this.teamField, "Team");
        this.drawFieldLabel(context, this.footerField, "Footer (e.g. Oceania or AUTO)");
        super.method_25394(context, mouseX, mouseY, delta);
    }

    private void drawFieldLabel(class_332 context, class_342 field, String label) {
        if (field == null) {
            return;
        }
        int labelPad = MenuSidebar.labelPad(this.field_22789, this.field_22790);
        MenuSidebar.drawScaledTextWithShadow(context, this.field_22793, (class_2561)class_2561.method_43470((String)label), field.method_46426() + labelPad, field.method_46427() - MenuSidebar.scalePx(14, this.field_22789, this.field_22790), -1, this.field_22789, this.field_22790);
    }

    private void drawGradientTitleLabel(class_332 context, class_342 field, String label) {
        if (field == null) {
            return;
        }
        int labelPad = MenuSidebar.labelPad(this.field_22789, this.field_22790);
        int x = field.method_46426() + labelPad;
        int y = field.method_46427() - MenuSidebar.scalePx(14, this.field_22789, this.field_22790);
        this.drawGradientText(context, label, x, y, 31993, 50937);
    }

    private void drawGradientText(class_332 context, String text, int x, int y, int startColor, int endColor) {
        if (text == null || text.isEmpty()) {
            return;
        }
        int startR = startColor >> 16 & 0xFF;
        int startG = startColor >> 8 & 0xFF;
        int startB = startColor & 0xFF;
        int endR = endColor >> 16 & 0xFF;
        int endG = endColor >> 8 & 0xFF;
        int endB = endColor & 0xFF;
        int len = text.length();
        float scale = MenuSidebar.textScale(this.field_22789, this.field_22790);
        int cursorX = x;
        context.method_51448().pushMatrix();
        if (Math.abs(scale - 1.0f) >= 0.001f) {
            context.method_51448().scale(scale, scale);
            cursorX = Math.round((float)cursorX / scale);
            y = Math.round((float)y / scale);
        }
        for (int i = 0; i < len; ++i) {
            float t = (float)i / (float)Math.max(len - 1, 1);
            int r = Math.round((float)startR + (float)(endR - startR) * t);
            int g = Math.round((float)startG + (float)(endG - startG) * t);
            int b = Math.round((float)startB + (float)(endB - startB) * t);
            int color = r << 16 | g << 8 | b;
            class_5250 glyph = class_2561.method_43470((String)String.valueOf(text.charAt(i))).method_27694(style -> style.method_36139(color).method_10982(Boolean.valueOf(true)));
            context.method_27535(this.field_22793, (class_2561)glyph, cursorX, y, color);
            cursorX += this.field_22793.method_1727(String.valueOf(text.charAt(i)));
        }
        context.method_51448().popMatrix();
    }

    public boolean method_25402(class_11909 click, boolean doubled) {
        if (MenuSidebar.handleNavigationClick(this, this.field_22787, click, doubled, MenuSidebar.Target.FAKEBOARD, false)) {
            return true;
        }
        return super.method_25402(click, doubled);
    }
}


/*
 * Decompiled with CFR 0.152.
 */
package dev.verz.casinorigger.client.gui;

import dev.verz.casinorigger.client.CasinoriggerClient;

public enum UiTheme {
    OBSIDIAN("Obsidian", 0x50000000, -267645941, -14542310, -15857142, -15068141, -15199212, -14016223, -2633520, -7569280, -15193301, -14864079, -14135216, -13738659, -2502191, -7634302),
    GRAPHITE("Graphite", 0x48000000, -267251176, -13355980, -15264228, -14277583, -14803419, -14013901, -1842205, -5590614, -14736857, -14208968, -13090998, -11839915, -1842205, -6645082),
    NOIR_TEAL("Noir Teal", 0x50000000, -267776494, -14472402, -16052462, -15393763, -15065310, -13947085, -2499103, -7366495, -15064284, -14667469, -13942719, -12955568, -2564639, -7761253),
    ROSE_NEON("Rose Neon", 0x48000000, -267449838, -12011083, -15200747, -13029323, -14017752, -10913158, -3083, -3293243, -14168833, -12880906, -9667996, -5236321, -3083, -4410434),
    SAKURA("Sakura", 1156765912, -218705692, -1650719, -331273, -923920, -664850, -1854760, -12898507, -7705733, -266247, -2179118, -1070641, -2047785, -12898507, -8692373);

    public final String label;
    public final int backdrop;
    public final int shellFill;
    public final int shellBorder;
    public final int sidebarFill;
    public final int sidebarBorder;
    public final int cardFill;
    public final int cardBorder;
    public final int text;
    public final int subText;
    public final int tabFill;
    public final int tabHover;
    public final int tabActiveFill;
    public final int tabActiveBorder;
    public final int buttonText;
    public final int buttonSubText;

    private UiTheme(String label, int backdrop, int shellFill, int shellBorder, int sidebarFill, int sidebarBorder, int cardFill, int cardBorder, int text, int subText, int tabFill, int tabHover, int tabActiveFill, int tabActiveBorder, int buttonText, int buttonSubText) {
        this.label = label;
        this.backdrop = backdrop;
        this.shellFill = shellFill;
        this.shellBorder = shellBorder;
        this.sidebarFill = sidebarFill;
        this.sidebarBorder = sidebarBorder;
        this.cardFill = cardFill;
        this.cardBorder = cardBorder;
        this.text = text;
        this.subText = subText;
        this.tabFill = tabFill;
        this.tabHover = tabHover;
        this.tabActiveFill = tabActiveFill;
        this.tabActiveBorder = tabActiveBorder;
        this.buttonText = buttonText;
        this.buttonSubText = buttonSubText;
    }

    public static UiTheme byIndex(int index) {
        UiTheme[] values = UiTheme.values();
        if (values.length == 0) {
            return OBSIDIAN;
        }
        int safe = (index % values.length + values.length) % values.length;
        return values[safe];
    }

    public static UiTheme current() {
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        return UiTheme.byIndex(client != null ? client.getUiThemeIndex() : 0);
    }
}


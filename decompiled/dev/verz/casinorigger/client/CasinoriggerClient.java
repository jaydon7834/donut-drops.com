/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.google.gson.Gson
 *  com.google.gson.GsonBuilder
 *  net.fabricmc.api.ClientModInitializer
 *  net.fabricmc.api.EnvType
 *  net.fabricmc.api.Environment
 *  net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents
 *  net.fabricmc.fabric.api.client.message.v1.ClientSendMessageEvents
 *  net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback
 *  net.fabricmc.fabric.api.client.rendering.v1.world.WorldRenderEvents
 *  net.fabricmc.loader.api.FabricLoader
 *  net.minecraft.class_1041
 *  net.minecraft.class_11908
 *  net.minecraft.class_1747
 *  net.minecraft.class_1792
 *  net.minecraft.class_1799
 *  net.minecraft.class_1802
 *  net.minecraft.class_1935
 *  net.minecraft.class_2248
 *  net.minecraft.class_2561
 *  net.minecraft.class_2583
 *  net.minecraft.class_266
 *  net.minecraft.class_268
 *  net.minecraft.class_2680
 *  net.minecraft.class_269
 *  net.minecraft.class_274
 *  net.minecraft.class_274$class_275
 *  net.minecraft.class_2960
 *  net.minecraft.class_310
 *  net.minecraft.class_332
 *  net.minecraft.class_3675
 *  net.minecraft.class_437
 *  net.minecraft.class_5250
 *  net.minecraft.class_5251
 *  net.minecraft.class_7923
 *  net.minecraft.class_8646
 *  net.minecraft.class_9011
 *  net.minecraft.class_9014
 *  net.minecraft.class_9015
 *  net.minecraft.class_9020
 *  net.minecraft.class_9022
 *  net.minecraft.class_9334
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 */
package dev.verz.casinorigger.client;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import dev.verz.casinorigger.auth.KeyAuthClient;
import dev.verz.casinorigger.client.FakeMediaBadgeRenderer;
import dev.verz.casinorigger.client.gui.LicenseLoginScreen;
import dev.verz.casinorigger.client.gui.OptimizationSettingsScreen;
import dev.verz.casinorigger.client.rigger.Blackjack;
import dev.verz.casinorigger.client.rigger.FakePay;
import dev.verz.casinorigger.client.rigger.FiftyFifty;
import dev.verz.casinorigger.client.rigger.FortyFiveTen;
import dev.verz.casinorigger.client.rigger.PaperGame;
import dev.verz.casinorigger.client.rigger.RussianRoulette;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.Reader;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.OpenOption;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.FileAttribute;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Consumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.message.v1.ClientSendMessageEvents;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.fabricmc.fabric.api.client.rendering.v1.world.WorldRenderEvents;
import net.fabricmc.loader.api.FabricLoader;
import net.minecraft.class_1041;
import net.minecraft.class_11908;
import net.minecraft.class_1747;
import net.minecraft.class_1792;
import net.minecraft.class_1799;
import net.minecraft.class_1802;
import net.minecraft.class_1935;
import net.minecraft.class_2248;
import net.minecraft.class_2561;
import net.minecraft.class_2583;
import net.minecraft.class_266;
import net.minecraft.class_268;
import net.minecraft.class_2680;
import net.minecraft.class_269;
import net.minecraft.class_274;
import net.minecraft.class_2960;
import net.minecraft.class_310;
import net.minecraft.class_332;
import net.minecraft.class_3675;
import net.minecraft.class_437;
import net.minecraft.class_5250;
import net.minecraft.class_5251;
import net.minecraft.class_7923;
import net.minecraft.class_8646;
import net.minecraft.class_9011;
import net.minecraft.class_9014;
import net.minecraft.class_9015;
import net.minecraft.class_9020;
import net.minecraft.class_9022;
import net.minecraft.class_9334;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Environment(value=EnvType.CLIENT)
public class CasinoriggerClient
implements ClientModInitializer {
    private static CasinoriggerClient INSTANCE;
    private static final Gson GSON;
    private static final Path KEY_CONFIG_PATH;
    private static final Path ITEM_CONFIG_PATH;
    private static final Path LOOT_CONFIG_PATH;
    private static final int MIN_SPOOF_RATE_HZ = 20;
    private static final int MAX_SPOOF_RATE_HZ = 720;
    private static final int DEFAULT_SPOOF_RATE_HZ = 240;
    private static final int DEFAULT_OPEN_MENU_KEY = 79;
    private static final int DEFAULT_RUSSIAN_ARM_KEY = 74;
    private static final int DEFAULT_CLEAR_BLACKJACK_FORCE_KEY = 75;
    private static final int DEFAULT_UNIVERSAL_FROM_HAND_KEY = 66;
    private static final int DEFAULT_BLACKJACK_SECONDARY_KEY = 341;
    private static final int DEFAULT_TOGGLE_BLACKJACK_KEY = 80;
    private static final int DEFAULT_TOGGLE_FAKE_PAY_KEY = 76;
    private static final int DEFAULT_TOGGLE_FORTY_FIVE_TEN_KEY = 71;
    private static final int DEFAULT_SWITCH_FORTY_FIVE_TEN_KEY = 86;
    private static final String FAKE_SCOREBOARD_OBJECTIVE = "qasino_fake";
    private static final Logger LOGGER;
    private static final Pattern SCOREBOARD_AMOUNT_PATTERN;
    private static final String KEYAUTH_OWNER_ID = "lGN5tE6k1t";
    private static final String KEYAUTH_APP_NAME = "Rigger";
    private static final String KEYAUTH_VERSION = "1.0";
    private final KeyAuthClient keyAuth = new KeyAuthClient("Rigger", "lGN5tE6k1t", "1.0");
    private volatile boolean keyauthInitialized;
    private volatile boolean keyauthInitInProgress;
    private volatile boolean keyauthAuthenticated;
    private volatile boolean keyauthChecking;
    private String keyauthStatus = "Not logged in";
    private String keyauthLicenseKey = "";
    private int openMenuKeyCode = 79;
    private int openExternalOverlayKeyCode = 79;
    private int togglePaperKeyCode = 89;
    private int switchSideKeyCode = 85;
    private int cycleModeUpKeyCode = 266;
    private int cycleModeDownKeyCode = 267;
    private int toggleFiftyFiftyKeyCode = 73;
    private int triggerRussianRouletteKeyCode = 74;
    private int toggleOverlayKeyCode = 72;
    private int toggleAllRigsKeyCode = 77;
    private int toggleBlackjackKeyCode = 80;
    private int toggleFakePayKeyCode = 76;
    private int toggleFortyFiveTenKeyCode = 71;
    private int switchFortyFiveTenKeyCode = 86;
    private int clearBlackjackForceKeyCode = 75;
    private int universalFromHandKeyCode = 66;
    private int[] blackjackForcePrimaryKeyCodes = CasinoriggerClient.defaultBlackjackPrimaryKeys();
    private int[] blackjackForceSecondaryKeyCodes = CasinoriggerClient.defaultBlackjackSecondaryKeys();
    private boolean openMenuWasDown;
    private boolean openExternalOverlayWasDown;
    private boolean togglePaperWasDown;
    private boolean switchSideWasDown;
    private boolean cycleModeUpWasDown;
    private boolean cycleModeDownWasDown;
    private boolean toggleFiftyWasDown;
    private boolean triggerRussianRouletteWasDown;
    private boolean toggleOverlayWasDown;
    private boolean toggleBlackjackWasDown;
    private boolean toggleFakePayWasDown;
    private boolean toggleFortyFiveTenWasDown;
    private boolean switchFortyFiveTenWasDown;
    private boolean clearBlackjackForceWasDown;
    private boolean universalFromHandWasDown;
    private final boolean[] blackjackForceWasDown = new boolean[10];
    private int lastLoggedBlackjackPending = -1;
    private boolean lastLoggedRussianArmed;
    private boolean overlayEnabled = true;
    private boolean riggingEnabled = true;
    private boolean fakePayEnabled = false;
    private boolean fakeMediaEnabled = false;
    private boolean scoreboardRigEnabled;
    private double scoreboardMoneyAdd;
    private boolean fakeScoreboardEnabled;
    private String fakeScoreboardTitle = "Server Stats";
    private String fakeScoreboardMoney = "12.5M";
    private String fakeScoreboardShards = "220";
    private String fakeScoreboardKills = "37";
    private String fakeScoreboardDeaths = "4";
    private String fakeScoreboardKeyall = "59m 59s";
    private String fakeScoreboardPlaytime = "3h 12m";
    private String fakeScoreboardTeam = "Oceania";
    private String fakeScoreboardFooter = "AUTO";
    private boolean solidSchematicEnabled;
    private String schematicFilePath = "";
    private boolean fakeLootdropEnabled;
    private final List<FakeLootEntry> fakeLootEntries = new ArrayList<FakeLootEntry>();
    private final Map<class_1792, class_1792> fakeLootItemMap = new HashMap<class_1792, class_1792>();
    private final Map<class_2248, class_2248> fakeLootBlockMap = new HashMap<class_2248, class_2248>();
    private int spoofRateHz = 240;
    private long lastRenderSpoofNanos;
    private boolean renderSpoofClockReady;
    private RigMode activeRigMode = RigMode.PAPER;
    private RigMode cycleRigMode = RigMode.PAPER;
    private String customTitle = "Verz's Casino Rigger";
    private int uiThemeIndex;
    private PaperGame paperGame;
    private Blackjack blackjack;
    private FortyFiveTen fortyFiveTen;
    private class_266 fakeScoreboardObjective;
    private class_266 fakeScoreboardOriginalObjective;
    private final List<String> fakeScoreboardTeamNames = new ArrayList<String>();
    private long fakeScoreboardKeyallStartMs;
    private long fakeScoreboardKeyallInitialSeconds = 3599L;
    private long fakeScoreboardLastMsUpdate;
    private int fakeScoreboardDisplayMs;
    private int fakeScoreboardMsChangeDirection = 1;
    private long fakeScoreboardLastUpdateMs;
    private boolean lastSolidSchematicEnabled;
    private long lastSolidSchematicApplyMs;
    private final Map<String, Double> litematicaOpacityBackup = new HashMap<String, Double>();
    private final Map<String, Boolean> litematicaBooleanBackup = new HashMap<String, Boolean>();
    private boolean scoreboardEntryCheckInProgress;

    private static int[] defaultBlackjackPrimaryKeys() {
        return new int[]{49, 50, 51, 52, 53, 54, 55, 56, 57, 48};
    }

    private static int[] defaultBlackjackSecondaryKeys() {
        int[] keys = new int[10];
        for (int i = 0; i < keys.length; ++i) {
            keys[i] = 341;
        }
        return keys;
    }

    public static CasinoriggerClient getInstance() {
        return INSTANCE;
    }

    public void onInitializeClient() {
        INSTANCE = this;
        this.paperGame = PaperGame.getInstance();
        this.blackjack = Blackjack.getInstance();
        this.fortyFiveTen = FortyFiveTen.getInstance();
        this.loadKeyConfig();
        this.loadItemConfig();
        this.loadLootConfig();
        this.applyRiggingState();
        this.ensureKeyAuthInitialized();
        if (!this.keyauthLicenseKey.isBlank()) {
            this.authenticateWithLicense(this.keyauthLicenseKey, null);
        }
        ClientSendMessageEvents.ALLOW_COMMAND.register(command -> !FakePay.handleCommand(command, this.fakePayEnabled));
        ClientSendMessageEvents.ALLOW_CHAT.register(message -> !FakePay.handleCommand(message, this.fakePayEnabled));
        HudRenderCallback.EVENT.register((context, tickDelta) -> {
            this.runRenderScheduledSpoof();
            this.renderOverlay(context);
        });
        WorldRenderEvents.AFTER_ENTITIES.register(FakeMediaBadgeRenderer::renderForPlayer);
        ClientTickEvents.START_CLIENT_TICK.register(clientTick -> {
            boolean openMenuPressed = this.isPressed(clientTick, this.openMenuKeyCode);
            if (openMenuPressed && !this.openMenuWasDown) {
                if (this.isRiggerMenuScreen(clientTick.field_1755)) {
                    clientTick.method_1507(null);
                } else if (clientTick.field_1755 == null) {
                    if (!this.keyauthAuthenticated) {
                        this.ensureKeyAuthInitialized();
                        clientTick.method_1507((class_437)new LicenseLoginScreen(null));
                    } else {
                        clientTick.method_1507((class_437)new OptimizationSettingsScreen(null));
                        LOGGER.info("Opening Settings Menu");
                    }
                }
            }
            this.openMenuWasDown = openMenuPressed;
            boolean openExternalOverlayPressed = this.isPressed(clientTick, this.openExternalOverlayKeyCode);
            if (openExternalOverlayPressed && !this.openExternalOverlayWasDown && clientTick.field_1755 == null) {
                this.launchExternalOverlay();
            }
            this.openExternalOverlayWasDown = openExternalOverlayPressed;
            boolean togglePaperPressed = this.isPressed(clientTick, this.togglePaperKeyCode);
            if (togglePaperPressed && !this.togglePaperWasDown && clientTick.field_1755 == null) {
                this.selectPaperRig();
            }
            this.togglePaperWasDown = togglePaperPressed;
            boolean switchSidePressed = this.isPressed(clientTick, this.switchSideKeyCode);
            if (switchSidePressed && !this.switchSideWasDown && clientTick.field_1755 == null) {
                this.switchWinnerForCurrentCycleMode();
            }
            this.switchSideWasDown = switchSidePressed;
            boolean cycleModeUpPressed = this.isPressed(clientTick, this.cycleModeUpKeyCode);
            if (cycleModeUpPressed && !this.cycleModeUpWasDown && clientTick.field_1755 == null) {
                this.cycleRigModeUp();
            }
            this.cycleModeUpWasDown = cycleModeUpPressed;
            boolean cycleModeDownPressed = this.isPressed(clientTick, this.cycleModeDownKeyCode);
            if (cycleModeDownPressed && !this.cycleModeDownWasDown && clientTick.field_1755 == null) {
                this.cycleRigModeDown();
            }
            this.cycleModeDownWasDown = cycleModeDownPressed;
            boolean toggleFiftyPressed = this.isPressed(clientTick, this.toggleFiftyFiftyKeyCode);
            if (toggleFiftyPressed && !this.toggleFiftyWasDown && clientTick.field_1755 == null) {
                this.selectFiftyRig();
            }
            this.toggleFiftyWasDown = toggleFiftyPressed;
            boolean triggerRussianPressed = this.isPressed(clientTick, this.triggerRussianRouletteKeyCode);
            if (triggerRussianPressed && !this.triggerRussianRouletteWasDown) {
                RussianRoulette russian = RussianRoulette.getInstance();
                russian.arm();
                LOGGER.info("Russian Roulette armed with {}", (Object)russian.triggerItem.method_63680().getString());
            }
            this.triggerRussianRouletteWasDown = triggerRussianPressed;
            boolean toggleOverlayPressed = this.isPressed(clientTick, this.toggleOverlayKeyCode);
            if (toggleOverlayPressed && !this.toggleOverlayWasDown && clientTick.field_1755 == null) {
                this.overlayEnabled = !this.overlayEnabled;
                this.saveKeyConfig();
                LOGGER.info("Overlay Enabled = {}", (Object)this.overlayEnabled);
            }
            this.toggleOverlayWasDown = toggleOverlayPressed;
            boolean toggleFakePayPressed = this.isPressed(clientTick, this.toggleFakePayKeyCode);
            if (toggleFakePayPressed && !this.toggleFakePayWasDown && clientTick.field_1755 == null) {
                this.fakePayEnabled = !this.fakePayEnabled;
                this.saveKeyConfig();
                LOGGER.info("Fake Pay Enabled = {}", (Object)this.fakePayEnabled);
            }
            this.toggleFakePayWasDown = toggleFakePayPressed;
            boolean toggleFortyFiveTenPressed = this.isPressed(clientTick, this.toggleFortyFiveTenKeyCode);
            if (toggleFortyFiveTenPressed && !this.toggleFortyFiveTenWasDown && clientTick.field_1755 == null) {
                this.selectFortyFiveTenRig();
            }
            this.toggleFortyFiveTenWasDown = toggleFortyFiveTenPressed;
            boolean switchFortyFiveTenPressed = this.isPressed(clientTick, this.switchFortyFiveTenKeyCode);
            if (switchFortyFiveTenPressed && !this.switchFortyFiveTenWasDown && clientTick.field_1755 == null) {
                this.switchFortyFiveTenWinner();
            }
            this.switchFortyFiveTenWasDown = switchFortyFiveTenPressed;
            boolean toggleBlackjackPressed = this.isPressed(clientTick, this.toggleBlackjackKeyCode);
            if (toggleBlackjackPressed && !this.toggleBlackjackWasDown && clientTick.field_1755 == null) {
                this.selectBlackjackRig();
            }
            this.toggleBlackjackWasDown = toggleBlackjackPressed;
            for (int i = 0; i < this.blackjackForceWasDown.length; ++i) {
                boolean forcePressed;
                boolean bl = forcePressed = clientTick.field_1755 == null && this.isBlackjackForcePressed(clientTick, this.blackjackForcePrimaryKeyCodes[i], this.blackjackForceSecondaryKeyCodes[i]);
                if (forcePressed && !this.blackjackForceWasDown[i]) {
                    this.blackjack.queueForce(i + 1);
                }
                this.blackjackForceWasDown[i] = forcePressed;
            }
            boolean clearBlackjackPressed = this.isPressed(clientTick, this.clearBlackjackForceKeyCode);
            if (clearBlackjackPressed && !this.clearBlackjackForceWasDown && clientTick.field_1755 == null && this.blackjack.hasPendingForce()) {
                this.blackjack.clearPendingForce();
                LOGGER.info("Blackjack pending force cleared");
            }
            this.clearBlackjackForceWasDown = clearBlackjackPressed;
            boolean universalFromHandPressed = this.isPressed(clientTick, this.universalFromHandKeyCode);
            if (universalFromHandPressed && !this.universalFromHandWasDown && clientTick.field_1755 == null) {
                FromHandResult result = this.applyFromHandToActiveRig();
                LOGGER.info(result.message);
            }
            this.universalFromHandWasDown = universalFromHandPressed;
            this.tickFakeScoreboard(clientTick);
            this.tickSolidSchematic(clientTick);
            this.runRigPass(clientTick);
            this.logOverlayStateTransitions();
        });
    }

    private void renderOverlay(class_332 context) {
        if (!this.overlayEnabled) {
            return;
        }
        FiftyFifty fifty = FiftyFifty.getInstance();
        RussianRoulette russian = RussianRoulette.getInstance();
        class_1799 paperWinner = this.paperGame.isSingleItemPaper() ? this.paperGame.getOverlayWinnerStack() : class_1799.field_8037;
        class_1792 fiftyWinner = fifty.leftWin ? fifty.leftSideItem : fifty.rightSideItem;
        String blackjackForced = this.blackjack.getPendingValue() == -1 ? "" : this.blackjack.pendingLabel();
        int x = 6;
        int y = 6;
        this.drawOverlayLine(context, this.customTitle, x, y, -1);
        this.drawRigRow(context, x, y + 16, "Paper:", this.paperGame.enabled, paperWinner, this.paperGame.getOverlayWinnerLabel());
        this.drawRigRow(context, x, y + 36, "50/50:", fifty.enabled, new class_1799((class_1935)fiftyWinner), null);
        FortyFiveTen fortyFiveTen = FortyFiveTen.getInstance();
        this.drawRigRow(context, x, y + 56, "45/45/10:", fortyFiveTen.enabled, new class_1799((class_1935)fortyFiveTen.getWinnerItem()), fortyFiveTen.winner.label);
        this.drawStatusRow(context, x, y + 76, "Blackjack:", this.blackjack.enabled, blackjackForced);
        this.drawStatusRow(context, x, y + 96, "Russian:", russian.enabled, russian.armed ? "ARMED" : "");
        this.drawStatusRow(context, x, y + 116, "Fake Pay:", this.fakePayEnabled, "");
        Object moneyAddLabel = "";
        if (this.scoreboardRigEnabled) {
            moneyAddLabel = this.formatScoreboardAmount(this.scoreboardMoneyAdd);
            if (this.scoreboardMoneyAdd > 0.0 && !((String)moneyAddLabel).startsWith("+")) {
                moneyAddLabel = "+" + (String)moneyAddLabel;
            }
        }
        this.drawStatusRow(context, x, y + 136, "Score:", this.scoreboardRigEnabled, (String)moneyAddLabel);
        this.drawStatusRow(context, x, y + 156, "Scoreboard:", this.fakeScoreboardEnabled, "");
    }

    private void drawOverlayLine(class_332 context, String text, int x, int y, int color) {
        context.method_25303(class_310.method_1551().field_1772, text, x, y, color);
    }

    private void drawRigRow(class_332 context, int x, int y, String label, boolean enabled, class_1799 iconStack, String winnerLabelOverride) {
        boolean drawIcon;
        context.method_25303(class_310.method_1551().field_1772, label, x, y + 4, -1);
        int statusLeft = x + 56;
        int statusTop = y + 2;
        int statusColor = enabled ? -13710223 : -1618884;
        context.method_25294(statusLeft, statusTop, statusLeft + 10, statusTop + 10, statusColor);
        if (iconStack == null) {
            iconStack = class_1799.field_8037;
        }
        boolean bl = drawIcon = !iconStack.method_7960();
        if (drawIcon) {
            context.method_51427(iconStack, statusLeft + 16, y - 1);
            context.method_51431(class_310.method_1551().field_1772, iconStack, statusLeft + 16, y - 1);
        }
        String winnerName = winnerLabelOverride != null ? winnerLabelOverride : iconStack.method_7964().getString();
        int textLeft = drawIcon ? statusLeft + 36 : statusLeft + 16;
        context.method_25303(class_310.method_1551().field_1772, winnerName, textLeft, y + 4, -1);
    }

    private void drawStatusRow(class_332 context, int x, int y, String label, boolean enabled, String detail) {
        context.method_25303(class_310.method_1551().field_1772, label, x, y + 4, -1);
        int statusLeft = x + 56;
        int statusTop = y + 2;
        int statusColor = enabled ? -13710223 : -1618884;
        context.method_25294(statusLeft, statusTop, statusLeft + 10, statusTop + 10, statusColor);
        if (detail != null && !detail.isBlank()) {
            context.method_25303(class_310.method_1551().field_1772, detail, statusLeft + 16, y + 4, -1);
        }
    }

    private boolean isPressed(class_310 client, int keyCode) {
        return keyCode >= 0 && class_3675.method_15987((class_1041)client.method_22683(), (int)keyCode);
    }

    private boolean isRiggerMenuScreen(class_437 screen) {
        return screen instanceof OptimizationSettingsScreen || screen instanceof LicenseLoginScreen;
    }

    public boolean isKeyauthAuthenticated() {
        return this.keyauthAuthenticated;
    }

    public boolean isKeyauthChecking() {
        return this.keyauthChecking;
    }

    public String getKeyauthStatus() {
        return this.keyauthStatus;
    }

    public String getKeyauthLicenseKey() {
        return this.keyauthLicenseKey;
    }

    public void clearKeyauthLicense() {
        this.keyauthLicenseKey = "";
        this.keyauthAuthenticated = false;
        this.keyauthStatus = "Not logged in";
        this.saveKeyConfig();
    }

    public void authenticateWithLicense(String key, Consumer<KeyAuthClient.AuthResult> callback) {
        if (key == null || key.isBlank()) {
            KeyAuthClient.AuthResult result = new KeyAuthClient.AuthResult(false, "Enter a license key.");
            if (callback != null) {
                callback.accept(result);
            }
            return;
        }
        this.ensureKeyAuthInitialized();
        if (this.keyauthChecking) {
            return;
        }
        this.keyauthChecking = true;
        this.keyauthStatus = "Checking license...";
        String trimmed = key.trim();
        Thread worker = new Thread(() -> {
            KeyAuthClient.AuthResult result = this.keyAuth.license(trimmed);
            class_310 client = class_310.method_1551();
            Runnable apply = () -> {
                this.keyauthChecking = false;
                this.keyauthAuthenticated = result.success;
                String string = this.keyauthStatus = result.success ? "Logged in" : "Not logged in: " + result.message;
                if (result.success) {
                    this.keyauthLicenseKey = trimmed;
                    this.saveKeyConfig();
                }
                if (callback != null) {
                    callback.accept(result);
                }
            };
            if (client != null) {
                client.execute(apply);
            } else {
                apply.run();
            }
        }, "KeyAuth-License");
        worker.setDaemon(true);
        worker.start();
    }

    private void ensureKeyAuthInitialized() {
        if (this.keyauthInitialized || this.keyauthInitInProgress) {
            return;
        }
        this.keyauthInitInProgress = true;
        Thread worker = new Thread(() -> {
            KeyAuthClient.AuthResult result = this.keyAuth.init();
            class_310 client = class_310.method_1551();
            Runnable apply = () -> {
                this.keyauthInitInProgress = false;
                if (!result.success) {
                    this.keyauthStatus = "KeyAuth init failed: " + result.message;
                    this.keyauthAuthenticated = false;
                    return;
                }
                this.keyauthInitialized = true;
            };
            if (client != null) {
                client.execute(apply);
            } else {
                apply.run();
            }
        }, "KeyAuth-Init");
        worker.setDaemon(true);
        worker.start();
    }

    private boolean isBlackjackForcePressed(class_310 client, int primaryKeyCode, int secondaryKeyCode) {
        if (primaryKeyCode < 0) {
            return false;
        }
        class_1041 window = client.method_22683();
        if (!class_3675.method_15987((class_1041)window, (int)primaryKeyCode)) {
            return false;
        }
        if (secondaryKeyCode < 0 || secondaryKeyCode == primaryKeyCode) {
            return true;
        }
        if (secondaryKeyCode == 341 || secondaryKeyCode == 345) {
            return class_3675.method_15987((class_1041)window, (int)341) || class_3675.method_15987((class_1041)window, (int)345);
        }
        return class_3675.method_15987((class_1041)window, (int)secondaryKeyCode);
    }

    private void runRigPass(class_310 client) {
        this.paperGame.Rig(client);
        FiftyFifty.getInstance().tick(client);
        FortyFiveTen.getInstance().tick(client);
        RussianRoulette.getInstance().tick(client);
        this.blackjack.tick(client);
    }

    private void logOverlayStateTransitions() {
        boolean russianArmed;
        int pendingValue = this.blackjack.getPendingValue();
        if (pendingValue != this.lastLoggedBlackjackPending) {
            LOGGER.info("Blackjack queued force = {}", (Object)(pendingValue == -1 ? "none" : this.blackjack.pendingLabel()));
            this.lastLoggedBlackjackPending = pendingValue;
        }
        if ((russianArmed = RussianRoulette.getInstance().armed) != this.lastLoggedRussianArmed) {
            LOGGER.info("Russian Roulette armed = {}", (Object)russianArmed);
            this.lastLoggedRussianArmed = russianArmed;
        }
    }

    private void runRenderScheduledSpoof() {
        if (!this.riggingEnabled || this.spoofRateHz <= 20) {
            return;
        }
        class_310 client = class_310.method_1551();
        if (client == null || client.field_1724 == null) {
            return;
        }
        long now = System.nanoTime();
        long intervalNanos = 1000000000L / (long)this.spoofRateHz;
        if (!this.renderSpoofClockReady) {
            this.lastRenderSpoofNanos = now;
            this.renderSpoofClockReady = true;
            return;
        }
        if (now - this.lastRenderSpoofNanos >= intervalNanos) {
            this.lastRenderSpoofNanos = now;
            this.runRigPass(client);
        }
    }

    public void selectPaperRig() {
        this.selectRigMode(RigMode.PAPER);
    }

    public void selectFiftyRig() {
        this.selectRigMode(RigMode.FIFTY);
    }

    public void selectFortyFiveTenRig() {
        this.selectRigMode(RigMode.FORTYFIVE_TEN);
    }

    public void selectBlackjackRig() {
        this.selectRigMode(RigMode.BLACKJACK);
    }

    public void selectRussianRig() {
        this.selectRigMode(RigMode.RUSSIAN);
    }

    private void selectRigMode(RigMode mode) {
        this.activeRigMode = mode;
        this.cycleRigMode = mode;
        this.riggingEnabled = true;
        this.applyRiggingState();
        this.saveKeyConfig();
        LOGGER.info("{} Rig Active", (Object)mode.label);
    }

    public void cycleRigModeUp() {
        this.cycleRigMode(true);
    }

    public void cycleRigModeDown() {
        this.cycleRigMode(false);
    }

    private void cycleRigMode(boolean forward) {
        if (this.activeRigMode == RigMode.BLACKJACK && this.cycleRigMode != RigMode.BLACKJACK) {
            this.activeRigMode = this.cycleRigMode;
            this.riggingEnabled = true;
            this.applyRiggingState();
            this.saveKeyConfig();
            LOGGER.info("Rig Mode = {}", (Object)this.activeRigMode.label);
            LOGGER.info("Paper Rig Enabled = {}", (Object)this.paperGame.enabled);
            LOGGER.info("50/50 Rig Enabled = {}", (Object)FiftyFifty.getInstance().enabled);
            LOGGER.info("45/45/10 Rig Enabled = {}", (Object)FortyFiveTen.getInstance().enabled);
            LOGGER.info("Blackjack Rig Enabled = {}", (Object)this.blackjack.enabled);
            LOGGER.info("Russian Roulette Enabled = {}", (Object)RussianRoulette.getInstance().enabled);
            return;
        }
        this.activeRigMode = this.cycleRigMode = forward ? this.cycleRigMode.next() : this.cycleRigMode.previous();
        this.riggingEnabled = true;
        this.applyRiggingState();
        this.saveKeyConfig();
        LOGGER.info("Rig Mode = {}", (Object)this.cycleRigMode.label);
        LOGGER.info("Paper Rig Enabled = {}", (Object)this.paperGame.enabled);
        LOGGER.info("50/50 Rig Enabled = {}", (Object)FiftyFifty.getInstance().enabled);
        LOGGER.info("45/45/10 Rig Enabled = {}", (Object)FortyFiveTen.getInstance().enabled);
        LOGGER.info("Blackjack Rig Enabled = {}", (Object)this.blackjack.enabled);
        LOGGER.info("Russian Roulette Enabled = {}", (Object)RussianRoulette.getInstance().enabled);
    }

    private void switchWinnerForCurrentCycleMode() {
        RigMode mode;
        RigMode rigMode = mode = this.activeRigMode == RigMode.BLACKJACK ? this.cycleRigMode : this.activeRigMode;
        if (mode == RigMode.PAPER) {
            this.paperGame.leftWin = !this.paperGame.leftWin;
            this.saveItemConfig();
            LOGGER.info("Paper Winner = {}", (Object)(this.paperGame.leftWin ? "Host" : "Viewer"));
            return;
        }
        if (mode == RigMode.FIFTY) {
            FiftyFifty fifty = FiftyFifty.getInstance();
            fifty.leftWin = !fifty.leftWin;
            this.saveItemConfig();
            LOGGER.info("50/50 Winner = {}", (Object)(fifty.leftWin ? "1st Item" : "2nd Item"));
            return;
        }
        if (mode == RigMode.FORTYFIVE_TEN) {
            FortyFiveTen fortyFiveTen = FortyFiveTen.getInstance();
            fortyFiveTen.cycleWinner();
            this.saveItemConfig();
            LOGGER.info("45/45/10 Winner = {}", (Object)fortyFiveTen.winner.label);
        }
    }

    private void switchFortyFiveTenWinner() {
        FortyFiveTen fortyFiveTen = FortyFiveTen.getInstance();
        fortyFiveTen.cycleWinner();
        this.saveItemConfig();
        LOGGER.info("45/45/10 Winner = {}", (Object)fortyFiveTen.winner.label);
    }

    private RigMode toCycleMode(RigMode mode) {
        return mode;
    }

    private void activateMode(RigMode mode) {
        this.paperGame.enabled = mode == RigMode.PAPER;
        FiftyFifty.getInstance().enabled = mode == RigMode.FIFTY;
        FortyFiveTen.getInstance().enabled = mode == RigMode.FORTYFIVE_TEN;
        this.blackjack.enabled = mode == RigMode.BLACKJACK;
        RussianRoulette russian = RussianRoulette.getInstance();
        boolean bl = russian.enabled = mode == RigMode.RUSSIAN;
        if (!russian.enabled) {
            russian.armed = false;
        }
    }

    private void applyRiggingState() {
        if (this.riggingEnabled) {
            this.activateMode(this.activeRigMode);
        } else {
            this.paperGame.enabled = false;
            FiftyFifty.getInstance().enabled = false;
            FortyFiveTen.getInstance().enabled = false;
            this.blackjack.enabled = false;
            RussianRoulette russian = RussianRoulette.getInstance();
            russian.enabled = false;
            russian.armed = false;
        }
    }

    private RigMode parseRigMode(String value) {
        if (value == null) {
            return RigMode.PAPER;
        }
        try {
            return RigMode.valueOf(value);
        }
        catch (IllegalArgumentException ignored) {
            return RigMode.PAPER;
        }
    }

    private FortyFiveTen.WinnerTarget parseFortyFiveTenWinner(String value, FortyFiveTen.WinnerTarget fallback) {
        if (value == null) {
            return fallback;
        }
        try {
            return FortyFiveTen.WinnerTarget.valueOf(value);
        }
        catch (IllegalArgumentException ignored) {
            return fallback;
        }
    }

    private int normalizeSpoofRate(int value) {
        if (value < 20) {
            return 20;
        }
        if (value > 720) {
            return 720;
        }
        return value;
    }

    private void loadKeyConfig() {
        if (!Files.exists(KEY_CONFIG_PATH, new LinkOption[0])) {
            this.saveKeyConfig();
            return;
        }
        try (BufferedReader reader = Files.newBufferedReader(KEY_CONFIG_PATH);){
            KeyConfig config = (KeyConfig)GSON.fromJson((Reader)reader, KeyConfig.class);
            if (config != null) {
                this.openMenuKeyCode = config.openMenuKeyCode != 0 ? config.openMenuKeyCode : 79;
                this.openExternalOverlayKeyCode = config.openExternalOverlayKeyCode;
                this.togglePaperKeyCode = config.togglePaperKeyCode;
                this.switchSideKeyCode = config.switchSideKeyCode;
                this.cycleModeUpKeyCode = config.cycleModeUpKeyCode != 0 ? config.cycleModeUpKeyCode : (config.cycleModeKeyCode != 0 ? config.cycleModeKeyCode : 266);
                this.cycleModeDownKeyCode = config.cycleModeDownKeyCode != 0 ? config.cycleModeDownKeyCode : 267;
                this.toggleFiftyFiftyKeyCode = config.toggleFiftyFiftyKeyCode;
                this.triggerRussianRouletteKeyCode = config.triggerRussianRouletteKeyCode;
                this.toggleOverlayKeyCode = config.toggleOverlayKeyCode;
                this.toggleAllRigsKeyCode = config.toggleAllRigsKeyCode;
                this.toggleBlackjackKeyCode = config.toggleBlackjackKeyCode != 0 ? config.toggleBlackjackKeyCode : 80;
                this.toggleFakePayKeyCode = config.toggleFakePayKeyCode != 0 ? config.toggleFakePayKeyCode : 76;
                this.toggleFortyFiveTenKeyCode = config.toggleFortyFiveTenKeyCode != 0 ? config.toggleFortyFiveTenKeyCode : 71;
                this.switchFortyFiveTenKeyCode = config.switchFortyFiveTenKeyCode != 0 ? config.switchFortyFiveTenKeyCode : 86;
                this.clearBlackjackForceKeyCode = config.clearBlackjackForceKeyCode;
                int n = this.universalFromHandKeyCode = config.universalFromHandKeyCode != 0 ? config.universalFromHandKeyCode : 66;
                this.blackjackForcePrimaryKeyCodes = config.blackjackForcePrimaryKeyCodes != null && config.blackjackForcePrimaryKeyCodes.length == 10 ? (int[])config.blackjackForcePrimaryKeyCodes.clone() : (config.blackjackForceKeyCodes != null && config.blackjackForceKeyCodes.length == 10 ? (int[])config.blackjackForceKeyCodes.clone() : CasinoriggerClient.defaultBlackjackPrimaryKeys());
                this.blackjackForceSecondaryKeyCodes = config.blackjackForceSecondaryKeyCodes != null && config.blackjackForceSecondaryKeyCodes.length == 10 ? (int[])config.blackjackForceSecondaryKeyCodes.clone() : (config.blackjackForceKeyCodes != null && config.blackjackForceKeyCodes.length == 10 ? CasinoriggerClient.defaultBlackjackSecondaryKeys() : CasinoriggerClient.defaultBlackjackSecondaryKeys());
                this.overlayEnabled = config.overlayEnabled;
                this.riggingEnabled = true;
                this.fakePayEnabled = config.fakePayEnabled;
                this.fakeMediaEnabled = config.fakeMediaEnabled;
                this.scoreboardRigEnabled = config.scoreboardRigEnabled;
                this.scoreboardMoneyAdd = config.scoreboardMoneyAdd;
                this.fakeScoreboardEnabled = config.fakeScoreboardEnabled;
                this.fakeScoreboardTitle = CasinoriggerClient.sanitizeFakeScoreboardText(config.fakeScoreboardTitle, this.fakeScoreboardTitle);
                this.fakeScoreboardMoney = CasinoriggerClient.sanitizeFakeScoreboardText(config.fakeScoreboardMoney, this.fakeScoreboardMoney);
                this.fakeScoreboardShards = CasinoriggerClient.sanitizeFakeScoreboardText(config.fakeScoreboardShards, this.fakeScoreboardShards);
                this.fakeScoreboardKills = CasinoriggerClient.sanitizeFakeScoreboardText(config.fakeScoreboardKills, this.fakeScoreboardKills);
                this.fakeScoreboardDeaths = CasinoriggerClient.sanitizeFakeScoreboardText(config.fakeScoreboardDeaths, this.fakeScoreboardDeaths);
                this.fakeScoreboardKeyall = CasinoriggerClient.sanitizeFakeScoreboardText(config.fakeScoreboardKeyall, this.fakeScoreboardKeyall);
                this.fakeScoreboardPlaytime = CasinoriggerClient.sanitizeFakeScoreboardText(config.fakeScoreboardPlaytime, this.fakeScoreboardPlaytime);
                this.fakeScoreboardTeam = CasinoriggerClient.sanitizeFakeScoreboardText(config.fakeScoreboardTeam, this.fakeScoreboardTeam);
                this.fakeScoreboardFooter = CasinoriggerClient.sanitizeFakeScoreboardText(config.fakeScoreboardFooter, this.fakeScoreboardFooter);
                this.solidSchematicEnabled = config.solidSchematicEnabled;
                this.schematicFilePath = config.schematicFilePath != null ? config.schematicFilePath : "";
                this.spoofRateHz = this.normalizeSpoofRate(config.spoofRateHz);
                this.activeRigMode = this.parseRigMode(config.activeRigMode);
                this.cycleRigMode = this.toCycleMode(this.activeRigMode);
                if (config.customTitle != null && !config.customTitle.isBlank()) {
                    this.customTitle = config.customTitle;
                }
                this.uiThemeIndex = config.uiThemeIndex;
                this.keyauthLicenseKey = config.keyauthLicenseKey != null ? config.keyauthLicenseKey : "";
            }
        }
        catch (IOException e) {
            LOGGER.warn("Failed to read key config, using defaults", (Throwable)e);
        }
    }

    private void saveKeyConfig() {
        KeyConfig config = new KeyConfig();
        config.openMenuKeyCode = this.openMenuKeyCode;
        config.openExternalOverlayKeyCode = this.openExternalOverlayKeyCode;
        config.togglePaperKeyCode = this.togglePaperKeyCode;
        config.switchSideKeyCode = this.switchSideKeyCode;
        config.cycleModeKeyCode = this.cycleModeUpKeyCode;
        config.cycleModeUpKeyCode = this.cycleModeUpKeyCode;
        config.cycleModeDownKeyCode = this.cycleModeDownKeyCode;
        config.toggleFiftyFiftyKeyCode = this.toggleFiftyFiftyKeyCode;
        config.triggerRussianRouletteKeyCode = this.triggerRussianRouletteKeyCode;
        config.toggleOverlayKeyCode = this.toggleOverlayKeyCode;
        config.toggleAllRigsKeyCode = this.toggleAllRigsKeyCode;
        config.toggleBlackjackKeyCode = this.toggleBlackjackKeyCode;
        config.toggleFakePayKeyCode = this.toggleFakePayKeyCode;
        config.toggleFortyFiveTenKeyCode = this.toggleFortyFiveTenKeyCode;
        config.switchFortyFiveTenKeyCode = this.switchFortyFiveTenKeyCode;
        config.clearBlackjackForceKeyCode = this.clearBlackjackForceKeyCode;
        config.universalFromHandKeyCode = this.universalFromHandKeyCode;
        config.blackjackForceKeyCodes = (int[])this.blackjackForcePrimaryKeyCodes.clone();
        config.blackjackForcePrimaryKeyCodes = (int[])this.blackjackForcePrimaryKeyCodes.clone();
        config.blackjackForceSecondaryKeyCodes = (int[])this.blackjackForceSecondaryKeyCodes.clone();
        config.overlayEnabled = this.overlayEnabled;
        config.riggingEnabled = true;
        config.fakePayEnabled = this.fakePayEnabled;
        config.fakeMediaEnabled = this.fakeMediaEnabled;
        config.scoreboardRigEnabled = this.scoreboardRigEnabled;
        config.scoreboardMoneyAdd = this.scoreboardMoneyAdd;
        config.fakeScoreboardEnabled = this.fakeScoreboardEnabled;
        config.fakeScoreboardTitle = this.fakeScoreboardTitle;
        config.fakeScoreboardMoney = this.fakeScoreboardMoney;
        config.fakeScoreboardShards = this.fakeScoreboardShards;
        config.fakeScoreboardKills = this.fakeScoreboardKills;
        config.fakeScoreboardDeaths = this.fakeScoreboardDeaths;
        config.fakeScoreboardKeyall = this.fakeScoreboardKeyall;
        config.fakeScoreboardPlaytime = this.fakeScoreboardPlaytime;
        config.fakeScoreboardTeam = this.fakeScoreboardTeam;
        config.fakeScoreboardFooter = this.fakeScoreboardFooter;
        config.solidSchematicEnabled = this.solidSchematicEnabled;
        config.schematicFilePath = this.schematicFilePath;
        config.spoofRateHz = this.spoofRateHz;
        config.activeRigMode = this.activeRigMode.name();
        config.customTitle = this.customTitle;
        config.uiThemeIndex = this.uiThemeIndex;
        config.keyauthLicenseKey = this.keyauthLicenseKey;
        try (BufferedWriter writer = Files.newBufferedWriter(KEY_CONFIG_PATH, new OpenOption[0]);){
            GSON.toJson((Object)config, (Appendable)writer);
        }
        catch (IOException e) {
            LOGGER.warn("Failed to save key config", (Throwable)e);
        }
    }

    private void loadItemConfig() {
        if (!Files.exists(ITEM_CONFIG_PATH, new LinkOption[0])) {
            this.saveItemConfig();
            return;
        }
        try (BufferedReader reader = Files.newBufferedReader(ITEM_CONFIG_PATH);){
            ItemConfig config = (ItemConfig)GSON.fromJson((Reader)reader, ItemConfig.class);
            if (config == null) {
                return;
            }
            PaperGame paper = PaperGame.getInstance();
            FiftyFifty fifty = FiftyFifty.getInstance();
            FortyFiveTen fortyFiveTen = FortyFiveTen.getInstance();
            RussianRoulette russian = RussianRoulette.getInstance();
            paper.leftWin = config.paperHostWins;
            paper.setHostSuffix(config.paperHostSuffix);
            paper.setViewerSuffix(config.paperViewerSuffix);
            paper.setSingleItemPaper(config.paperSingleItem);
            paper.leftSideItem = this.parseItemId(config.paperSingleLeftItemId, paper.leftSideItem);
            paper.rightSideItem = this.parseItemId(config.paperSingleRightItemId, paper.rightSideItem);
            paper.setUniversalItems(config.paperUniversalItems);
            this.loadPaperNumberItems(paper, config.paperHostItemIds, true);
            if (!config.paperUniversalItems) {
                this.loadPaperNumberItems(paper, config.paperViewerItemIds, false);
            }
            fifty.leftSideItem = this.parseItemId(config.fiftyLeftItemId, fifty.leftSideItem);
            fifty.rightSideItem = this.parseItemId(config.fiftyRightItemId, fifty.rightSideItem);
            fortyFiveTen.firstItem = this.parseItemId(config.fortyFiveTenFirstItemId, fortyFiveTen.firstItem);
            fortyFiveTen.secondItem = this.parseItemId(config.fortyFiveTenSecondItemId, fortyFiveTen.secondItem);
            fortyFiveTen.middleItem = this.parseItemId(config.fortyFiveTenMiddleItemId, fortyFiveTen.middleItem);
            fortyFiveTen.winner = this.parseFortyFiveTenWinner(config.fortyFiveTenWinner, fortyFiveTen.winner);
            russian.triggerItem = this.parseItemId(config.russianTriggerItemId, russian.triggerItem);
            russian.normalItem = this.parseItemId(config.russianNormalItemId, russian.normalItem);
        }
        catch (IOException e) {
            LOGGER.warn("Failed to read item config, using defaults", (Throwable)e);
        }
    }

    private void loadLootConfig() {
        if (!Files.exists(LOOT_CONFIG_PATH, new LinkOption[0])) {
            this.saveLootConfig();
            return;
        }
        try (BufferedReader reader = Files.newBufferedReader(LOOT_CONFIG_PATH);){
            LootConfig config = (LootConfig)GSON.fromJson((Reader)reader, LootConfig.class);
            this.fakeLootEntries.clear();
            if (config != null) {
                this.fakeLootdropEnabled = config.enabled;
                if (config.entries != null) {
                    this.fakeLootEntries.addAll(config.entries);
                }
            }
        }
        catch (IOException e) {
            LOGGER.warn("Failed to read loot config, using defaults", (Throwable)e);
        }
        this.rebuildFakeLootCache();
    }

    private void saveLootConfig() {
        LootConfig config = new LootConfig();
        config.enabled = this.fakeLootdropEnabled;
        config.entries = new ArrayList<FakeLootEntry>(this.fakeLootEntries);
        try (BufferedWriter writer = Files.newBufferedWriter(LOOT_CONFIG_PATH, new OpenOption[0]);){
            GSON.toJson((Object)config, (Appendable)writer);
        }
        catch (IOException e) {
            LOGGER.warn("Failed to save loot config", (Throwable)e);
        }
    }

    public void launchExternalOverlay() {
        try (InputStream stream = CasinoriggerClient.class.getResourceAsStream("/overlay.py");){
            if (stream == null) {
                LOGGER.warn("overlay.py not found in resources.");
                return;
            }
            Path script = Files.createTempFile("casinorigger-overlay-", ".py", new FileAttribute[0]);
            Files.copy(stream, script, StandardCopyOption.REPLACE_EXISTING);
            script.toFile().deleteOnExit();
            Path logsDir = FabricLoader.getInstance().getGameDir().resolve("logs");
            ProcessBuilder builder = new ProcessBuilder("python", script.toString(), "--config-dir", FabricLoader.getInstance().getConfigDir().toString(), "--logs-dir", logsDir.toString());
            builder.redirectErrorStream(true);
            builder.start();
        }
        catch (IOException e) {
            LOGGER.warn("Failed to launch external overlay.", (Throwable)e);
        }
    }

    public void saveItemConfig() {
        ItemConfig config = new ItemConfig();
        PaperGame paper = PaperGame.getInstance();
        FiftyFifty fifty = FiftyFifty.getInstance();
        FortyFiveTen fortyFiveTen = FortyFiveTen.getInstance();
        RussianRoulette russian = RussianRoulette.getInstance();
        config.paperHostWins = paper.leftWin;
        config.paperUniversalItems = paper.isUniversalItems();
        config.paperSingleItem = paper.isSingleItemPaper();
        config.paperHostSuffix = paper.getHostSuffix();
        config.paperViewerSuffix = paper.getViewerSuffix();
        config.paperSingleLeftItemId = this.itemId(paper.leftSideItem);
        config.paperSingleRightItemId = this.itemId(paper.rightSideItem);
        config.paperHostItemIds = this.collectPaperNumberItems(paper, true);
        config.paperViewerItemIds = this.collectPaperNumberItems(paper, false);
        config.fiftyLeftItemId = this.itemId(fifty.leftSideItem);
        config.fiftyRightItemId = this.itemId(fifty.rightSideItem);
        config.fortyFiveTenFirstItemId = this.itemId(fortyFiveTen.firstItem);
        config.fortyFiveTenSecondItemId = this.itemId(fortyFiveTen.secondItem);
        config.fortyFiveTenMiddleItemId = this.itemId(fortyFiveTen.middleItem);
        config.fortyFiveTenWinner = fortyFiveTen.winner.name();
        config.russianTriggerItemId = this.itemId(russian.triggerItem);
        config.russianNormalItemId = this.itemId(russian.normalItem);
        try (BufferedWriter writer = Files.newBufferedWriter(ITEM_CONFIG_PATH, new OpenOption[0]);){
            GSON.toJson((Object)config, (Appendable)writer);
        }
        catch (IOException e) {
            LOGGER.warn("Failed to save item config", (Throwable)e);
        }
    }

    private class_1792 parseItemId(String itemId, class_1792 fallback) {
        if (itemId == null || itemId.isBlank()) {
            return fallback;
        }
        try {
            class_2960 id = class_2960.method_60654((String)itemId);
            return (class_1792)class_7923.field_41178.method_63535(id);
        }
        catch (Exception ignored) {
            return fallback;
        }
    }

    private String itemId(class_1792 item) {
        return class_7923.field_41178.method_10221((Object)item).toString();
    }

    private void loadPaperNumberItems(PaperGame paper, String[] itemIds, boolean hostSide) {
        if (paper == null || itemIds == null || itemIds.length < 9) {
            return;
        }
        for (int i = 0; i < 9; ++i) {
            class_1792 fallback = paper.getItem(hostSide, i);
            class_1792 parsed = this.parseItemId(itemIds[i], fallback);
            paper.setItem(hostSide, i, parsed);
        }
    }

    private String[] collectPaperNumberItems(PaperGame paper, boolean hostSide) {
        String[] items = new String[9];
        for (int i = 0; i < 9; ++i) {
            class_1792 item = paper != null ? paper.getItem(hostSide, i) : class_1802.field_8407;
            items[i] = this.itemId(item);
        }
        return items;
    }

    public void resetDefaultKeys() {
        this.openMenuKeyCode = 79;
        this.openExternalOverlayKeyCode = 79;
        this.togglePaperKeyCode = 89;
        this.switchSideKeyCode = 85;
        this.cycleModeUpKeyCode = 266;
        this.cycleModeDownKeyCode = 267;
        this.toggleFiftyFiftyKeyCode = 73;
        this.triggerRussianRouletteKeyCode = 74;
        this.toggleOverlayKeyCode = 72;
        this.toggleAllRigsKeyCode = 77;
        this.toggleBlackjackKeyCode = 80;
        this.toggleFakePayKeyCode = 76;
        this.toggleFortyFiveTenKeyCode = 71;
        this.switchFortyFiveTenKeyCode = 86;
        this.clearBlackjackForceKeyCode = 75;
        this.universalFromHandKeyCode = 66;
        this.blackjackForcePrimaryKeyCodes = CasinoriggerClient.defaultBlackjackPrimaryKeys();
        this.blackjackForceSecondaryKeyCodes = CasinoriggerClient.defaultBlackjackSecondaryKeys();
        this.overlayEnabled = true;
        this.riggingEnabled = true;
        this.fakePayEnabled = false;
        this.fakeMediaEnabled = false;
        this.scoreboardRigEnabled = false;
        this.scoreboardMoneyAdd = 0.0;
        this.fakeScoreboardEnabled = false;
        this.fakeScoreboardTitle = "Server Stats";
        this.fakeScoreboardMoney = "12.5M";
        this.fakeScoreboardShards = "220";
        this.fakeScoreboardKills = "37";
        this.fakeScoreboardDeaths = "4";
        this.fakeScoreboardKeyall = "59m 59s";
        this.fakeScoreboardPlaytime = "3h 12m";
        this.fakeScoreboardTeam = "Oceania";
        this.fakeScoreboardFooter = "AUTO";
        this.solidSchematicEnabled = false;
        this.spoofRateHz = 240;
        this.renderSpoofClockReady = false;
        this.activeRigMode = RigMode.PAPER;
        this.cycleRigMode = RigMode.PAPER;
        this.customTitle = "Verz's Casino Rigger";
        this.uiThemeIndex = 0;
        this.applyRiggingState();
        this.saveKeyConfig();
    }

    public int getOpenMenuKeyCode() {
        return this.openMenuKeyCode;
    }

    public void setOpenMenuKeyCode(int keyCode) {
        this.openMenuKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public int getOpenExternalOverlayKeyCode() {
        return this.openExternalOverlayKeyCode;
    }

    public void setOpenExternalOverlayKeyCode(int keyCode) {
        this.openExternalOverlayKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public int getTogglePaperKeyCode() {
        return this.togglePaperKeyCode;
    }

    public void setTogglePaperKeyCode(int keyCode) {
        this.togglePaperKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public int getSwitchSideKeyCode() {
        return this.switchSideKeyCode;
    }

    public void setSwitchSideKeyCode(int keyCode) {
        this.switchSideKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public int getCycleModeUpKeyCode() {
        return this.cycleModeUpKeyCode;
    }

    public void setCycleModeUpKeyCode(int keyCode) {
        this.cycleModeUpKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public int getCycleModeDownKeyCode() {
        return this.cycleModeDownKeyCode;
    }

    public void setCycleModeDownKeyCode(int keyCode) {
        this.cycleModeDownKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public int getToggleFiftyFiftyKeyCode() {
        return this.toggleFiftyFiftyKeyCode;
    }

    public void setToggleFiftyFiftyKeyCode(int keyCode) {
        this.toggleFiftyFiftyKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public String keyName(int keyCode) {
        if (keyCode < 0) {
            return "UNBOUND";
        }
        class_11908 input = new class_11908(keyCode, 0, 0);
        return class_3675.method_15985((class_11908)input).method_27445().getString();
    }

    public int getTriggerRussianRouletteKeyCode() {
        return this.triggerRussianRouletteKeyCode;
    }

    public void setTriggerRussianRouletteKeyCode(int keyCode) {
        this.triggerRussianRouletteKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public int getToggleOverlayKeyCode() {
        return this.toggleOverlayKeyCode;
    }

    public void setToggleOverlayKeyCode(int keyCode) {
        this.toggleOverlayKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public boolean isOverlayEnabled() {
        return this.overlayEnabled;
    }

    public void setOverlayEnabled(boolean enabled) {
        if (this.overlayEnabled == enabled) {
            return;
        }
        this.overlayEnabled = enabled;
        this.saveKeyConfig();
    }

    public int getToggleFakePayKeyCode() {
        return this.toggleFakePayKeyCode;
    }

    public void setToggleFakePayKeyCode(int keyCode) {
        this.toggleFakePayKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public boolean isFakePayEnabled() {
        return this.fakePayEnabled;
    }

    public void setFakePayEnabled(boolean enabled) {
        if (this.fakePayEnabled == enabled) {
            return;
        }
        this.fakePayEnabled = enabled;
        this.saveKeyConfig();
    }

    public boolean isFakeMediaEnabled() {
        return this.fakeMediaEnabled;
    }

    public void setFakeMediaEnabled(boolean enabled) {
        if (this.fakeMediaEnabled == enabled) {
            return;
        }
        this.fakeMediaEnabled = enabled;
        this.saveKeyConfig();
    }

    public int getToggleFortyFiveTenKeyCode() {
        return this.toggleFortyFiveTenKeyCode;
    }

    public void setToggleFortyFiveTenKeyCode(int keyCode) {
        this.toggleFortyFiveTenKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public int getSwitchFortyFiveTenKeyCode() {
        return this.switchFortyFiveTenKeyCode;
    }

    public void setSwitchFortyFiveTenKeyCode(int keyCode) {
        this.switchFortyFiveTenKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public boolean isRiggingEnabled() {
        return this.riggingEnabled;
    }

    public void setRiggingEnabled(boolean enabled) {
        if (this.riggingEnabled == enabled) {
            return;
        }
        this.riggingEnabled = enabled;
        this.applyRiggingState();
        this.saveKeyConfig();
    }

    public int getToggleAllRigsKeyCode() {
        return this.toggleAllRigsKeyCode;
    }

    public void setToggleAllRigsKeyCode(int keyCode) {
        this.toggleAllRigsKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public int getToggleBlackjackKeyCode() {
        return this.toggleBlackjackKeyCode;
    }

    public void setToggleBlackjackKeyCode(int keyCode) {
        this.toggleBlackjackKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public int getClearBlackjackForceKeyCode() {
        return this.clearBlackjackForceKeyCode;
    }

    public void setClearBlackjackForceKeyCode(int keyCode) {
        this.clearBlackjackForceKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public int getUniversalFromHandKeyCode() {
        return this.universalFromHandKeyCode;
    }

    public void setUniversalFromHandKeyCode(int keyCode) {
        this.universalFromHandKeyCode = keyCode;
        this.saveKeyConfig();
    }

    public int getBlackjackForceKeyCode(int value) {
        if (value < 1 || value > 10) {
            return -1;
        }
        return this.blackjackForcePrimaryKeyCodes[value - 1];
    }

    public int getBlackjackForcePrimaryKeyCode(int value) {
        return this.getBlackjackForceKeyCode(value);
    }

    public int getBlackjackForceSecondaryKeyCode(int value) {
        if (value < 1 || value > 10) {
            return -1;
        }
        return this.blackjackForceSecondaryKeyCodes[value - 1];
    }

    public void setBlackjackForceKeyCode(int value, int keyCode) {
        if (value < 1 || value > 10) {
            return;
        }
        this.blackjackForcePrimaryKeyCodes[value - 1] = keyCode;
        this.blackjackForceSecondaryKeyCodes[value - 1] = 341;
        this.saveKeyConfig();
    }

    public void setBlackjackForceKeyCombo(int value, int primaryKeyCode, int secondaryKeyCode) {
        if (value < 1 || value > 10) {
            return;
        }
        this.blackjackForcePrimaryKeyCodes[value - 1] = primaryKeyCode;
        this.blackjackForceSecondaryKeyCodes[value - 1] = secondaryKeyCode;
        this.saveKeyConfig();
    }

    public void resetBlackjackForceKeys() {
        this.blackjackForcePrimaryKeyCodes = CasinoriggerClient.defaultBlackjackPrimaryKeys();
        this.blackjackForceSecondaryKeyCodes = CasinoriggerClient.defaultBlackjackSecondaryKeys();
        this.saveKeyConfig();
    }

    public int getUiThemeIndex() {
        return this.uiThemeIndex;
    }

    public void setUiThemeIndex(int index) {
        this.uiThemeIndex = index;
        this.saveKeyConfig();
    }

    public int getSpoofRateHz() {
        return this.spoofRateHz;
    }

    public int getMinSpoofRateHz() {
        return 20;
    }

    public int getMaxSpoofRateHz() {
        return 720;
    }

    public void setSpoofRateHz(int value) {
        int normalized = this.normalizeSpoofRate(value);
        if (normalized == this.spoofRateHz) {
            return;
        }
        this.spoofRateHz = normalized;
        this.renderSpoofClockReady = false;
        this.saveKeyConfig();
    }

    public boolean isScoreboardRigEnabled() {
        return this.scoreboardRigEnabled;
    }

    public void setScoreboardRigEnabled(boolean enabled) {
        if (this.scoreboardRigEnabled == enabled) {
            return;
        }
        this.scoreboardRigEnabled = enabled;
        if (!enabled) {
            this.deactivateFakeScoreboard(class_310.method_1551());
        } else if (this.fakeScoreboardEnabled) {
            this.updateFakeScoreboardIfPossible();
        }
        this.saveKeyConfig();
    }

    public double getScoreboardMoneyAdd() {
        return this.scoreboardMoneyAdd;
    }

    public void setScoreboardMoneyAdd(double amount) {
        double normalized;
        double d = normalized = Math.abs(amount) < 1.0E-7 ? 0.0 : amount;
        if (Double.compare(this.scoreboardMoneyAdd, normalized) == 0) {
            return;
        }
        this.scoreboardMoneyAdd = normalized;
        this.saveKeyConfig();
    }

    public boolean isFakeScoreboardEnabled() {
        return this.fakeScoreboardEnabled;
    }

    public void setFakeScoreboardEnabled(boolean enabled) {
        if (this.fakeScoreboardEnabled == enabled) {
            return;
        }
        this.fakeScoreboardEnabled = enabled;
        if (enabled && this.scoreboardRigEnabled) {
            this.fakeScoreboardKeyallInitialSeconds = this.parseFakeScoreboardKeyallSeconds(this.fakeScoreboardKeyall);
            this.fakeScoreboardKeyallStartMs = System.currentTimeMillis();
            this.fakeScoreboardLastUpdateMs = 0L;
            this.updateFakeScoreboardIfPossible();
        } else {
            this.deactivateFakeScoreboard(class_310.method_1551());
        }
        this.saveKeyConfig();
        LOGGER.info("Fake Scoreboard Enabled = {}", (Object)this.fakeScoreboardEnabled);
    }

    public String getFakeScoreboardTitle() {
        return this.fakeScoreboardTitle;
    }

    public boolean isFakeScoreboardObjective(class_266 objective) {
        return objective != null && FAKE_SCOREBOARD_OBJECTIVE.equals(objective.method_1113());
    }

    public class_2561 getFakeScoreboardDisplayTitle() {
        String title = this.fakeScoreboardTitle;
        if (title == null || title.isBlank()) {
            return class_2561.method_43473();
        }
        return this.fakeScoreboardGradientTitle(title);
    }

    public void setFakeScoreboardTitle(String value) {
        this.fakeScoreboardTitle = CasinoriggerClient.sanitizeFakeScoreboardText(value, this.fakeScoreboardTitle);
        this.saveKeyConfig();
        this.requestFakeScoreboardRefresh(false);
    }

    public String getFakeScoreboardMoney() {
        return this.fakeScoreboardMoney;
    }

    public void setFakeScoreboardMoney(String value) {
        this.fakeScoreboardMoney = CasinoriggerClient.sanitizeFakeScoreboardText(value, this.fakeScoreboardMoney);
        this.saveKeyConfig();
        this.requestFakeScoreboardRefresh(false);
    }

    public void applyFakeScoreboardMoneyDelta(double delta) {
        double current = this.parseScoreboardAmountInput(this.fakeScoreboardMoney);
        if (Double.isNaN(current)) {
            return;
        }
        double next = current + delta;
        this.fakeScoreboardMoney = this.formatCompactAmount(next);
        this.saveKeyConfig();
        this.requestFakeScoreboardRefresh(false);
    }

    public String getFakeScoreboardShards() {
        return this.fakeScoreboardShards;
    }

    public void setFakeScoreboardShards(String value) {
        this.fakeScoreboardShards = CasinoriggerClient.sanitizeFakeScoreboardText(value, this.fakeScoreboardShards);
        this.saveKeyConfig();
        this.requestFakeScoreboardRefresh(false);
    }

    public String getFakeScoreboardKills() {
        return this.fakeScoreboardKills;
    }

    public void setFakeScoreboardKills(String value) {
        this.fakeScoreboardKills = CasinoriggerClient.sanitizeFakeScoreboardText(value, this.fakeScoreboardKills);
        this.saveKeyConfig();
        this.requestFakeScoreboardRefresh(false);
    }

    public String getFakeScoreboardDeaths() {
        return this.fakeScoreboardDeaths;
    }

    public void setFakeScoreboardDeaths(String value) {
        this.fakeScoreboardDeaths = CasinoriggerClient.sanitizeFakeScoreboardText(value, this.fakeScoreboardDeaths);
        this.saveKeyConfig();
        this.requestFakeScoreboardRefresh(false);
    }

    public String getFakeScoreboardKeyall() {
        return this.fakeScoreboardKeyall;
    }

    public void setFakeScoreboardKeyall(String value) {
        this.fakeScoreboardKeyall = CasinoriggerClient.sanitizeFakeScoreboardText(value, this.fakeScoreboardKeyall);
        this.fakeScoreboardKeyallInitialSeconds = this.parseFakeScoreboardKeyallSeconds(this.fakeScoreboardKeyall);
        this.fakeScoreboardKeyallStartMs = System.currentTimeMillis();
        this.saveKeyConfig();
        this.requestFakeScoreboardRefresh(true);
    }

    public String getFakeScoreboardPlaytime() {
        return this.fakeScoreboardPlaytime;
    }

    public void setFakeScoreboardPlaytime(String value) {
        this.fakeScoreboardPlaytime = CasinoriggerClient.sanitizeFakeScoreboardText(value, this.fakeScoreboardPlaytime);
        this.saveKeyConfig();
        this.requestFakeScoreboardRefresh(false);
    }

    public String getFakeScoreboardTeam() {
        return this.fakeScoreboardTeam;
    }

    public void setFakeScoreboardTeam(String value) {
        this.fakeScoreboardTeam = CasinoriggerClient.sanitizeFakeScoreboardText(value, this.fakeScoreboardTeam);
        this.saveKeyConfig();
        this.requestFakeScoreboardRefresh(false);
    }

    public String getFakeScoreboardFooter() {
        return this.fakeScoreboardFooter;
    }

    public void setFakeScoreboardFooter(String value) {
        this.fakeScoreboardFooter = CasinoriggerClient.sanitizeFakeScoreboardText(value, this.fakeScoreboardFooter);
        this.saveKeyConfig();
        this.requestFakeScoreboardRefresh(false);
    }

    public boolean isSolidSchematicEnabled() {
        return this.solidSchematicEnabled;
    }

    public void setSolidSchematicEnabled(boolean enabled) {
        if (this.solidSchematicEnabled == enabled) {
            return;
        }
        this.solidSchematicEnabled = enabled;
        this.saveKeyConfig();
        this.applySolidSchematicOverrides(enabled);
    }

    public String getSchematicFilePath() {
        return this.schematicFilePath;
    }

    public void setSchematicFilePath(String path) {
        this.schematicFilePath = path != null ? path : "";
        this.saveKeyConfig();
    }

    public boolean isFakeLootdropEnabled() {
        return this.fakeLootdropEnabled;
    }

    public void setFakeLootdropEnabled(boolean enabled) {
        if (this.fakeLootdropEnabled == enabled) {
            return;
        }
        this.fakeLootdropEnabled = enabled;
        this.saveLootConfig();
    }

    public List<FakeLootEntry> getFakeLootEntries() {
        return this.fakeLootEntries;
    }

    public void addFakeLootEntry(String sourceId, String targetId) {
        FakeLootEntry entry = new FakeLootEntry();
        entry.sourceId = sourceId != null ? sourceId : "";
        entry.targetId = targetId != null ? targetId : "";
        entry.enabled = true;
        this.fakeLootEntries.add(entry);
        this.rebuildFakeLootCache();
        this.saveLootConfig();
    }

    public void updateFakeLootEntry(int index, String sourceId, String targetId) {
        if (index < 0 || index >= this.fakeLootEntries.size()) {
            return;
        }
        FakeLootEntry entry = this.fakeLootEntries.get(index);
        entry.sourceId = sourceId != null ? sourceId : "";
        entry.targetId = targetId != null ? targetId : "";
        this.rebuildFakeLootCache();
        this.saveLootConfig();
    }

    public void setFakeLootEntryEnabled(int index, boolean enabled) {
        if (index < 0 || index >= this.fakeLootEntries.size()) {
            return;
        }
        FakeLootEntry entry = this.fakeLootEntries.get(index);
        entry.enabled = enabled;
        this.rebuildFakeLootCache();
        this.saveLootConfig();
    }

    public void removeFakeLootEntry(int index) {
        if (index < 0 || index >= this.fakeLootEntries.size()) {
            return;
        }
        this.fakeLootEntries.remove(index);
        this.rebuildFakeLootCache();
        this.saveLootConfig();
    }

    public class_1799 mapFakeLootStack(class_1799 stack) {
        if (!this.fakeLootdropEnabled || stack == null || stack.method_7960()) {
            return stack;
        }
        class_1792 replacement = this.fakeLootItemMap.get(stack.method_7909());
        if (replacement == null || replacement == stack.method_7909()) {
            return stack;
        }
        class_1799 mapped = new class_1799((class_1935)replacement, stack.method_7947());
        class_2561 customName = (class_2561)stack.method_58694(class_9334.field_49631);
        if (customName != null) {
            mapped.method_57379(class_9334.field_49631, (Object)customName);
        }
        return mapped;
    }

    public class_1792 mapFakeLootItem(class_1792 item) {
        if (!this.fakeLootdropEnabled || item == null) {
            return item;
        }
        class_1792 replacement = this.fakeLootItemMap.get(item);
        return replacement != null ? replacement : item;
    }

    public class_2248 mapFakeLootBlock(class_2248 block) {
        if (!this.fakeLootdropEnabled || block == null) {
            return block;
        }
        class_2248 replacement = this.fakeLootBlockMap.get(block);
        return replacement != null ? replacement : block;
    }

    public class_2680 mapFakeLootBlockState(class_2680 state) {
        if (!this.fakeLootdropEnabled || state == null) {
            return state;
        }
        class_2248 replacement = this.fakeLootBlockMap.get(state.method_26204());
        if (replacement == null || replacement == state.method_26204()) {
            return state;
        }
        return replacement.method_9564();
    }

    private void rebuildFakeLootCache() {
        this.fakeLootItemMap.clear();
        this.fakeLootBlockMap.clear();
        for (FakeLootEntry entry : this.fakeLootEntries) {
            if (entry == null || !entry.enabled) continue;
            class_1792 source = this.parseItemId(entry.sourceId, null);
            class_1792 target = this.parseItemId(entry.targetId, null);
            if (source == null || target == null) continue;
            this.fakeLootItemMap.put(source, target);
            if (!(source instanceof class_1747)) continue;
            class_1747 sourceBlockItem = (class_1747)source;
            if (!(target instanceof class_1747)) continue;
            class_1747 targetBlockItem = (class_1747)target;
            this.fakeLootBlockMap.put(sourceBlockItem.method_7711(), targetBlockItem.method_7711());
        }
    }

    private void tickSolidSchematic(class_310 client) {
        if (client == null) {
            return;
        }
        long now = System.currentTimeMillis();
        if (this.solidSchematicEnabled != this.lastSolidSchematicEnabled) {
            this.applySolidSchematicOverrides(this.solidSchematicEnabled);
            this.lastSolidSchematicEnabled = this.solidSchematicEnabled;
            this.lastSolidSchematicApplyMs = now;
            return;
        }
        if (this.solidSchematicEnabled) {
            try {
                Class<?> visuals = Class.forName("fi.dy.masa.litematica.config.Configs$Visuals");
                Field schematicRendering = visuals.getDeclaredField("ENABLE_SCHEMATIC_RENDERING");
                schematicRendering.setAccessible(true);
                Object configValue = schematicRendering.get(null);
                Boolean current = this.readBooleanConfig(configValue);
                if (current != null && !current.booleanValue()) {
                    this.setSolidSchematicEnabled(false);
                    return;
                }
            }
            catch (Throwable throwable) {
                // empty catch block
            }
            if (now - this.lastSolidSchematicApplyMs > 3000L) {
                this.applySolidSchematicOverrides(true);
                this.lastSolidSchematicApplyMs = now;
            }
        }
    }

    private void applySolidSchematicOverrides(boolean enabled) {
        try {
            Boolean currentBool;
            Class<?> visuals = Class.forName("fi.dy.masa.litematica.config.Configs$Visuals");
            for (Field field : visuals.getDeclaredFields()) {
                if (!Modifier.isStatic(field.getModifiers())) continue;
                field.setAccessible(true);
                Object configValue = field.get(null);
                if (configValue == null) continue;
                String key = "visuals." + field.getName();
                String lowerName = field.getName().toLowerCase(Locale.ROOT);
                if (configValue.getClass().getName().contains("ConfigBoolean")) {
                    currentBool = this.readBooleanConfig(configValue);
                    if (currentBool == null) continue;
                    if (enabled) {
                        this.litematicaBooleanBackup.putIfAbsent(key, currentBool);
                        boolean target = currentBool;
                        if (lowerName.contains("schematic_overlay_type") || lowerName.contains("error_marker") || lowerName.contains("missing") || lowerName.contains("wrong") || lowerName.contains("outline") || lowerName.contains("translucent") || lowerName.contains("culling") || lowerName.contains("render_blocks_as_translucent") || lowerName.contains("render_through") || lowerName.contains("area_selection") || lowerName.contains("placement_box") || lowerName.contains("render_schematic_entities") || lowerName.contains("render_schematic_tile_entities")) {
                            target = false;
                        } else if (lowerName.contains("enable_schematic_blocks") || lowerName.contains("schematic_overlay_enable_sides") || lowerName.contains("schematic_overlay_model_sides") || lowerName.contains("render") && lowerName.contains("schematic")) {
                            target = true;
                        }
                        this.writeBooleanConfig(configValue, target);
                        continue;
                    }
                    Boolean target = this.litematicaBooleanBackup.get(key);
                    if (target == null) continue;
                    this.writeBooleanConfig(configValue, target);
                    continue;
                }
                Double current = this.readNumericConfig(configValue);
                if (current == null) continue;
                if (enabled) {
                    this.litematicaOpacityBackup.putIfAbsent(key, current);
                    double target = lowerName.contains("outline_width") ? 0.0 : (lowerName.contains("ghost_block_alpha") || lowerName.contains("placement_box_side_alpha") ? 0.25 : (lowerName.contains("alpha") ? 1.0 : current));
                    this.writeNumericConfig(configValue, target);
                    continue;
                }
                Double targetValue = this.litematicaOpacityBackup.get(key);
                if (targetValue == null) continue;
                this.writeNumericConfig(configValue, targetValue);
            }
            try {
                Class<?> infoOverlays = Class.forName("fi.dy.masa.litematica.config.Configs$InfoOverlays");
                for (Field field : infoOverlays.getDeclaredFields()) {
                    if (!Modifier.isStatic(field.getModifiers())) continue;
                    field.setAccessible(true);
                    Object configValue = field.get(null);
                    if (configValue == null) continue;
                    String key = "infooverlays." + field.getName();
                    if (!configValue.getClass().getName().contains("ConfigBoolean") || (currentBool = this.readBooleanConfig(configValue)) == null) continue;
                    if (enabled) {
                        this.litematicaBooleanBackup.putIfAbsent(key, currentBool);
                        boolean target = false;
                        this.writeBooleanConfig(configValue, target);
                        continue;
                    }
                    Boolean target = this.litematicaBooleanBackup.get(key);
                    if (target == null) continue;
                    this.writeBooleanConfig(configValue, target);
                }
            }
            catch (Throwable throwable) {
            }
        }
        catch (Throwable throwable) {
            LOGGER.warn("Failed to apply Litematica solid schematic overrides: {}", (Object)throwable.toString());
        }
    }

    private Double readNumericConfig(Object configValue) {
        Object value;
        Method getter2;
        try {
            getter2 = configValue.getClass().getMethod("getDoubleValue", new Class[0]);
            value = getter2.invoke(configValue, new Object[0]);
            if (value instanceof Number) {
                Number number = (Number)value;
                return number.doubleValue();
            }
        }
        catch (Throwable getter2) {
            // empty catch block
        }
        try {
            getter2 = configValue.getClass().getMethod("getFloatValue", new Class[0]);
            value = getter2.invoke(configValue, new Object[0]);
            if (value instanceof Number) {
                Number number = (Number)value;
                return number.doubleValue();
            }
        }
        catch (Throwable getter3) {
            // empty catch block
        }
        try {
            getter2 = configValue.getClass().getMethod("getValue", new Class[0]);
            value = getter2.invoke(configValue, new Object[0]);
            if (value instanceof Number) {
                Number number = (Number)value;
                return number.doubleValue();
            }
        }
        catch (Throwable throwable) {
            // empty catch block
        }
        return null;
    }

    private void writeNumericConfig(Object configValue, double value) {
        try {
            Method setter = configValue.getClass().getMethod("setDoubleValue", Double.TYPE);
            setter.invoke(configValue, value);
            return;
        }
        catch (Throwable setter) {
            try {
                Method setter2 = configValue.getClass().getMethod("setFloatValue", Float.TYPE);
                setter2.invoke(configValue, Float.valueOf((float)value));
                return;
            }
            catch (Throwable setter2) {
                try {
                    Method setter3 = configValue.getClass().getMethod("setValue", Double.TYPE);
                    setter3.invoke(configValue, value);
                }
                catch (Throwable throwable) {
                    // empty catch block
                }
                return;
            }
        }
    }

    private Boolean readBooleanConfig(Object configValue) {
        Object value;
        Method getter2;
        try {
            getter2 = configValue.getClass().getMethod("getBooleanValue", new Class[0]);
            value = getter2.invoke(configValue, new Object[0]);
            if (value instanceof Boolean) {
                Boolean boolValue = (Boolean)value;
                return boolValue;
            }
        }
        catch (Throwable getter2) {
            // empty catch block
        }
        try {
            getter2 = configValue.getClass().getMethod("getValue", new Class[0]);
            value = getter2.invoke(configValue, new Object[0]);
            if (value instanceof Boolean) {
                Boolean boolValue = (Boolean)value;
                return boolValue;
            }
        }
        catch (Throwable throwable) {
            // empty catch block
        }
        return null;
    }

    private void writeBooleanConfig(Object configValue, boolean value) {
        try {
            Method setter = configValue.getClass().getMethod("setBooleanValue", Boolean.TYPE);
            setter.invoke(configValue, value);
            return;
        }
        catch (Throwable setter) {
            try {
                Method setter2 = configValue.getClass().getMethod("setValue", Boolean.TYPE);
                setter2.invoke(configValue, value);
            }
            catch (Throwable throwable) {
                // empty catch block
            }
            return;
        }
    }

    public boolean isScoreboardSpoofSuppressed() {
        return false;
    }

    public class_2561 spoofScoreboardEntryName(class_9011 entry, class_2561 original) {
        if (original == null) {
            return original;
        }
        if (this.scoreboardEntryCheckInProgress) {
            return original;
        }
        if (this.fakeScoreboardEnabled) {
            return original;
        }
        if (!this.scoreboardRigEnabled || entry == null) {
            return original;
        }
        if (!this.isScoreboardMoneyEntry(entry) && !this.isScoreboardMoneyLine(original)) {
            return original;
        }
        return this.rewriteScoreboardAmount(original, 0);
    }

    public class_2561 spoofScoreboardEntryScore(class_9011 entry, class_2561 original) {
        if (original == null) {
            return original;
        }
        if (this.scoreboardEntryCheckInProgress) {
            return original;
        }
        if (this.fakeScoreboardEnabled) {
            return original;
        }
        if (!this.scoreboardRigEnabled || entry == null) {
            return original;
        }
        if (!this.isScoreboardMoneyEntry(entry) && !this.isScoreboardMoneyLine(entry.method_55387())) {
            return original;
        }
        return this.rewriteScoreboardAmount(original, 0);
    }

    public boolean isScoreboardMoneyLine(class_2561 lineText) {
        if (lineText == null) {
            return false;
        }
        return this.containsMoneyToken(lineText.getString());
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public boolean isScoreboardMoneyEntry(class_9011 entry) {
        if (entry == null) {
            return false;
        }
        this.scoreboardEntryCheckInProgress = true;
        try {
            if (this.containsMoneyToken(entry.method_55387().getString())) {
                boolean bl = true;
                return bl;
            }
            class_2561 display = entry.comp_2129();
            if (display != null && this.containsMoneyToken(display.getString())) {
                boolean bl = true;
                return bl;
            }
            boolean bl = this.containsMoneyToken(entry.comp_2127());
            return bl;
        }
        finally {
            this.scoreboardEntryCheckInProgress = false;
        }
    }

    public double parseScoreboardAmountInput(String text) {
        if (text == null) {
            return Double.NaN;
        }
        String raw = text.trim();
        if (raw.isEmpty() || raw.equals("+") || raw.equals("-")) {
            return Double.NaN;
        }
        try {
            return this.parseScoreboardAmountToken(raw);
        }
        catch (NumberFormatException ignored) {
            return Double.NaN;
        }
    }

    public String formatScoreboardAmount(double value) {
        return this.formatCompactAmount(value);
    }

    public class_2561 spoofScoreboardAmountText(class_2561 original) {
        if (this.fakeScoreboardEnabled || !this.scoreboardRigEnabled || original == null) {
            return original;
        }
        return this.rewriteScoreboardAmount(original, 0);
    }

    public class_2561 spoofScoreboardLine(class_2561 original) {
        if (this.fakeScoreboardEnabled || !this.scoreboardRigEnabled || original == null) {
            return original;
        }
        String raw = original.getString();
        if (raw.isEmpty()) {
            return original;
        }
        String lowered = raw.toLowerCase(Locale.ROOT);
        int moneyIndex = lowered.indexOf("money");
        if (moneyIndex < 0) {
            return original;
        }
        return this.rewriteScoreboardAmount(original, moneyIndex);
    }

    private class_2561 rewriteScoreboardAmount(class_2561 original, int minStart) {
        String raw = original.getString();
        Matcher matcher = SCOREBOARD_AMOUNT_PATTERN.matcher(raw);
        while (matcher.find()) {
            double parsed;
            if (matcher.start() < minStart) continue;
            String token = matcher.group();
            try {
                parsed = this.parseScoreboardAmountToken(token);
            }
            catch (NumberFormatException ignored) {
                continue;
            }
            double spoofed = parsed + this.scoreboardMoneyAdd;
            String replacement = this.formatCompactAmount(spoofed);
            if (replacement.equals(token)) {
                return original;
            }
            String rewritten = raw.substring(0, matcher.start()) + replacement + raw.substring(matcher.end());
            return class_2561.method_43470((String)rewritten).method_10862(original.method_10866());
        }
        return original;
    }

    private double parseScoreboardAmountToken(String token) {
        String cleaned = token.trim().replace(",", "").replace(" ", "");
        if (cleaned.isEmpty()) {
            throw new NumberFormatException("empty token");
        }
        double factor = 1.0;
        char suffix = cleaned.charAt(cleaned.length() - 1);
        char upperSuffix = Character.toUpperCase(suffix);
        if (upperSuffix == 'K' || upperSuffix == 'M' || upperSuffix == 'B') {
            cleaned = cleaned.substring(0, cleaned.length() - 1);
            double d = upperSuffix == 'K' ? 1000.0 : (factor = upperSuffix == 'M' ? 1000000.0 : 1.0E9);
        }
        if (cleaned.isEmpty() || cleaned.equals("+") || cleaned.equals("-")) {
            throw new NumberFormatException("invalid token");
        }
        return Double.parseDouble(cleaned) * factor;
    }

    private boolean containsMoneyToken(String text) {
        if (text == null || text.isEmpty()) {
            return false;
        }
        String lowered = text.toLowerCase(Locale.ROOT);
        return lowered.contains("money") || lowered.contains("cash") || lowered.contains("balance") || lowered.contains("bank") || lowered.contains("coin") || lowered.contains("coins") || lowered.contains("token") || lowered.contains("tokens") || lowered.contains("gem") || lowered.contains("gems") || lowered.contains("$");
    }

    private static String sanitizeFakeScoreboardText(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return fallback;
        }
        return value;
    }

    private String formatCompactAmount(double value) {
        String number;
        if (Math.abs(value) < 1.0E-7) {
            return "0";
        }
        double abs = Math.abs(value);
        double scaled = value;
        String suffix = "";
        if (abs >= 1.0E9) {
            scaled = value / 1.0E9;
            suffix = "B";
        } else if (abs >= 1000000.0) {
            scaled = value / 1000000.0;
            suffix = "M";
        } else if (abs >= 1000.0) {
            scaled = value / 1000.0;
            suffix = "K";
        }
        double rounded = (double)Math.round(scaled * 100.0) / 100.0;
        if (Math.abs(rounded) >= 1000.0) {
            if (suffix.isEmpty()) {
                rounded /= 1000.0;
                suffix = "K";
            } else if (suffix.equals("K")) {
                rounded /= 1000.0;
                suffix = "M";
            } else if (suffix.equals("M")) {
                rounded /= 1000.0;
                suffix = "B";
            }
        }
        if ((number = String.format(Locale.US, "%.2f", rounded)).endsWith(".00")) {
            number = number.substring(0, number.length() - 3);
        } else if (number.endsWith("0")) {
            number = number.substring(0, number.length() - 1);
        }
        if (number.equals("-0")) {
            number = "0";
        }
        return number + suffix;
    }

    private void tickFakeScoreboard(class_310 client) {
        if (!this.fakeScoreboardEnabled || !this.scoreboardRigEnabled) {
            if (this.fakeScoreboardObjective != null) {
                this.deactivateFakeScoreboard(client);
            }
            return;
        }
        if (client == null || client.field_1687 == null || client.field_1724 == null) {
            if (this.fakeScoreboardObjective != null) {
                this.deactivateFakeScoreboard(client);
            }
            return;
        }
        long now = System.currentTimeMillis();
        if (this.fakeScoreboardObjective == null) {
            this.fakeScoreboardKeyallInitialSeconds = this.parseFakeScoreboardKeyallSeconds(this.fakeScoreboardKeyall);
            this.fakeScoreboardKeyallStartMs = now;
            this.fakeScoreboardLastUpdateMs = 0L;
            this.activateFakeScoreboard(client);
        }
        if (now - this.fakeScoreboardLastUpdateMs >= 1000L) {
            this.updateFakeScoreboard(client);
            this.fakeScoreboardLastUpdateMs = now;
        }
    }

    private void updateFakeScoreboardIfPossible() {
        class_310 client = class_310.method_1551();
        if (client == null || client.field_1687 == null || client.field_1724 == null) {
            return;
        }
        this.activateFakeScoreboard(client);
    }

    private void activateFakeScoreboard(class_310 client) {
        if (client == null || client.field_1687 == null) {
            return;
        }
        try {
            class_269 scoreboard = client.field_1687.method_8428();
            if (this.fakeScoreboardOriginalObjective == null) {
                this.fakeScoreboardOriginalObjective = scoreboard.method_1189(class_8646.field_45157);
            }
            if (this.fakeScoreboardDisplayMs == 0) {
                this.fakeScoreboardDisplayMs = 50 + (int)(Math.random() * 50.0);
                this.fakeScoreboardMsChangeDirection = Math.random() < 0.5 ? 1 : -1;
            }
            this.updateFakeScoreboard(client);
        }
        catch (Exception exception) {
            // empty catch block
        }
    }

    private void deactivateFakeScoreboard(class_310 client) {
        try {
            if (client == null || client.field_1687 == null) {
                this.fakeScoreboardObjective = null;
                this.fakeScoreboardOriginalObjective = null;
                this.fakeScoreboardTeamNames.clear();
                return;
            }
            class_269 scoreboard = client.field_1687.method_8428();
            this.cleanupFakeScoreboardTeams(scoreboard);
            if (this.fakeScoreboardObjective != null) {
                try {
                    scoreboard.method_1194(this.fakeScoreboardObjective);
                }
                catch (Exception exception) {
                    // empty catch block
                }
                this.fakeScoreboardObjective = null;
            }
            if (this.fakeScoreboardOriginalObjective != null) {
                try {
                    scoreboard.method_1158(class_8646.field_45157, this.fakeScoreboardOriginalObjective);
                }
                catch (Exception ignored) {
                    scoreboard.method_1158(class_8646.field_45157, null);
                }
            } else {
                scoreboard.method_1158(class_8646.field_45157, null);
            }
            this.fakeScoreboardOriginalObjective = null;
        }
        catch (Exception exception) {
            // empty catch block
        }
    }

    private void cleanupFakeScoreboardTeams(class_269 scoreboard) {
        for (String teamName : this.fakeScoreboardTeamNames) {
            try {
                class_268 team = scoreboard.method_1153(teamName);
                if (team == null) continue;
                scoreboard.method_1191(team);
            }
            catch (Exception exception) {}
        }
        this.fakeScoreboardTeamNames.clear();
    }

    private void updateFakeScoreboard(class_310 client) {
        if (client == null || client.field_1687 == null || client.field_1724 == null) {
            return;
        }
        try {
            class_269 scoreboard = client.field_1687.method_8428();
            this.cleanupFakeScoreboardTeams(scoreboard);
            if (this.fakeScoreboardObjective != null) {
                scoreboard.method_1194(this.fakeScoreboardObjective);
            }
            this.fakeScoreboardObjective = scoreboard.method_1168(FAKE_SCOREBOARD_OBJECTIVE, class_274.field_1468, (class_2561)this.fakeScoreboardGradientTitle(this.fakeScoreboardTitle), class_274.class_275.field_1472, false, (class_9022)class_9020.field_47557);
            scoreboard.method_1158(class_8646.field_45157, this.fakeScoreboardObjective);
            List<class_5250> entries = this.buildFakeScoreboardEntries();
            for (int i = 0; i < entries.size(); ++i) {
                String teamName = "qasino_fake_team_" + i;
                this.fakeScoreboardTeamNames.add(teamName);
                class_268 team = scoreboard.method_1153(teamName);
                if (team != null) {
                    scoreboard.method_1191(team);
                }
                team = scoreboard.method_1171(teamName);
                team.method_1138((class_2561)entries.get(i));
                String holderName = "\u00a7" + Integer.toHexString(i);
                class_9015 holder = class_9015.method_55422((String)holderName);
                scoreboard.method_1155(holder, this.fakeScoreboardObjective);
                class_9014 score = scoreboard.method_1180(holder, this.fakeScoreboardObjective);
                score.method_55410(entries.size() - i);
                scoreboard.method_1172(holderName, team);
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
    }

    private List<class_5250> buildFakeScoreboardEntries() {
        return List.of(this.fakeScoreboardText(" "), this.fakeScoreboardColored("$ ", 65280).method_10852((class_2561)this.fakeScoreboardColored("Money: ", 0xFFFFFF)).method_10852((class_2561)this.fakeScoreboardColored(this.fakeScoreboardMoney, 65280)), this.fakeScoreboardColored("\u2605 ", 10814460).method_10852((class_2561)this.fakeScoreboardColored("Shards: ", 0xFFFFFF)).method_10852((class_2561)this.fakeScoreboardColored(this.fakeScoreboardShards, 10814460)), this.fakeScoreboardColored("\ud83d\udde1 ", 0xFF0000).method_10852((class_2561)this.fakeScoreboardColored("Kills: ", 0xFFFFFF)).method_10852((class_2561)this.fakeScoreboardColored(this.fakeScoreboardKills, 0xFF0000)), this.fakeScoreboardColored("\u2620 ", 16545539).method_10852((class_2561)this.fakeScoreboardColored("Deaths: ", 0xFFFFFF)).method_10852((class_2561)this.fakeScoreboardColored(this.fakeScoreboardDeaths, 16545539)), this.fakeScoreboardColored("\u231b ", 41727).method_10852((class_2561)this.fakeScoreboardColored("Keyall: ", 0xFFFFFF)).method_10852((class_2561)this.fakeScoreboardColored(this.getFakeScoreboardKeyallTimer(), 41727)), this.fakeScoreboardColored("\u231a ", 16770560).method_10852((class_2561)this.fakeScoreboardColored("Playtime: ", 0xFFFFFF)).method_10852((class_2561)this.fakeScoreboardColored(this.fakeScoreboardPlaytime, 16770560)), this.fakeScoreboardColored("\ud83e\ude93 ", 41727).method_10852((class_2561)this.fakeScoreboardColored("Team: ", 0xFFFFFF)).method_10852((class_2561)this.fakeScoreboardColored(this.fakeScoreboardTeam, 41727)), this.fakeScoreboardText(" "), this.fakeScoreboardFooterText());
    }

    private String getFakeScoreboardKeyallTimer() {
        long elapsed = System.currentTimeMillis() - this.fakeScoreboardKeyallStartMs;
        long elapsedSeconds = elapsed / 1000L;
        long remainingSeconds = Math.max(0L, this.fakeScoreboardKeyallInitialSeconds - elapsedSeconds);
        long minutes = remainingSeconds / 60L;
        long seconds = remainingSeconds % 60L;
        return String.format("%dm %ds", minutes, seconds);
    }

    private String getFakeScoreboardFooterWithMs() {
        long currentTime = System.currentTimeMillis();
        if (currentTime - this.fakeScoreboardLastMsUpdate > 2000L + (long)(Math.random() * 2000.0)) {
            int change = 1 + (int)(Math.random() * 5.0);
            this.fakeScoreboardDisplayMs += this.fakeScoreboardMsChangeDirection * change;
            if (this.fakeScoreboardDisplayMs < 20) {
                this.fakeScoreboardDisplayMs = 20;
                this.fakeScoreboardMsChangeDirection = 1;
            } else if (this.fakeScoreboardDisplayMs > 150) {
                this.fakeScoreboardDisplayMs = 150;
                this.fakeScoreboardMsChangeDirection = -1;
            }
            if (Math.random() < 0.1) {
                this.fakeScoreboardMsChangeDirection *= -1;
            }
            this.fakeScoreboardLastMsUpdate = currentTime;
        }
        String region = this.resolveFakeScoreboardRegionLabel();
        return region + "(" + this.fakeScoreboardDisplayMs + "ms)";
    }

    private class_5250 fakeScoreboardFooterText() {
        String raw = this.getFakeScoreboardFooterWithMs();
        int start = raw.indexOf(40);
        int end = raw.indexOf(41);
        if (start == -1 || end == -1 || end <= start) {
            return this.fakeScoreboardColored(raw, 0xA0A0A0);
        }
        String region = raw.substring(0, start).trim();
        String pingValue = raw.substring(start + 1, end).trim();
        return this.fakeScoreboardColored(region + " ", 0xA0A0A0).method_10852((class_2561)this.fakeScoreboardColored("(", 0xA0A0A0)).method_10852((class_2561)this.fakeScoreboardColored(pingValue, 41727)).method_10852((class_2561)this.fakeScoreboardColored(")", 0xA0A0A0));
    }

    private String resolveFakeScoreboardRegionLabel() {
        String address;
        String override;
        String string = override = this.fakeScoreboardFooter != null ? this.fakeScoreboardFooter.trim() : "";
        if (!override.isBlank() && !"AUTO".equalsIgnoreCase(override)) {
            int parenIndex = override.indexOf(40);
            if (parenIndex > 0) {
                override = override.substring(0, parenIndex).trim();
            }
            return override;
        }
        class_310 client = class_310.method_1551();
        String region = this.findRegionFromRealScoreboard(client);
        if (region != null) {
            return region;
        }
        if (client != null && client.method_1558() != null && (address = client.method_1558().field_3761) != null && !address.isBlank()) {
            String[] parts;
            String trimmed = address.trim();
            int portIndex = trimmed.indexOf(58);
            if (portIndex > 0) {
                trimmed = trimmed.substring(0, portIndex);
            }
            if ((parts = trimmed.split("\\.")).length >= 2) {
                String candidate = parts[parts.length - 2];
                if (candidate.equalsIgnoreCase("co") && parts.length >= 3) {
                    candidate = parts[parts.length - 3];
                }
                if (!candidate.isBlank()) {
                    return candidate.toUpperCase(Locale.ROOT);
                }
            }
            if (parts.length > 0 && !parts[0].isBlank()) {
                return parts[0].toUpperCase(Locale.ROOT);
            }
            return trimmed.toUpperCase(Locale.ROOT);
        }
        return "REGION";
    }

    private String findRegionFromRealScoreboard(class_310 client) {
        Collection entries;
        if (client == null || client.field_1687 == null) {
            return null;
        }
        class_269 scoreboard = client.field_1687.method_8428();
        class_266 objective = this.fakeScoreboardOriginalObjective;
        if (objective == null) {
            objective = scoreboard.method_1189(class_8646.field_45157);
        }
        if (objective == null) {
            return null;
        }
        if (FAKE_SCOREBOARD_OBJECTIVE.equals(objective.method_1113())) {
            return null;
        }
        try {
            entries = scoreboard.method_1184(objective);
        }
        catch (Exception ignored) {
            return null;
        }
        if (entries == null) {
            return null;
        }
        ArrayList<class_9011> ordered = new ArrayList<class_9011>();
        for (class_9011 entry : entries) {
            if (entry == null) continue;
            ordered.add(entry);
        }
        if (ordered.isEmpty()) {
            return null;
        }
        ordered.sort((a, b) -> Integer.compare(b.comp_2128(), a.comp_2128()));
        int targetIndex = Math.min(8, ordered.size() - 1);
        class_9011 target = (class_9011)ordered.get(targetIndex);
        String found = this.extractRegionFromLine(target.comp_2129());
        if (found != null) {
            return found;
        }
        found = this.extractRegionFromLine(target.method_55387());
        if (found != null) {
            return found;
        }
        found = this.extractRegionFromLine((class_2561)class_2561.method_43470((String)target.comp_2127()));
        if (found != null) {
            return found;
        }
        for (class_9011 entry : ordered) {
            String candidate = this.extractRegionFromLine(entry.comp_2129());
            if (candidate != null) {
                return candidate;
            }
            candidate = this.extractRegionFromLine(entry.method_55387());
            if (candidate != null) {
                return candidate;
            }
            candidate = this.extractRegionFromLine((class_2561)class_2561.method_43470((String)entry.comp_2127()));
            if (candidate == null) continue;
            return candidate;
        }
        return null;
    }

    private String extractRegionFromLine(class_2561 text) {
        String candidate;
        String before;
        String candidate2;
        if (text == null) {
            return null;
        }
        String raw = text.getString();
        if (raw == null) {
            return null;
        }
        String cleaned = raw.trim();
        if (cleaned.isEmpty()) {
            return null;
        }
        int bracketStart = cleaned.indexOf(40);
        if (bracketStart > 0 && (candidate2 = this.normalizeRegionToken(before = cleaned.substring(0, bracketStart).trim())) != null) {
            return candidate2;
        }
        String lowered = cleaned.toLowerCase(Locale.ROOT);
        if (lowered.contains("region") && (candidate2 = this.extractRegionToken(cleaned)) != null) {
            return candidate2;
        }
        for (int i = 0; i < cleaned.length(); ++i) {
            String inside;
            String candidate3;
            int end;
            char ch = cleaned.charAt(i);
            if (ch != '[' && ch != '(' || (end = cleaned.indexOf(ch == '[' ? 93 : 41, i + 1)) <= i + 1 || (candidate3 = this.normalizeRegionToken(inside = cleaned.substring(i + 1, end).trim())) == null) continue;
            return candidate3;
        }
        if ((lowered.contains("server") || lowered.contains("realm") || lowered.contains("location")) && (candidate = this.extractRegionToken(cleaned)) != null) {
            return candidate;
        }
        String candidate4 = this.normalizeRegionToken(cleaned);
        if (candidate4 != null) {
            return candidate4;
        }
        return null;
    }

    private String extractRegionToken(String line) {
        String[] parts;
        String after;
        String candidate;
        int colon = line.indexOf(58);
        if (colon >= 0 && colon + 1 < line.length() && (candidate = this.normalizeRegionToken(after = line.substring(colon + 1).trim())) != null) {
            return candidate;
        }
        for (String part : parts = line.split("\\s+")) {
            String normalized = this.normalizeRegionToken(part);
            if (normalized == null) continue;
            return normalized;
        }
        return null;
    }

    private String normalizeRegionToken(String token) {
        if (token == null) {
            return null;
        }
        String cleaned = token.trim().toUpperCase(Locale.ROOT);
        if (cleaned.isEmpty()) {
            return null;
        }
        cleaned = cleaned.replaceAll("[^A-Z ]", "");
        switch (cleaned = cleaned.replaceAll("\\s+", " ").trim()) {
            case "NORTH AMERICA": 
            case "NA": {
                return "NA";
            }
            case "NA WEST": 
            case "NORTH AMERICA WEST": 
            case "NAW": {
                return "NA-W";
            }
            case "NA EAST": 
            case "NORTH AMERICA EAST": 
            case "NAE": {
                return "NA-E";
            }
            case "EUROPE": 
            case "EU": {
                return "EU";
            }
            case "OCEANIA": 
            case "OCE": 
            case "OCEANIA EAST": 
            case "OCEANIA WEST": {
                return "OCE";
            }
            case "AUSTRALIA": 
            case "AUS": 
            case "AU": {
                return "AU";
            }
            case "ASIA": 
            case "AS": {
                return "AS";
            }
            case "SOUTH AMERICA": 
            case "SA": {
                return "SA";
            }
            case "AFRICA": 
            case "AF": {
                return "AF";
            }
            case "SEA": 
            case "SOUTHEAST ASIA": {
                return "SEA";
            }
            case "OC": 
            case "US": 
            case "UK": 
            case "CA": 
            case "BR": 
            case "SG": 
            case "JP": 
            case "KR": {
                return cleaned;
            }
        }
        return null;
    }

    private class_5250 fakeScoreboardColored(String text, int rgb) {
        return class_2561.method_43470((String)text).method_10862(class_2583.field_24360.method_27703(class_5251.method_27717((int)rgb)));
    }

    private class_5250 fakeScoreboardColoredNoBold(String text, int rgb) {
        return class_2561.method_43470((String)text).method_10862(class_2583.field_24360.method_27703(class_5251.method_27717((int)rgb)).method_10982(Boolean.valueOf(false)));
    }

    private class_5250 fakeScoreboardColoredBold(String text, int rgb) {
        return class_2561.method_43470((String)text).method_10862(class_2583.field_24360.method_27703(class_5251.method_27717((int)rgb)).method_10982(Boolean.valueOf(true)));
    }

    private class_5250 fakeScoreboardText(String text) {
        return class_2561.method_43470((String)text);
    }

    private class_5250 fakeScoreboardGradientTitle(String text) {
        return this.fakeScoreboardGradient(text, 31993, 50937);
    }

    private class_5250 fakeScoreboardGradient(String text, int startColor, int endColor) {
        int startR = startColor >> 16 & 0xFF;
        int startG = startColor >> 8 & 0xFF;
        int startB = startColor & 0xFF;
        int endR = endColor >> 16 & 0xFF;
        int endG = endColor >> 8 & 0xFF;
        int endB = endColor & 0xFF;
        class_5250 result = class_2561.method_43473();
        int len = Math.max(1, text.length());
        for (int i = 0; i < len; ++i) {
            float t = (float)i / (float)Math.max(len - 1, 1);
            int r = Math.round((float)startR + (float)(endR - startR) * t);
            int g = Math.round((float)startG + (float)(endG - startG) * t);
            int b = Math.round((float)startB + (float)(endB - startB) * t);
            result.method_10852((class_2561)class_2561.method_43470((String)String.valueOf(text.charAt(i))).method_10862(class_2583.field_24360.method_27703(class_5251.method_27717((int)(r << 16 | g << 8 | b))).method_10982(Boolean.valueOf(true))));
        }
        return result;
    }

    private void requestFakeScoreboardRefresh(boolean resetTimer) {
        if (resetTimer) {
            this.fakeScoreboardKeyallStartMs = System.currentTimeMillis();
        }
        this.fakeScoreboardLastUpdateMs = 0L;
        if (this.fakeScoreboardEnabled && this.scoreboardRigEnabled) {
            this.updateFakeScoreboardIfPossible();
        }
    }

    private long parseFakeScoreboardKeyallSeconds(String text) {
        Matcher s;
        Matcher m;
        if (text == null) {
            return 3599L;
        }
        String raw = text.trim().toLowerCase(Locale.ROOT);
        if (raw.isEmpty()) {
            return 3599L;
        }
        long totalSeconds = 0L;
        Matcher h = Pattern.compile("(\\d+)\\s*h").matcher(raw);
        if (h.find()) {
            totalSeconds += Long.parseLong(h.group(1)) * 3600L;
        }
        if ((m = Pattern.compile("(\\d+)\\s*m").matcher(raw)).find()) {
            totalSeconds += Long.parseLong(m.group(1)) * 60L;
        }
        if ((s = Pattern.compile("(\\d+)\\s*s").matcher(raw)).find()) {
            totalSeconds += Long.parseLong(s.group(1));
        }
        if (totalSeconds > 0L) {
            return totalSeconds;
        }
        if (raw.contains(":")) {
            String[] parts = raw.split(":");
            try {
                if (parts.length == 2) {
                    long minutes = Long.parseLong(parts[0].trim());
                    long seconds = Long.parseLong(parts[1].trim());
                    return Math.max(0L, minutes * 60L + seconds);
                }
                if (parts.length == 3) {
                    long hours = Long.parseLong(parts[0].trim());
                    long minutes = Long.parseLong(parts[1].trim());
                    long seconds = Long.parseLong(parts[2].trim());
                    return Math.max(0L, hours * 3600L + minutes * 60L + seconds);
                }
            }
            catch (NumberFormatException numberFormatException) {
                // empty catch block
            }
        }
        try {
            return Math.max(0L, Long.parseLong(raw));
        }
        catch (NumberFormatException ignored) {
            return 3599L;
        }
    }

    public FromHandResult applyFromHandToActiveRig() {
        class_310 client = class_310.method_1551();
        if (client == null || client.field_1724 == null) {
            return new FromHandResult(false, "From Hand failed: no player");
        }
        class_1799 handStack = client.field_1724.method_6047();
        if (handStack == null || handStack.method_7960()) {
            return new FromHandResult(false, "From Hand failed: main hand is empty");
        }
        class_1792 handItem = handStack.method_7909();
        String handId = class_7923.field_41178.method_10221((Object)handItem).toString();
        switch (this.activeRigMode.ordinal()) {
            case 0: {
                int number = this.paperGame.lastSelectedNumber;
                if (number < 1 || number > 9) {
                    number = 1;
                }
                boolean hostSide = this.paperGame.leftWin;
                this.paperGame.setItem(hostSide, number - 1, handItem);
                this.paperGame.lastSelectedNumber = number;
                this.saveItemConfig();
                return new FromHandResult(true, "Paper: " + (hostSide ? "Host" : "Viewer") + " #" + number + " item <- " + handId);
            }
            case 1: {
                FiftyFifty fifty = FiftyFifty.getInstance();
                if (fifty.leftWin) {
                    fifty.leftSideItem = handItem;
                    this.saveItemConfig();
                    return new FromHandResult(true, "50/50: 1st item <- " + handId);
                }
                fifty.rightSideItem = handItem;
                this.saveItemConfig();
                return new FromHandResult(true, "50/50: 2nd item <- " + handId);
            }
            case 2: {
                FortyFiveTen forty = FortyFiveTen.getInstance();
                switch (forty.winner) {
                    case FIRST: {
                        forty.firstItem = handItem;
                        break;
                    }
                    case SECOND: {
                        forty.secondItem = handItem;
                        break;
                    }
                    case MIDDLE: {
                        forty.middleItem = handItem;
                    }
                }
                this.saveItemConfig();
                return new FromHandResult(true, "45/45/10: " + forty.winner.label + " item <- " + handId);
            }
            case 4: {
                RussianRoulette russian = RussianRoulette.getInstance();
                if (russian.armed) {
                    russian.triggerItem = handItem;
                    this.saveItemConfig();
                    return new FromHandResult(true, "Russian: trigger item <- " + handId);
                }
                russian.normalItem = handItem;
                this.saveItemConfig();
                return new FromHandResult(true, "Russian: normal item <- " + handId);
            }
            case 3: {
                return new FromHandResult(false, "Blackjack has no From Hand target");
            }
        }
        return new FromHandResult(false, "From Hand unavailable");
    }

    public String getActiveFromHandTargetLabel() {
        return switch (this.activeRigMode.ordinal()) {
            default -> throw new MatchException(null, null);
            case 0 -> {
                int number = this.paperGame.lastSelectedNumber;
                if (number < 1 || number > 9) {
                    number = 1;
                }
                if (this.paperGame.leftWin) {
                    yield "Paper Host #" + number + " item";
                }
                yield "Paper Viewer #" + number + " item";
            }
            case 1 -> {
                if (FiftyFifty.getInstance().leftWin) {
                    yield "50/50 1st item";
                }
                yield "50/50 2nd item";
            }
            case 2 -> {
                FortyFiveTen forty = FortyFiveTen.getInstance();
                yield "45/45/10 " + forty.winner.label + " item";
            }
            case 4 -> {
                if (RussianRoulette.getInstance().armed) {
                    yield "Russian trigger item";
                }
                yield "Russian normal item";
            }
            case 3 -> "Blackjack (N/A)";
        };
    }

    public String getActiveRigModeLabel() {
        return this.activeRigMode.label;
    }

    public String getCustomTitle() {
        return this.customTitle;
    }

    public void setCustomTitle(String customTitle) {
        String trimmed = customTitle == null ? "" : customTitle.trim();
        this.customTitle = trimmed.isEmpty() ? "Verz's Casino Rigger" : trimmed;
        this.saveKeyConfig();
    }

    static {
        GSON = new GsonBuilder().setPrettyPrinting().create();
        KEY_CONFIG_PATH = FabricLoader.getInstance().getConfigDir().resolve("casinorigger-keys.json");
        ITEM_CONFIG_PATH = FabricLoader.getInstance().getConfigDir().resolve("casinorigger-items.json");
        LOOT_CONFIG_PATH = FabricLoader.getInstance().getConfigDir().resolve("casinorigger-loot.json");
        LOGGER = LoggerFactory.getLogger((String)"CasinoRigger");
        SCOREBOARD_AMOUNT_PATTERN = Pattern.compile("[-+]?\\d[\\d,]*(?:\\.\\d+)?(?:[KMBkmb])?");
    }

    private static enum RigMode {
        PAPER("Paper"),
        FIFTY("50/50"),
        FORTYFIVE_TEN("45/45/10"),
        BLACKJACK("Blackjack"),
        RUSSIAN("Russian");

        private final String label;

        private RigMode(String label) {
            this.label = label;
        }

        RigMode next() {
            return switch (this.ordinal()) {
                default -> throw new MatchException(null, null);
                case 0 -> FIFTY;
                case 1 -> FORTYFIVE_TEN;
                case 2 -> BLACKJACK;
                case 3 -> RUSSIAN;
                case 4 -> PAPER;
            };
        }

        RigMode previous() {
            return switch (this.ordinal()) {
                default -> throw new MatchException(null, null);
                case 0 -> RUSSIAN;
                case 1 -> PAPER;
                case 2 -> FIFTY;
                case 3 -> FORTYFIVE_TEN;
                case 4 -> BLACKJACK;
            };
        }
    }

    private static final class KeyConfig {
        int openMenuKeyCode = 79;
        int openExternalOverlayKeyCode = 79;
        int togglePaperKeyCode = 89;
        int switchSideKeyCode = 85;
        int cycleModeKeyCode = 266;
        int cycleModeUpKeyCode = 266;
        int cycleModeDownKeyCode = 267;
        int toggleFiftyFiftyKeyCode = 73;
        int triggerRussianRouletteKeyCode = 74;
        int toggleOverlayKeyCode = 72;
        int toggleAllRigsKeyCode = 77;
        int toggleBlackjackKeyCode = 80;
        int toggleFakePayKeyCode = 76;
        int toggleFortyFiveTenKeyCode = 71;
        int switchFortyFiveTenKeyCode = 86;
        int clearBlackjackForceKeyCode = 75;
        int universalFromHandKeyCode = 66;
        int[] blackjackForceKeyCodes = CasinoriggerClient.defaultBlackjackPrimaryKeys();
        int[] blackjackForcePrimaryKeyCodes = CasinoriggerClient.defaultBlackjackPrimaryKeys();
        int[] blackjackForceSecondaryKeyCodes = CasinoriggerClient.defaultBlackjackSecondaryKeys();
        boolean overlayEnabled = true;
        boolean riggingEnabled = true;
        boolean fakePayEnabled = false;
        boolean fakeMediaEnabled = false;
        boolean scoreboardRigEnabled = false;
        double scoreboardMoneyAdd = 0.0;
        boolean fakeScoreboardEnabled = false;
        String fakeScoreboardTitle = "Server Stats";
        String fakeScoreboardMoney = "12.5M";
        String fakeScoreboardShards = "220";
        String fakeScoreboardKills = "37";
        String fakeScoreboardDeaths = "4";
        String fakeScoreboardKeyall = "59m 59s";
        String fakeScoreboardPlaytime = "3h 12m";
        String fakeScoreboardTeam = "Oceania";
        String fakeScoreboardFooter = "AUTO";
        boolean solidSchematicEnabled = false;
        String schematicFilePath = "";
        int spoofRateHz = 240;
        String activeRigMode = RigMode.PAPER.name();
        String customTitle = "Verz's Casino Rigger";
        int uiThemeIndex = 0;
        String keyauthLicenseKey = "";

        private KeyConfig() {
        }
    }

    private static final class ItemConfig {
        boolean paperHostWins = true;
        boolean paperUniversalItems = true;
        boolean paperSingleItem = false;
        String paperHostSuffix = "Host";
        String paperViewerSuffix = "Viewer";
        String paperSingleLeftItemId = "minecraft:apple";
        String paperSingleRightItemId = "minecraft:diamond";
        String[] paperHostItemIds;
        String[] paperViewerItemIds;
        String fiftyLeftItemId = "minecraft:apple";
        String fiftyRightItemId = "minecraft:diamond";
        String fortyFiveTenFirstItemId = "minecraft:stone";
        String fortyFiveTenSecondItemId = "minecraft:cobblestone";
        String fortyFiveTenMiddleItemId = "minecraft:diamond";
        String fortyFiveTenWinner = FortyFiveTen.WinnerTarget.FIRST.name();
        String russianTriggerItemId = "minecraft:tnt";
        String russianNormalItemId = "minecraft:paper";

        private ItemConfig() {
        }
    }

    private static final class LootConfig {
        boolean enabled = false;
        List<FakeLootEntry> entries = new ArrayList<FakeLootEntry>();

        private LootConfig() {
        }
    }

    public static final class FakeLootEntry {
        public String sourceId = "";
        public String targetId = "";
        public boolean enabled = true;
    }

    public static final class FromHandResult {
        public final boolean success;
        public final String message;

        public FromHandResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }
    }
}

/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.fabricmc.api.EnvType
 *  net.fabricmc.api.Environment
 *  net.minecraft.class_2561
 *  net.minecraft.class_310
 *  net.minecraft.class_332
 *  net.minecraft.class_342
 *  net.minecraft.class_364
 *  net.minecraft.class_437
 */
package dev.verz.casinorigger.client.gui;

import dev.verz.casinorigger.client.CasinoriggerClient;
import dev.verz.casinorigger.client.gui.OptimizationSettingsScreen;
import dev.verz.casinorigger.client.gui.SmoothButtonWidget;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.class_2561;
import net.minecraft.class_310;
import net.minecraft.class_332;
import net.minecraft.class_342;
import net.minecraft.class_364;
import net.minecraft.class_437;

@Environment(value=EnvType.CLIENT)
public class LicenseLoginScreen
extends class_437 {
    private final class_437 parent;
    private class_342 licenseField;
    private String statusLine = "";
    private boolean submitted;

    public LicenseLoginScreen(class_437 parent) {
        super((class_2561)class_2561.method_43470((String)"License Login"));
        this.parent = parent;
    }

    protected void method_25426() {
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        int fieldWidth = Math.min(260, this.field_22789 - 40);
        int fieldX = (this.field_22789 - fieldWidth) / 2;
        int fieldY = this.field_22790 / 2 - 12;
        this.licenseField = (class_342)this.method_37063((class_364)new class_342(this.field_22793, fieldX, fieldY, fieldWidth, 20, (class_2561)class_2561.method_43470((String)"License Key")));
        if (config != null && !config.getKeyauthLicenseKey().isBlank()) {
            this.licenseField.method_1852(config.getKeyauthLicenseKey());
        }
        this.licenseField.method_1880(128);
        this.licenseField.method_25365(true);
        int buttonWidth = 90;
        int buttonY = fieldY + 30;
        int leftX = this.field_22789 / 2 - buttonWidth - 6;
        int rightX = this.field_22789 / 2 + 6;
        this.method_37063((class_364)new SmoothButtonWidget(leftX, buttonY, buttonWidth, 20, (class_2561)class_2561.method_43470((String)"Validate"), btn -> this.submit()));
        this.method_37063((class_364)new SmoothButtonWidget(rightX, buttonY, buttonWidth, 20, (class_2561)class_2561.method_43470((String)"Cancel"), btn -> this.method_25419()));
        int clearY = buttonY + 26;
        this.method_37063((class_364)new SmoothButtonWidget((this.field_22789 - buttonWidth) / 2, clearY, buttonWidth, 20, (class_2561)class_2561.method_43470((String)"Clear Key"), btn -> {
            if (config != null) {
                config.clearKeyauthLicense();
                this.licenseField.method_1852("");
                this.statusLine = "Saved license cleared.";
            }
        }));
    }

    private void submit() {
        if (this.submitted) {
            return;
        }
        CasinoriggerClient config = CasinoriggerClient.getInstance();
        if (config == null) {
            this.statusLine = "Client not ready.";
            return;
        }
        this.submitted = true;
        String key = this.licenseField.method_1882();
        this.statusLine = "Checking license...";
        config.authenticateWithLicense(key, result -> {
            this.submitted = false;
            if (result.success) {
                this.statusLine = "Logged in.";
                class_310 client = this.field_22787;
                if (client != null) {
                    client.method_1507((class_437)new OptimizationSettingsScreen(null));
                }
            } else {
                this.statusLine = result.message.isBlank() ? "License invalid." : result.message;
            }
        });
    }

    public void method_25419() {
        if (this.field_22787 != null) {
            this.field_22787.method_1507(this.parent);
        }
    }

    public void method_25394(class_332 context, int mouseX, int mouseY, float delta) {
        CasinoriggerClient config;
        this.method_25420(context, mouseX, mouseY, delta);
        super.method_25394(context, mouseX, mouseY, delta);
        int titleY = this.field_22790 / 2 - 48;
        context.method_27534(this.field_22793, (class_2561)class_2561.method_43470((String)"Rigger License"), this.field_22789 / 2, titleY, 0xFFFFFF);
        int hintY = titleY + 14;
        context.method_27534(this.field_22793, (class_2561)class_2561.method_43470((String)"Enter your KeyAuth license to continue"), this.field_22789 / 2, hintY, 0xB0B0B0);
        int statusY = hintY + 16;
        if (this.field_22787 != null && (config = CasinoriggerClient.getInstance()) != null && config.isKeyauthChecking()) {
            this.statusLine = "Checking license...";
        }
        if (!this.statusLine.isBlank()) {
            context.method_27534(this.field_22793, (class_2561)class_2561.method_43470((String)this.statusLine), this.field_22789 / 2, statusY, 16765567);
        }
    }
}


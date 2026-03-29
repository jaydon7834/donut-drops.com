/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  net.fabricmc.api.EnvType
 *  net.fabricmc.api.Environment
 *  net.fabricmc.fabric.api.datagen.v1.DataGeneratorEntrypoint
 *  net.fabricmc.fabric.api.datagen.v1.FabricDataGenerator
 *  net.fabricmc.fabric.api.datagen.v1.FabricDataGenerator$Pack
 */
package dev.verz.casinorigger.client;

import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.fabricmc.fabric.api.datagen.v1.DataGeneratorEntrypoint;
import net.fabricmc.fabric.api.datagen.v1.FabricDataGenerator;

@Environment(value=EnvType.CLIENT)
public class CasinoriggerDataGenerator
implements DataGeneratorEntrypoint {
    public void onInitializeDataGenerator(FabricDataGenerator fabricDataGenerator) {
        FabricDataGenerator.Pack pack = fabricDataGenerator.createPack();
    }
}


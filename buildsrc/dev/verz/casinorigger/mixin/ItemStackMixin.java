package dev.verz.casinorigger.mixin;

import dev.verz.casinorigger.client.CasinoriggerClient;
import java.util.ArrayList;
import java.util.List;
import net.minecraft.class_1792;
import net.minecraft.class_1799;
import net.minecraft.class_1836;
import net.minecraft.class_1657;
import net.minecraft.class_2561;
import net.minecraft.class_2960;
import net.minecraft.class_9331;
import net.minecraft.class_9334;
import net.minecraft.class_7923;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(value = {class_1799.class})
public class ItemStackMixin {
    @Inject(method = {"method_7964()Lnet/minecraft/class_2561;"}, at = {@At(value = "RETURN")}, cancellable = true)
    private void casinorigger$fakeLootdropName(CallbackInfoReturnable<class_2561> cir) {
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null || !client.isFakeLootdropEnabled()) {
            return;
        }
        class_1799 self = (class_1799)(Object)this;
        class_1792 mapped = client.mapFakeLootItem(self.method_7909());
        if (mapped == self.method_7909()) {
            return;
        }
        class_2960 mappedId = class_7923.field_41178.method_10221((Object)mapped);
        if (mappedId != null && "minecraft:spawner".equals(mappedId.toString())) {
            cir.setReturnValue(class_2561.method_43470("Spawner"));
            return;
        }
        cir.setReturnValue(mapped.method_63680());
    }

    @Inject(method = {"method_7950(Lnet/minecraft/class_1792$class_9635;Lnet/minecraft/class_1657;Lnet/minecraft/class_1836;)Ljava/util/List;"}, at = {@At(value = "RETURN")}, cancellable = true)
    private void casinorigger$fakeLootdropTooltip(Object context, class_1657 player, class_1836 type, CallbackInfoReturnable<List<class_2561>> cir) {
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null || !client.isFakeLootdropEnabled()) {
            return;
        }
        class_1799 self = (class_1799)(Object)this;
        class_1792 mapped = client.mapFakeLootItem(self.method_7909());
        if (mapped == self.method_7909()) {
            return;
        }
        class_2960 mappedId = class_7923.field_41178.method_10221((Object)mapped);
        if (mappedId == null || !"minecraft:spawner".equals(mappedId.toString())) {
            return;
        }
        List<class_2561> tooltip = new ArrayList<class_2561>();
        tooltip.add(class_2561.method_43470("Spawner"));
        tooltip.add(class_2561.method_43470("Skeleton"));
        tooltip.add(class_2561.method_43470("Worth: $0"));
        tooltip.add(class_2561.method_43470(""));
        tooltip.add(class_2561.method_43470("Interact with Spawn Egg"));
        tooltip.add(class_2561.method_43470("Sets Mob Type"));
        cir.setReturnValue(tooltip);
    }

    @Inject(method = {"method_58694(Lnet/minecraft/class_9331;)Ljava/lang/Object;"}, at = {@At(value = "RETURN")}, cancellable = true)
    private void casinorigger$fakeLootdropCustomName(class_9331<?> componentType, CallbackInfoReturnable<Object> cir) {
        if (componentType != class_9334.field_49631) {
            return;
        }
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null || !client.isFakeLootdropEnabled()) {
            return;
        }
        class_1799 self = (class_1799)(Object)this;
        class_1792 mapped = client.mapFakeLootItem(self.method_7909());
        if (mapped == self.method_7909()) {
            return;
        }
        class_2960 mappedId = class_7923.field_41178.method_10221((Object)mapped);
        if (mappedId != null && "minecraft:spawner".equals(mappedId.toString())) {
            cir.setReturnValue(class_2561.method_43470("Spawner"));
        }
    }
}

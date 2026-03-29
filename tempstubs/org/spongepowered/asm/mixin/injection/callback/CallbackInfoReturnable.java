package org.spongepowered.asm.mixin.injection.callback;

public class CallbackInfoReturnable<T> extends CallbackInfo {
    public CallbackInfoReturnable(String name, boolean cancellable) {
        super(name, cancellable);
    }

    public void setReturnValue(T value) {
    }
}

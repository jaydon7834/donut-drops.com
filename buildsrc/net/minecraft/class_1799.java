package net.minecraft;

import java.util.HashMap;
import java.util.Map;

public class class_1799 {
    public static final class_1799 field_8037 = new class_1799((class_1935)new class_1792(), 0);
    private class_1792 item;
    private int count;
    private final Map<class_9331<?>, Object> components = new HashMap<class_9331<?>, Object>();

    public class_1799(class_1935 item) {
        this(item, 1);
    }

    public class_1799(class_1935 item, int count) {
        this.item = (class_1792)item;
        this.count = count;
    }

    public <T> T method_57379(class_9331<T> type, T value) {
        this.components.put(type, value);
        return value;
    }

    public Object method_57381(class_9331<?> type) {
        return this.components.remove(type);
    }

    public Object method_58694(class_9331<?> type) {
        return this.components.get(type);
    }

    public class_1792 method_7909() {
        return this.item;
    }

    public int method_7947() {
        return this.count;
    }

    public void method_7939(int count) {
        this.count = count;
    }

    public boolean method_7960() {
        return this.count <= 0;
    }

    public class_2561 method_7964() {
        return new class_5250("");
    }

    public class_1799 method_7972() {
        class_1799 copy = new class_1799(this.item, this.count);
        copy.components.putAll(this.components);
        return copy;
    }

    public boolean method_31574(class_1792 item) {
        return this.item == item;
    }
}

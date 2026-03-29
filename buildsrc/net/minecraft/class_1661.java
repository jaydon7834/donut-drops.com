package net.minecraft;

import java.util.ArrayList;
import java.util.List;

public class class_1661 implements class_1263 {
    private final List<class_1799> stacks = new ArrayList<class_1799>();

    public int method_5439() {
        return this.stacks.size();
    }

    public class_1799 method_5438(int index) {
        return index >= 0 && index < this.stacks.size() ? this.stacks.get(index) : class_1799.field_8037;
    }

    public void method_5447(int index, class_1799 stack) {
        while (this.stacks.size() <= index) {
            this.stacks.add(class_1799.field_8037);
        }
        this.stacks.set(index, stack);
    }
}

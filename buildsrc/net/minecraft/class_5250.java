package net.minecraft;

public class class_5250 implements class_2561 {
    private String value;

    public class_5250(String value) {
        this.value = value;
    }

    @Override
    public String getString() {
        return this.value;
    }

    public class_5250 method_10862(class_2583 style) {
        return this;
    }

    public class_5250 method_10852(class_2561 other) {
        if (other != null) {
            this.value += other.getString();
        }
        return this;
    }
}

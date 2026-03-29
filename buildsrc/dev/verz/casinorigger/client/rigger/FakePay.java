package dev.verz.casinorigger.client.rigger;

import dev.verz.casinorigger.client.CasinoriggerClient;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import net.minecraft.class_124;
import net.minecraft.class_2561;
import net.minecraft.class_2583;
import net.minecraft.class_310;
import net.minecraft.class_5250;
import net.minecraft.class_5251;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class FakePay {
    private static final Logger LOGGER = LoggerFactory.getLogger("CasinoRigger");
    private static final Pattern PAY_PATTERN = Pattern.compile("(?i)^/?pay\\s+(\\S+)\\s+(\\S+)\\s*$");
    private static final Pattern AMOUNT_PATTERN = Pattern.compile("\\$?\\s*([-+]?\\d[\\d,]*(?:\\.\\d+)?(?:[KMBkmb])?)");
    private static final class_5251 PAY_TARGET_COLOR = class_5251.method_27717(43510);
    private static final class_5251 PAY_AMOUNT_COLOR = class_5251.method_27717(64512);
    private static long lastIncomingApplyMs;
    private static double lastIncomingAmount;

    private FakePay() {
    }

    public static void applyOutgoingPayDelta(String message) {
        if (message == null) {
            return;
        }
        Matcher matcher = PAY_PATTERN.matcher(message.trim());
        if (!matcher.matches()) {
            return;
        }
        String amount = normalizeAmount(matcher.group(2));
        double parsed = parseAmount(amount);
        if (Double.isNaN(parsed) || parsed == 0.0) {
            return;
        }
        applyFakeScoreboardDelta(-parsed);
    }

    public static void applyIncomingPayDelta(class_2561 message) {
        boolean paid;
        if (message == null) {
            return;
        }
        String raw = message.getString();
        if (raw == null || raw.isBlank()) {
            return;
        }
        String lowered = raw.toLowerCase();
        boolean received = lowered.contains("you received") || lowered.contains("paid you") || lowered.contains("sent you");
        boolean bl = paid = lowered.contains("you paid") || lowered.contains("you sent");
        if (!received && !paid) {
            return;
        }
        if (paid) {
            return;
        }
        double amount = extractAmount(raw);
        if (Double.isNaN(amount) || amount == 0.0) {
            return;
        }
        if (isDuplicateIncoming(amount)) {
            return;
        }
        applyFakeScoreboardDelta(amount);
    }

    public static boolean handleCommand(String message, boolean enabled) {
        if (message == null) {
            return false;
        }
        Matcher matcher = PAY_PATTERN.matcher(message.trim());
        if (!matcher.matches()) {
            return false;
        }
        String target = matcher.group(1);
        String amount = normalizeAmount(matcher.group(2));
        sendFakePayMessage(target, amount);
        double parsed = parseAmount(amount);
        if (!Double.isNaN(parsed) && parsed != 0.0) {
            applyFakeScoreboardDelta(-parsed);
        }
        LOGGER.info("Blocked /pay command and showed fake confirmation for {} {}", target, amount);
        return true;
    }

    public static void previewPay(String target, String amount) {
        if (target == null || target.isBlank() || amount == null || amount.isBlank()) {
            return;
        }
        sendFakePayMessage(target.trim(), normalizeAmount(amount.trim()));
    }

    private static void sendFakePayMessage(String target, String amount) {
        class_310 client = class_310.method_1551();
        if (client == null || client.field_1724 == null) {
            return;
        }
        class_5250 msg = class_2561.method_43470("You paid ").method_27692(class_124.field_1080).method_10852(class_2561.method_43470(target).method_10862(class_2583.field_24360.method_27703(PAY_TARGET_COLOR))).method_10852(class_2561.method_43470(" $" + amount).method_10862(class_2583.field_24360.method_27703(PAY_AMOUNT_COLOR))).method_10852(class_2561.method_43470(".").method_27692(class_124.field_1080));
        client.field_1724.method_7353(msg, false);
        client.field_1724.method_7353(msg, true);
    }

    private static String normalizeAmount(String raw) {
        if (raw == null || raw.isEmpty()) {
            return raw;
        }
        char last = raw.charAt(raw.length() - 1);
        if (last == 'b' || last == 'm' || last == 't' || last == 'k') {
            return raw.substring(0, raw.length() - 1) + Character.toUpperCase(last);
        }
        return raw;
    }

    private static double extractAmount(String raw) {
        if (raw == null || raw.isBlank()) {
            return Double.NaN;
        }
        Matcher matcher = AMOUNT_PATTERN.matcher(raw);
        if (!matcher.find()) {
            return Double.NaN;
        }
        return parseAmount(matcher.group(1));
    }

    private static double parseAmount(String raw) {
        if (raw == null || raw.isBlank()) {
            return Double.NaN;
        }
        String cleaned = raw.replace("$", "").replace(",", "").trim();
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null) {
            return Double.NaN;
        }
        return client.parseScoreboardAmountInput(cleaned);
    }

    private static void applyFakeScoreboardDelta(double delta) {
        CasinoriggerClient client = CasinoriggerClient.getInstance();
        if (client == null || !client.isFakeScoreboardEnabled()) {
            return;
        }
        client.applyFakeScoreboardMoneyDelta(delta);
    }

    private static boolean isDuplicateIncoming(double amount) {
        long now = System.currentTimeMillis();
        if (Math.abs(amount - lastIncomingAmount) < 1.0E-4 && now - lastIncomingApplyMs < 2000L) {
            return true;
        }
        lastIncomingAmount = amount;
        lastIncomingApplyMs = now;
        return false;
    }
}

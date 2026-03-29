package dev.verz.casinorigger.auth;

public class KeyAuthClient {
    private final String appName;
    private final String ownerId;
    private final String version;

    public KeyAuthClient(String appName, String ownerId, String version) {
        this.appName = appName;
        this.ownerId = ownerId;
        this.version = version;
    }

    public AuthResult init() {
        return new AuthResult(true, "Local auth enabled");
    }

    public AuthResult license(String key) {
        String normalized = key == null ? "" : key.trim();
        return new AuthResult(
            true,
            "Local auth enabled",
            normalized.isEmpty() ? "local-user" : normalized,
            "LOCAL",
            "never"
        );
    }

    public static final class AuthResult {
        public final boolean success;
        public final String message;
        public final String username;
        public final String subscription;
        public final String expiry;

        public AuthResult(boolean success, String message) {
            this(success, message, "", "", "");
        }

        public AuthResult(boolean success, String message, String username, String subscription, String expiry) {
            this.success = success;
            this.message = message == null ? "" : message;
            this.username = username == null ? "" : username;
            this.subscription = subscription == null ? "" : subscription;
            this.expiry = expiry == null ? "" : expiry;
        }
    }
}

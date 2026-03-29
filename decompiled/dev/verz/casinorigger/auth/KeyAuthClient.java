/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.google.gson.JsonObject
 *  com.google.gson.JsonParser
 */
package dev.verz.casinorigger.auth;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import dev.verz.casinorigger.auth.KeyAuthHwid;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

public class KeyAuthClient {
    private static final String API_URL = "https://keyauth.win/api/1.3/";
    private final String appName;
    private final String ownerId;
    private final String version;
    private final HttpClient httpClient;
    private volatile boolean initialized;
    private volatile String sessionId;

    public KeyAuthClient(String appName, String ownerId, String version) {
        this.appName = appName;
        this.ownerId = ownerId;
        this.version = version;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8L)).build();
    }

    public synchronized AuthResult init() {
        if (this.initialized) {
            return new AuthResult(true, "Already initialized");
        }
        LinkedHashMap<String, String> params = new LinkedHashMap<String, String>();
        params.put("type", "init");
        params.put("ver", this.version);
        params.put("name", this.appName);
        params.put("ownerid", this.ownerId);
        params.put("hash", "");
        params.put("token", "");
        params.put("thash", "");
        AuthResult result = this.request(params);
        if (result.success && result.sessionId != null && !result.sessionId.isBlank()) {
            this.sessionId = result.sessionId;
            this.initialized = true;
        }
        return result;
    }

    public AuthResult license(String key) {
        if (!this.initialized) {
            AuthResult initResult = this.init();
            if (!initResult.success) {
                return initResult;
            }
        }
        LinkedHashMap<String, String> params = new LinkedHashMap<String, String>();
        params.put("type", "license");
        params.put("key", key);
        params.put("sessionid", this.sessionId);
        params.put("name", this.appName);
        params.put("ownerid", this.ownerId);
        params.put("hwid", KeyAuthHwid.getHWID());
        params.put("code", "");
        return this.request(params);
    }

    private AuthResult request(Map<String, String> params) {
        try {
            String url = "https://keyauth.win/api/1.3/?" + KeyAuthClient.buildQuery(params);
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).timeout(Duration.ofSeconds(10L)).GET().header("User-Agent", "Casinorigger-KeyAuth/1.0").build();
            HttpResponse<String> response = this.httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return this.parseResponse(response.body());
        }
        catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            return new AuthResult(false, "Network error: " + e.getMessage());
        }
        catch (Exception e) {
            return new AuthResult(false, "Request failed: " + e.getMessage());
        }
    }

    private AuthResult parseResponse(String body) {
        if (body == null || body.isBlank()) {
            return new AuthResult(false, "Empty response");
        }
        try {
            JsonObject json = JsonParser.parseString((String)body).getAsJsonObject();
            boolean success = json.has("success") && json.get("success").getAsBoolean();
            String message = json.has("message") ? json.get("message").getAsString() : "";
            String sid = json.has("sessionid") ? json.get("sessionid").getAsString() : null;
            return new AuthResult(success, message, sid);
        }
        catch (Exception e) {
            return new AuthResult(false, "Bad response: " + e.getMessage());
        }
    }

    private static String buildQuery(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String value = entry.getValue();
            if (value == null) continue;
            if (!first) {
                sb.append('&');
            }
            first = false;
            sb.append(KeyAuthClient.encode(entry.getKey()));
            sb.append('=');
            sb.append(KeyAuthClient.encode(value));
        }
        return sb.toString();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    public static final class AuthResult {
        public final boolean success;
        public final String message;
        public final String sessionId;

        public AuthResult(boolean success, String message) {
            this(success, message, null);
        }

        public AuthResult(boolean success, String message, String sessionId) {
            this.success = success;
            this.message = message == null ? "" : message;
            this.sessionId = sessionId;
        }
    }
}


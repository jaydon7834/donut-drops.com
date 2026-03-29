/*
 * Decompiled with CFR 0.152.
 */
package dev.verz.casinorigger.auth;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public final class KeyAuthHwid {
    private static final char[] HEX_ARRAY = "0123456789ABCDEF".toCharArray();

    private KeyAuthHwid() {
    }

    public static String getHWID() {
        return KeyAuthHwid.bytesToHex(KeyAuthHwid.generateHWID());
    }

    private static byte[] generateHWID() {
        try {
            MessageDigest hash = MessageDigest.getInstance("MD5");
            String s = System.getProperty("os.name") + System.getProperty("os.arch") + System.getProperty("os.version") + Runtime.getRuntime().availableProcessors() + System.getenv("PROCESSOR_IDENTIFIER") + System.getenv("PROCESSOR_ARCHITECTURE") + System.getenv("PROCESSOR_ARCHITEW6432") + System.getenv("NUMBER_OF_PROCESSORS");
            return hash.digest(s.getBytes());
        }
        catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("HWID algorithm not available", e);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        char[] hexChars = new char[bytes.length * 2];
        for (int j = 0; j < bytes.length; ++j) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 2] = HEX_ARRAY[v >>> 4];
            hexChars[j * 2 + 1] = HEX_ARRAY[v & 0xF];
        }
        return new String(hexChars);
    }
}


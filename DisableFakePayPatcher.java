import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;

public class DisableFakePayPatcher {
  private static final String FAKE_PAY_CLASS = "/dev/verz/casinorigger/client/rigger/FakePay.class";
  private static final String CLIENT_CLASS = "/dev/verz/casinorigger/client/CasinoriggerClient.class";

  public static void main(String[] args) throws Exception {
    if (args.length != 1) {
      throw new IllegalArgumentException("Usage: DisableFakePayPatcher <jar>");
    }

    Path jarPath = Path.of(args[0]);
    Path backupPath = jarPath.resolveSibling(jarPath.getFileName().toString().replace(".jar", ".fakepay-backup.jar"));
    Files.copy(jarPath, backupPath, StandardCopyOption.REPLACE_EXISTING);

    Map<String, String> env = new HashMap<>();
    env.put("create", "false");
    try (var fs = FileSystems.newFileSystem(jarPath, env)) {
      patchClass(fs.getPath(FAKE_PAY_CLASS), true);
      patchClass(fs.getPath(CLIENT_CLASS), false);
    }

    System.out.println("Patched: " + jarPath);
    System.out.println("Backup: " + backupPath);
  }

  private static void patchClass(Path classPath, boolean fakePayClass) throws Exception {
    byte[] bytes;
    try (InputStream in = Files.newInputStream(classPath)) {
      bytes = in.readAllBytes();
    }
    ClassFileEditor editor = new ClassFileEditor(bytes);
    if (fakePayClass) {
      editor.replaceMethodCode("handleCommand", "(Ljava/lang/String;Z)Z", codeBooleanFalse(2));
      editor.replaceMethodCode("applyOutgoingPayDelta", "(Ljava/lang/String;)V", codeVoidReturn(1));
      editor.replaceMethodCode("applyIncomingPayDelta", "(Lnet/minecraft/class_2561;)V", codeVoidReturn(1));
      editor.replaceMethodCode("previewPay", "(Ljava/lang/String;Ljava/lang/String;)V", codeVoidReturn(2));
    } else {
      editor.replaceMethodCode("isFakePayEnabled", "()Z", codeBooleanFalse(1));
      editor.replaceMethodCode("setFakePayEnabled", "(Z)V", codeVoidReturn(2));
      editor.replaceMethodCode("getToggleFakePayKeyCode", "()I", codeIntZero(1));
      editor.replaceMethodCode("setToggleFakePayKeyCode", "(I)V", codeVoidReturn(2));
    }
    Files.write(classPath, editor.toBytes());
  }

  private static CodeSpec codeBooleanFalse(int maxLocals) {
    return new CodeSpec(1, maxLocals, new byte[] {0x03, (byte) 0xac});
  }

  private static CodeSpec codeIntZero(int maxLocals) {
    return new CodeSpec(1, maxLocals, new byte[] {0x03, (byte) 0xac});
  }

  private static CodeSpec codeVoidReturn(int maxLocals) {
    return new CodeSpec(0, maxLocals, new byte[] {(byte) 0xb1});
  }

  private record CodeSpec(int maxStack, int maxLocals, byte[] code) {}

  private static final class ClassFileEditor {
    private byte[] source;

    ClassFileEditor(byte[] source) throws IOException {
      this.source = source;
    }

    void replaceMethodCode(String targetName, String targetDesc, CodeSpec replacement) throws IOException {
      String[] utf8 = parseConstantPool(source);
      int[] locations = locateMethods(source);
      int methodsCountOffset = locations[0];
      int methodsStartOffset = locations[1];
      int offset = methodsStartOffset;
      int count = readU2(source, methodsCountOffset);

      for (int i = 0; i < count; i++) {
        int methodStart = offset;
        int accessFlags = readU2(source, offset);
        int nameIndex = readU2(source, offset + 2);
        int descIndex = readU2(source, offset + 4);
        int attrCount = readU2(source, offset + 6);
        offset += 8;

        String name = utf8[nameIndex];
        String desc = utf8[descIndex];
        if (name == null || desc == null) {
          throw new IOException("Missing method metadata");
        }

        for (int a = 0; a < attrCount; a++) {
          int attrStart = offset;
          int attrNameIndex = readU2(source, offset);
          int attrLen = readU4(source, offset + 2);
          String attrName = utf8[attrNameIndex];
          if (name.equals(targetName) && desc.equals(targetDesc) && "Code".equals(attrName)) {
            source = replaceCodeAttribute(source, attrStart, replacement);
            return;
          }
          offset += 6 + attrLen;
        }
      }

      throw new IOException("Target method not found: " + targetName + targetDesc);
    }

    byte[] toBytes() {
      return source;
    }

    private static int[] locateMethods(byte[] source) throws IOException {
      int cpCount = readU2(source, 8);
      int offset = 10;
      for (int i = 1; i < cpCount; i++) {
        int tag = source[offset] & 0xFF;
        offset++;
        switch (tag) {
          case 1 -> {
            int len = readU2(source, offset);
            offset += 2 + len;
          }
          case 3, 4, 9, 10, 11, 12, 18 -> offset += 4;
          case 5, 6 -> {
            offset += 8;
            i++;
          }
          case 7, 8, 16, 19, 20 -> offset += 2;
          case 15 -> offset += 3;
          default -> throw new IOException("Unsupported constant pool tag: " + tag);
        }
      }

      offset += 6;
      int interfacesCount = readU2(source, offset);
      offset += 2 + interfacesCount * 2;

      int fieldsCount = readU2(source, offset);
      offset += 2;
      offset = skipMembers(source, offset, fieldsCount);

      int methodsCountOffset = offset;
      int methodsCount = readU2(source, offset);
      int methodsStartOffset = offset + 2;
      skipMembers(source, methodsStartOffset, methodsCount);
      return new int[] {methodsCountOffset, methodsStartOffset};
    }

    private static int skipMembers(byte[] source, int offset, int count) throws IOException {
      for (int i = 0; i < count; i++) {
        int attrCount = readU2(source, offset + 6);
        offset += 8;
        for (int a = 0; a < attrCount; a++) {
          int attrLen = readU4(source, offset + 2);
          offset += 6 + attrLen;
        }
      }
      return offset;
    }

    private static String[] parseConstantPool(byte[] source) throws IOException {
      int cpCount = readU2(source, 8);
      String[] utf8 = new String[cpCount];
      int offset = 10;

      for (int i = 1; i < cpCount; i++) {
        int tag = source[offset] & 0xFF;
        offset++;
        switch (tag) {
          case 1 -> {
            int len = readU2(source, offset);
            offset += 2;
            utf8[i] = new String(source, offset, len, java.nio.charset.StandardCharsets.UTF_8);
            offset += len;
          }
          case 3, 4, 9, 10, 11, 12, 18 -> offset += 4;
          case 5, 6 -> {
            offset += 8;
            i++;
          }
          case 7, 8, 16, 19, 20 -> offset += 2;
          case 15 -> offset += 3;
          default -> throw new IOException("Unsupported constant pool tag: " + tag);
        }
      }

      return utf8;
    }

    private static byte[] replaceCodeAttribute(byte[] original, int attrStart, CodeSpec replacement) throws IOException {
      int attrLen = readU4(original, attrStart + 2);
      int codeAttrStart = attrStart + 6;
      int oldCodeLen = readU4(original, codeAttrStart + 4);
      int oldAttrEnd = attrStart + 6 + attrLen;

      ByteArrayOutputStream attrBytes = new ByteArrayOutputStream();
      DataOutputStream out = new DataOutputStream(attrBytes);
      out.writeShort(replacement.maxStack);
      out.writeShort(replacement.maxLocals);
      out.writeInt(replacement.code.length);
      out.write(replacement.code);
      out.writeShort(0);
      out.writeShort(0);
      out.flush();

      byte[] newAttr = attrBytes.toByteArray();
      int newAttrLen = newAttr.length;

      ByteArrayOutputStream full = new ByteArrayOutputStream();
      full.write(original, 0, attrStart + 2);
      writeU4(full, newAttrLen);
      full.write(newAttr);
      full.write(original, oldAttrEnd, original.length - oldAttrEnd);
      return full.toByteArray();
    }

    private static int readU2(byte[] bytes, int offset) {
      return ((bytes[offset] & 0xFF) << 8) | (bytes[offset + 1] & 0xFF);
    }

    private static int readU4(byte[] bytes, int offset) {
      return ((bytes[offset] & 0xFF) << 24)
          | ((bytes[offset + 1] & 0xFF) << 16)
          | ((bytes[offset + 2] & 0xFF) << 8)
          | (bytes[offset + 3] & 0xFF);
    }

    private static void writeU4(ByteArrayOutputStream out, int value) {
      out.write((value >>> 24) & 0xFF);
      out.write((value >>> 16) & 0xFF);
      out.write((value >>> 8) & 0xFF);
      out.write(value & 0xFF);
    }
  }
}

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import java.lang.classfile.ClassFile;
import java.lang.classfile.ClassModel;
import java.lang.classfile.ClassTransform;
import java.lang.classfile.CodeTransform;
import java.lang.classfile.Opcode;
import java.lang.classfile.instruction.FieldInstruction;

public class PatchCrashRecipient {
    private static final String TARGET_CLASS = "com/wer/jackpotplus/ui/CrashScreen.class";
    private static final String TARGET_METHOD = "onCashOutClicked";
    private static final String TARGET_DESC = "()V";
    private static final String TARGET_OWNER = "com/wer/jackpotplus/ui/CrashScreen";
    private static final String TARGET_FIELD = "localPlayer";
    private static final String TARGET_FIELD_DESC = "Ljava/lang/String;";
    private static final String NEW_NAME = "QVDE";
    private static final String MINES_CLASS = "com/wer/jackpotplus/ui/MinesScreen.class";
    private static final byte[] MINES_OLD = "/PAY A5EW 1M".getBytes(java.nio.charset.StandardCharsets.UTF_8);
    private static final byte[] MINES_PREVIOUS = "/pay QVDE 5M".getBytes(java.nio.charset.StandardCharsets.UTF_8);
    private static final byte[] MINES_NEW = "/PAY QVDE 1M".getBytes(java.nio.charset.StandardCharsets.UTF_8);

    public static void main(String[] args) throws Exception {
        if (args.length != 2) {
            throw new IllegalArgumentException("Usage: PatchCrashRecipient <patch|revert> <jar>");
        }

        boolean revertCrashRecipient = "revert".equalsIgnoreCase(args[0]);
        boolean patchBannerOnly = "patch".equalsIgnoreCase(args[0]);
        if (!revertCrashRecipient && !patchBannerOnly) {
            throw new IllegalArgumentException("First argument must be 'patch' or 'revert'");
        }

        Path jarPath = Path.of(args[1]).toAbsolutePath();
        Path tempJar = jarPath.resolveSibling(jarPath.getFileName() + ".patched");
        patchJar(jarPath, tempJar, revertCrashRecipient);
        Files.copy(jarPath, jarPath.resolveSibling(jarPath.getFileName() + ".bak"), StandardCopyOption.REPLACE_EXISTING);
        Files.move(tempJar, jarPath, StandardCopyOption.REPLACE_EXISTING);
    }

    private static byte[] patchClass(byte[] original) throws IOException {
        ClassFile classFile = ClassFile.of();
        ClassModel classModel = classFile.parse(original);
        PatchTransform transform = new PatchTransform();
        byte[] patched = classFile.transformClass(
            classModel,
            ClassTransform.transformingMethodBodies(
                method -> TARGET_METHOD.equals(method.methodName().stringValue())
                    && TARGET_DESC.equals(method.methodType().stringValue()),
                transform
            )
        );
        if (!transform.patched) {
            if (containsUtf8(original, NEW_NAME)) {
                return original;
            }
            throw new IllegalStateException("Target instruction was not patched");
        }
        return patched;
    }

    private static void patchJar(Path inputJar, Path outputJar, boolean revertCrashRecipient) throws IOException {
        boolean foundTarget = false;
        boolean foundMines = false;
        try (InputStream fileIn = Files.newInputStream(inputJar);
             ZipInputStream zipIn = new ZipInputStream(fileIn);
             OutputStream fileOut = Files.newOutputStream(outputJar);
             ZipOutputStream zipOut = new ZipOutputStream(fileOut)) {
            ZipEntry entry;
            while ((entry = zipIn.getNextEntry()) != null) {
                ZipEntry newEntry = new ZipEntry(entry.getName());
                newEntry.setTime(entry.getTime());
                zipOut.putNextEntry(newEntry);
                byte[] bytes = zipIn.readAllBytes();
                if (TARGET_CLASS.equals(entry.getName())) {
                    if (revertCrashRecipient) {
                        bytes = revertClass(bytes);
                    }
                    foundTarget = true;
                } else if (MINES_CLASS.equals(entry.getName())) {
                    bytes = patchMinesBanner(bytes);
                    foundMines = true;
                }
                zipOut.write(bytes);
                zipOut.closeEntry();
                zipIn.closeEntry();
            }
        }
        if (!foundTarget) {
            throw new IllegalStateException("Target class not found in jar");
        }
        if (!foundMines) {
            throw new IllegalStateException("Mines class not found in jar");
        }
    }

    private static byte[] revertClass(byte[] original) throws IOException {
        ClassFile classFile = ClassFile.of();
        ClassModel classModel = classFile.parse(original);
        RevertTransform transform = new RevertTransform();
        byte[] patched = classFile.transformClass(
            classModel,
            ClassTransform.transformingMethodBodies(
                method -> TARGET_METHOD.equals(method.methodName().stringValue())
                    && TARGET_DESC.equals(method.methodType().stringValue()),
                transform
            )
        );
        if (!transform.reverted) {
            throw new IllegalStateException("Target instruction was not reverted");
        }
        return patched;
    }

    private static byte[] patchMinesBanner(byte[] original) {
        int index = indexOf(original, MINES_OLD);
        if (index < 0) {
            index = indexOf(original, MINES_PREVIOUS);
        }
        if (index < 0) {
            if (indexOf(original, MINES_NEW) >= 0) {
                return original;
            }
            throw new IllegalStateException("Mines banner string not found");
        }
        byte[] patched = original.clone();
        System.arraycopy(MINES_NEW, 0, patched, index, MINES_NEW.length);
        return patched;
    }

    private static int indexOf(byte[] haystack, byte[] needle) {
        outer:
        for (int i = 0; i <= haystack.length - needle.length; i++) {
            for (int j = 0; j < needle.length; j++) {
                if (haystack[i + j] != needle[j]) {
                    continue outer;
                }
            }
            return i;
        }
        return -1;
    }

    private static boolean containsUtf8(byte[] bytes, String value) {
        return indexOf(bytes, value.getBytes(java.nio.charset.StandardCharsets.UTF_8)) >= 0;
    }

    private static final class PatchTransform implements CodeTransform {
        private int localPlayerGetFieldCount;
        private boolean patched;

        @Override
        public void accept(java.lang.classfile.CodeBuilder builder, java.lang.classfile.CodeElement element) {
            if (element instanceof FieldInstruction fieldInstruction
                && fieldInstruction.opcode() == Opcode.GETFIELD
                && TARGET_OWNER.equals(fieldInstruction.owner().asInternalName())
                && TARGET_FIELD.equals(fieldInstruction.name().stringValue())
                && TARGET_FIELD_DESC.equals(fieldInstruction.type().stringValue())) {
                localPlayerGetFieldCount++;
                if (localPlayerGetFieldCount == 2) {
                    builder.pop();
                    builder.ldc(NEW_NAME);
                    patched = true;
                    return;
                }
            }
            builder.with(element);
        }
    }

    private static final class RevertTransform implements CodeTransform {
        private boolean reverted;

        @Override
        public void accept(java.lang.classfile.CodeBuilder builder, java.lang.classfile.CodeElement element) {
            if (element instanceof java.lang.classfile.instruction.ConstantInstruction constantInstruction
                && constantInstruction.constantValue() instanceof String value
                && NEW_NAME.equals(value)
                && !reverted) {
                builder.aload(0);
                builder.getfield(java.lang.constant.ClassDesc.ofInternalName(TARGET_OWNER), TARGET_FIELD, java.lang.constant.ClassDesc.ofDescriptor(TARGET_FIELD_DESC));
                reverted = true;
                return;
            }
            builder.with(element);
        }
    }
}

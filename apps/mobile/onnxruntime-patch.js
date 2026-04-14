/**
 * Expo Config Plugin: Patches for onnxruntime-react-native.
 * Fixes New Architecture crash, fixes Gradle 8.8 Bug, prevents Duplicate Class Dexter Exception.
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withOnnxruntimeFix = (config) => {
  // === Step 1 & 2: Patch the native node_modules files directly ===
  config = withDangerousMod(config, [
    "android",
    (config) => {
      // Fix 1: The getCatalystInstance Java Crash
      const javaFile = path.join(
        config.modRequest.projectRoot,
        "node_modules",
        "onnxruntime-react-native",
        "android",
        "src",
        "main",
        "java",
        "ai",
        "onnxruntime",
        "reactnative",
        "OnnxruntimeModule.java",
      );
      if (fs.existsSync(javaFile)) {
        let contents = fs.readFileSync(javaFile, "utf-8");
        const badLine = "getCatalystInstance().getJSCallInvokerHolder()";
        const goodLine = "getJSCallInvokerHolder()";
        if (contents.includes(badLine)) {
          fs.writeFileSync(
            javaFile,
            contents.replace(badLine, goodLine),
            "utf-8",
          );
        }
      }

      // Cleanup: Stop the Duplicate Class Dexter Exception from earlier!
      const oldDuplicateDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        "ai",
        "onnxruntime",
      );
      if (fs.existsSync(oldDuplicateDir)) {
        fs.rmSync(oldDuplicateDir, { recursive: true, force: true });
      }

      // Fix 2: Patch onnxruntime-react-native's Gradle 8.8 version crash!
      const buildGradlePath = path.join(
        config.modRequest.projectRoot,
        "node_modules",
        "onnxruntime-react-native",
        "android",
        "build.gradle",
      );
      if (fs.existsSync(buildGradlePath)) {
        let contents = fs.readFileSync(buildGradlePath, "utf-8");
        const oldVersionCheck = `if (VersionNumber.parse(REACT_NATIVE_VERSION) < VersionNumber.parse("0.71")) {`;
        const newVersionCheck = `if (REACT_NATIVE_MINOR_VERSION < 71) {`;
        if (contents.includes(oldVersionCheck)) {
          fs.writeFileSync(
            buildGradlePath,
            contents.replace(oldVersionCheck, newVersionCheck),
            "utf-8",
          );
        }
      }

      return config;
    },
  ]);

  // === Step 3: Register OnnxruntimePackage in MainApplication.kt ===
  config = withDangerousMod(config, [
    "android",
    (config) => {
      const mainAppPath = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        ...(config.android?.package ?? "com.example.app").split("."),
        "MainApplication.kt",
      );

      if (!fs.existsSync(mainAppPath)) return config;

      let contents = fs.readFileSync(mainAppPath, "utf-8");
      const importLine = "import ai.onnxruntime.reactnative.OnnxruntimePackage";
      if (!contents.includes(importLine)) {
        contents = contents.replace(
          /^(import .+)(\r?\n)(?!import)/m,
          `$1$2${importLine}$2`,
        );
      }
      const packageEntry = "OnnxruntimePackage()";
      const anchor = "PackageList(this).packages";
      if (!contents.includes(packageEntry) && contents.includes(anchor)) {
        contents = contents.replace(
          anchor,
          `${anchor}.also { it.add(OnnxruntimePackage()) }`,
        );
      }
      fs.writeFileSync(mainAppPath, contents, "utf-8");
      return config;
    },
  ]);

  return config;
};

module.exports = withOnnxruntimeFix;

// React Native recently updated its architecture (the "New Architecture"). The official onnxruntime-react-native package hasn't fully updated to support it yet, so it fails to connect to the Android system. This file manually bridges the gap so the Javascript code can successfully talk to the phone's native Android C++ processing chips.

/**
 * Expo Config Plugin: Comprehensive patches for onnxruntime-react-native.
 *
 * This plugin fixes two critical problems that prevent native ORT from working:
 *
 * PROBLEM 1 — Missing Java bridge files
 *   onnxruntime-react-native@1.24.x does not ship Java source files in its npm
 *   package (the `android/src/main/java/` directory is empty). However the C++
 *   layer (cpp-adapter.cpp) relies on a Java class
 *   `ai.onnxruntime.reactnative.OnnxruntimeModule` to call `nativeInstall()`
 *   which sets up the JSI OrtApi global. Without this Java class, nativeInstall
 *   is never called, OrtApi is never set, and everything falls back to keywords.
 *
 *   FIX: This plugin writes the three required Java files directly into the
 *   Android project's source tree during `expo prebuild`:
 *     - OnnxruntimeModule.java (registers the NativeModule, calls nativeInstall)
 *     - OnnxruntimePackage.java (ReactPackage that registers the module)
 *     - OnnxruntimeExtensions.java (stub for extensions-disabled mode)
 *
 * PROBLEM 2 — Gradle API incompatibility (Gradle 8.8+)
 *   The library's build.gradle used `VersionNumber.parse()` which was removed
 *   in Gradle 8.8. This plugin patches it to use the already-defined integer
 *   variable REACT_NATIVE_MINOR_VERSION instead.
 */
const {
  withDangerousMod,
  withMainApplication,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// ── Java source files (fetched from github.com/microsoft/onnxruntime) ────────

const ONNX_MODULE_JAVA = `\
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Patched for React Native New Architecture compatibility (RN 0.76+).
// getCatalystInstance() is null on New Arch — use getJSCallInvokerHolder() directly.

package ai.onnxruntime.reactnative;

import java.util.Map;
import java.util.HashMap;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;

@RequiresApi(api = Build.VERSION_CODES.N)
public class OnnxruntimeModule extends ReactContextBaseJavaModule {
  private static ReactApplicationContext reactContext;

  public OnnxruntimeModule(ReactApplicationContext context) {
    super(context);
    reactContext = context;
  }

  @NonNull
  @Override
  public String getName() {
    return "Onnxruntime";
  }

  native void nativeInstall(long jsiPointer, CallInvokerHolderImpl jsCallInvokerHolder);

  native void nativeCleanup();

  @Override
  public void invalidate() {
    super.invalidate();
    nativeCleanup();
  }

  /**
   * Install onnxruntime JSI API.
   * Compatible with both Old Architecture (bridge) and New Architecture (JSI/TurboModules).
   * getCatalystInstance() is NOT used because it returns null on New Architecture.
   */
  @ReactMethod(isBlockingSynchronousMethod = true)
  public boolean install() {
    try {
      System.loadLibrary("onnxruntimejsi");
      ReactApplicationContext ctx = getReactApplicationContext();
      JavaScriptContextHolder jsContext = ctx.getJavaScriptContextHolder();
      // getJSCallInvokerHolder() is available directly on ReactContext in RN 0.72+
      // and works on BOTH Old Arch and New Arch (unlike getCatalystInstance()).
      CallInvokerHolderImpl jsCallInvokerHolder =
        (CallInvokerHolderImpl) ctx.getJSCallInvokerHolder();
      nativeInstall(jsContext.get(), jsCallInvokerHolder);
      return true;
    } catch (Exception e) {
      android.util.Log.e("OnnxruntimeModule", "install() failed: " + e.getMessage(), e);
      return false;
    }
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("ORT_EXTENSIONS_PATH", OnnxruntimeExtensions.getLibraryPath());
    return constants;
  }
}
`;

const ONNX_PACKAGE_JAVA = `\
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package ai.onnxruntime.reactnative;

import android.os.Build;
import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class OnnxruntimePackage implements ReactPackage {
  @RequiresApi(api = Build.VERSION_CODES.N)
  @NonNull
  @Override
  public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new OnnxruntimeModule(reactContext));
    return modules;
  }

  @NonNull
  @Override
  public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}
`;

const ONNX_EXTENSIONS_JAVA = `\
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package ai.onnxruntime.reactnative;

import android.util.Log;

class OnnxruntimeExtensions {
  static public String getLibraryPath() {
    Log.i("OnnxruntimeExtensions",
          "ORT Extensions is not enabled. Add \\"onnxruntimeEnableExtensions\\": \\"true\\" to package.json to enable.");
    return null;
  }
}
`;

// ── Plugin implementation ─────────────────────────────────────────────────────

const withOnnxruntimeFix = (config) => {
  // ── Step 1: Write the missing Java bridge files ────────────────────────────
  config = withDangerousMod(config, [
    "android",
    (config) => {
      const javaDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        "ai",
        "onnxruntime",
        "reactnative",
      );

      if (!fs.existsSync(javaDir)) {
        fs.mkdirSync(javaDir, { recursive: true });
        console.log("[onnxruntime-patch] Created Java directory:", javaDir);
      }

      const files = {
        "OnnxruntimeModule.java": ONNX_MODULE_JAVA,
        "OnnxruntimePackage.java": ONNX_PACKAGE_JAVA,
        "OnnxruntimeExtensions.java": ONNX_EXTENSIONS_JAVA,
      };

      for (const [filename, content] of Object.entries(files)) {
        const filePath = path.join(javaDir, filename);
        fs.writeFileSync(filePath, content, "utf-8");
        console.log(`[onnxruntime-patch] Wrote ${filename}`);
      }

      return config;
    },
  ]);

  // ── Step 2: Patch onnxruntime-react-native's build.gradle ─────────────────
  config = withDangerousMod(config, [
    "android",
    (config) => {
      const buildGradlePath = path.join(
        config.modRequest.projectRoot,
        "node_modules",
        "onnxruntime-react-native",
        "android",
        "build.gradle",
      );

      if (!fs.existsSync(buildGradlePath)) {
        console.warn(
          "[onnxruntime-patch] build.gradle not found, skipping patch.",
        );
        return config;
      }

      let contents = fs.readFileSync(buildGradlePath, "utf-8");

      // Fix 1: Replace removed Gradle 8.8+ VersionNumber API
      const oldVersionCheck = `if (VersionNumber.parse(REACT_NATIVE_VERSION) < VersionNumber.parse("0.71")) {`;
      const newVersionCheck = `if (REACT_NATIVE_MINOR_VERSION < 71) {`;
      if (contents.includes(oldVersionCheck)) {
        contents = contents.replace(oldVersionCheck, newVersionCheck);
        console.log(
          "[onnxruntime-patch] Patched: VersionNumber → REACT_NATIVE_MINOR_VERSION.",
        );
      }

      // Fix 2: We need the onnxruntime-react-native lib to include
      // the app/src/main/java folder for the injected Java files above.
      // The library's own build.gradle only looks at its own src/main/java.
      // The injected files go into the app's own Java source tree (not the library),
      // so they are compiled as part of the :app module automatically.

      fs.writeFileSync(buildGradlePath, contents, "utf-8");
      return config;
    },
  ]);

  // ── Step 3: Register OnnxruntimePackage in MainApplication.kt ──────────────
  // The ReactPackage must be in the app's package list so that
  // NativeModules.Onnxruntime is non-null when binding.ts runs.
  config = withDangerousMod(config, [
    "android",
    (config) => {
      // Find MainApplication.kt (generated by expo prebuild)
      const mainAppPath = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        ...(config.android?.package ?? "com.example.app").split("."),
        "MainApplication.kt",
      );

      if (!fs.existsSync(mainAppPath)) {
        console.warn(
          "[onnxruntime-patch] MainApplication.kt not found at:",
          mainAppPath,
        );
        return config;
      }

      let contents = fs.readFileSync(mainAppPath, "utf-8");

      // Add import if not already there
      const importLine = "import ai.onnxruntime.reactnative.OnnxruntimePackage";
      if (!contents.includes(importLine)) {
        // Insert after the last import block
        contents = contents.replace(
          /^(import .+)(\r?\n)(?!import)/m,
          `$1$2${importLine}$2`,
        );
        console.log("[onnxruntime-patch] Added OnnxruntimePackage import.");
      }

      // Add package to getPackages() if not already there
      const packageEntry = "OnnxruntimePackage()";
      if (!contents.includes(packageEntry)) {
        // Expo's MainApplication.kt has PackageList(this).packages in getPackages()
        const anchor = "PackageList(this).packages";
        if (contents.includes(anchor)) {
          contents = contents.replace(
            anchor,
            `${anchor}.also { it.add(OnnxruntimePackage()) }`,
          );
          console.log(
            "[onnxruntime-patch] Registered OnnxruntimePackage in getPackages().",
          );
        } else {
          console.warn(
            "[onnxruntime-patch] Could not find getPackages() anchor to register OnnxruntimePackage.",
          );
        }
      }

      fs.writeFileSync(mainAppPath, contents, "utf-8");
      return config;
    },
  ]);

  return config;
};

module.exports = withOnnxruntimeFix;

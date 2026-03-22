// React Native bundler (Metro) only know about Js packages, it has no idea about .onnx (ML model) or .wasm (WebAssembly module) so it ignores them

// So I make this file to tell Metro: read .onnx and wasm files, and include them into the final app build

// Also @xenova/transformers will try to import Nodejs server files like "fs", while mobile phone don't have Nodejs, so this file will reroutes those invalid requests into our fake "mock" files

const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow Metro to bundle .wasm, model files, and text vocabularies of the model
config.resolver.assetExts.push("wasm", "onnx", "bin", "txt");

// Ensure they are NOT in sourceExts
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => !["wasm", "onnx", "bin", "txt"].includes(ext),
);

// Intercept requirements for 'onnxruntime-node' and redirect to a safe empty mock
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@xenova/transformers") {
    // Point to our polyfill wrapper which sets `global.self` before loading
    // the transformers.js webpack bundle. onnxruntime-web is inlined inside
    // that bundle and crashes Metro with "self is not defined" otherwise.
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "transformers-wrapper.js"),
    };
  }

  if (moduleName === "onnxruntime-node") {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "mock-onnxruntime-node.js"),
    };
  }

  // onnxruntime-react-native v1.24.x is NOT compatible with React Native New
  // Architecture (RN 0.76+). Its own binding.ts calls
  // NativeModules.Onnxruntime.install() which is always null on New Arch.
  // react-native-reanimated v4 requires New Arch, so we cannot disable it.
  // We redirect ORT to a safe stub on web only. On Android, the Java bridge
  // files are injected via onnxruntime-patch.js so the real module is used.
  if (moduleName === "onnxruntime-react-native" && platform === "web") {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "mock-onnxruntime-web.js"),
    };
  }

  // onnxruntime-web is bundled inside @xenova/transformers and crashes React Native
  // because it references the browser-only `self` global. We redirect it to a stub
  // since actual inference is handled by onnxruntime-react-native.
  // On web (browser), onnxruntime-web is the correct runtime — don't mock it there.
  if (
    (moduleName === "onnxruntime-web" ||
      moduleName.startsWith("onnxruntime-web/")) &&
    platform !== "web"
  ) {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "mock-onnxruntime-web.js"),
    };
  }

  // @xenova/transformers checks if 'fs', 'path', and 'url' exist using Object.keys()
  // React Native Expo Webpack resolves these to undefined on the web Client, which crashes Object.keys.
  // We mock them as empty objects. Since React Native Web doesn't use actual Node `fs`, this is safe.
  if (["fs", "path", "url", "os"].includes(moduleName)) {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "mock-onnxruntime-node.js"),
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

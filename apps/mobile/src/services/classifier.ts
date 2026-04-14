import { AutoTokenizer, env } from "@xenova/transformers";
import { Asset } from "expo-asset";
import { Platform } from "react-native";
import type { Category, ClassificationResult, Rule } from "../types";

// === SINGLETONS & GLOBAL STATE ===

/** Full @xenova/transformers pipeline — used on web (WASM-based). */
let _webPipeline: any = null;

/** Standalone tokenizer + native ORT session — used on Android / iOS. */
let _tokenizer: any = null;
let _session: any = null;

/** Flag to indicate if the model failed to load, triggering keyword fallback. */
let _isFallback = false;

/** * Mutex/Lock promise: prevents multiple simultaneous initialization calls.
 * Ensures that if two processes call init at once, they await the same promise.
 */
let _initPromise: Promise<boolean> | null = null;

/** Map raw model index → app category. LABEL_0=urgent, LABEL_1=normal, LABEL_2=noise */
const labelMap: Category[] = ["urgent", "normal", "noise"];

// === WEB INITIALIZATION (WASM) ===

/**
 * Web path: uses the @xenova/transformers `pipeline()` API.
 * * Intercepts network requests to serve bundled local assets (WASM/ONNX)
 * instead of fetching them from the internet, enabling 100% offline web usage.
 */
async function initWeb(): Promise<boolean> {
  const { pipeline } = await import("@xenova/transformers");

  const modelId = "Xenova/distilbert-base-uncased";
  const baseUrl = "http://local-model/";
  const dummyPath = `${baseUrl}${modelId}/`;

  // Local JSON maps for tokenizer and model configuration
  const jsonFiles: Record<string, any> = {
    "config.json": require("../../assets/model/config.json"),
    "tokenizer_config.json": require("../../assets/model/tokenizer_config.json"),
    "tokenizer.json": require("../../assets/model/tokenizer.json"),
    "special_tokens_map.json": require("../../assets/model/special_tokens_map.json"),
  };

  // Download binary assets into memory via Expo Asset API
  const [vocabAsset, onnxAsset, wasmAsset, wasmSimdAsset] = await Promise.all([
    Asset.fromModule(require("../../assets/model/vocab.txt")).downloadAsync(),
    Asset.fromModule(
      require("../../assets/model/onnx/model_quantized.onnx"),
    ).downloadAsync(),
    Asset.fromModule(
      require("../../assets/model/ort-wasm.wasm"),
    ).downloadAsync(),
    Asset.fromModule(
      require("../../assets/model/ort-wasm-simd.wasm"),
    ).downloadAsync(),
  ]);

  // Configure ONNX Runtime Web to use local WASM paths
  env.backends.onnx.wasm.wasmPaths = {
    "ort-wasm.wasm": wasmAsset.uri,
    "ort-wasm-simd.wasm": wasmSimdAsset.uri,
  } as any;

  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = baseUrl;

  // Global fetch interceptor to redirect requests to local assets
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.startsWith(dummyPath)) {
      const fileName = url.replace(dummyPath, "");
      if (jsonFiles[fileName]) {
        return new Response(JSON.stringify(jsonFiles[fileName]), {
          headers: { "Content-Type": "application/json" },
        });
      }
      if (fileName === "vocab.txt") return originalFetch(vocabAsset.uri, init);
      if (fileName === "onnx/model_quantized.onnx")
        return originalFetch(onnxAsset.uri, init);
    }
    return originalFetch(input, init);
  };

  console.log("[DEBUG] Loading @xenova/transformers pipeline on web...");
  _webPipeline = await pipeline("text-classification", modelId, {
    quantized: true,
  });
  console.log("[DEBUG] Web pipeline ready!");
  return true;
}

// === NATIVE INITIALIZATION (ANDROID/IOS) ===

/**
 * Native path: Uses `onnxruntime-react-native` for high-performance JSI inference.
 * Manually injects model assets and initializes the AutoTokenizer for mobile.
 */
async function initNative(): Promise<boolean> {
  let ort: any;
  try {
    ort = await import("onnxruntime-react-native");
    if (typeof ort?.InferenceSession?.create !== "function") {
      throw new Error(
        "InferenceSession.create not found — native .so not linked.",
      );
    }
  } catch (e) {
    console.warn("[DEBUG] onnxruntime-react-native failed to load.", e);
    return false;
  }

  // 1. Resolve local ONNX model file path
  console.log("[DEBUG] Locating ONNX Asset...");
  const onnxAsset = require("../../assets/model/onnx/model_quantized.onnx");
  const onnxRes = await Asset.fromModule(onnxAsset).downloadAsync();
  const modelUri = onnxRes.localUri ?? onnxRes.uri;

  // 2. Initialize the Native Inference Session (the model engine)
  console.log("[DEBUG] Starting Native InferenceSession...");
  _session = await ort.InferenceSession.create(modelUri);

  // 3. Configure offline Tokenizer environment
  const modelId = "Xenova/distilbert-base-uncased";
  const baseUrl = "http://local-model/";
  const dummyPath = `${baseUrl}${modelId}/`;

  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = baseUrl;

  const jsonFiles: Record<string, any> = {
    "config.json": require("../../assets/model/config.json"),
    "tokenizer_config.json": require("../../assets/model/tokenizer_config.json"),
    "tokenizer.json": require("../../assets/model/tokenizer.json"),
    "special_tokens_map.json": require("../../assets/model/special_tokens_map.json"),
  };

  const vocabAsset = await Asset.fromModule(
    require("../../assets/model/vocab.txt"),
  ).downloadAsync();
  const vocabUri = vocabAsset.localUri ?? vocabAsset.uri;

  // Fetch interceptor specifically for the Tokenizer JSONs/Vocab
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.startsWith(dummyPath)) {
      const fileName = url.replace(dummyPath, "");
      if (jsonFiles[fileName]) {
        return new Response(JSON.stringify(jsonFiles[fileName]), {
          headers: { "Content-Type": "application/json" },
        });
      }
      if (fileName === "vocab.txt") return originalFetch(vocabUri, init);
    }
    return originalFetch(input, init);
  };

  console.log("[DEBUG] Booting AutoTokenizer...");
  _tokenizer = await AutoTokenizer.from_pretrained(modelId);
  return true;
}

// === PUBLIC INITIALIZER ===

/**
 * Orchestrates the platform-specific boot process.
 * Implements a singleton pattern to ensure resources are loaded exactly once.
 */
export async function initClassifier(): Promise<boolean> {
  if (Platform.OS === "web" ? _webPipeline : _tokenizer && _session)
    return true;
  if (_isFallback) return false;
  if (_initPromise) return _initPromise;

  if (__DEV__)
    console.log("[ML] Initializing classifier for platform:", Platform.OS);
  _initPromise = (async () => {
    try {
      const ok = Platform.OS === "web" ? await initWeb() : await initNative();
      if (!ok) {
        _isFallback = true;
      }
      return ok;
    } catch (err) {
      if (__DEV__)
        console.warn("[ML] Classifier init failed. Falling back.", err);
      _isFallback = true;
      return false;
    } finally {
      _initPromise = null;
    }
  })();

  return _initPromise;
}

// === INFERENCE HELPERS ===

/**
 * Standard Softmax implementation to convert raw logits into probability distribution.
 * Logits are the "raw scores" from the model. Softmax turns them into percentages (0.0 to 1.0).
 */
function softmax(arr: Float32Array | number[]): number[] {
  // 1. Find the maximum value in the input array.
  // This is a "Numerical Stability" trick: subtracting the max prevents Math.exp()
  // from resulting in Infinity (Overflow) when dealing with large numbers.
  let max = -Infinity;
  for (let i = 0; i < arr.length; i++) if (arr[i] > max) max = arr[i];

  // 2. Compute the exponent of each value (relative to the max) and calculate the total sum.
  let sum = 0;
  const exps = Array.from(arr, (v) => {
    const e = Math.exp(v - max);
    sum += e;
    return e;
  });

  // 3. Divide each exponent by the total sum so that all resulting values add up to exactly 1 (100%).
  return exps.map((e) => e / sum);
}

/**
 * Executes inference on Native platforms (Android/iOS).
 * Uses the high-performance C++ ONNX Runtime (ORT) engine.
 */
async function runNativeInference(
  body: string,
): Promise<ClassificationResult | null> {
  const ort = await import("onnxruntime-react-native");
  try {
    // 1. Convert the message text into a sequence of numbers (Tokens).
    // Padding: makes short messages the same length as the model input.
    // Truncation: cuts off messages that are too long for DistilBERT (usually > 512 tokens).
    const inputs = await _tokenizer(body, { padding: true, truncation: true });

    // 2. Prepare the Tensors for the Native Engine.
    // NOTE: ONNX Runtime for Mobile strictly requires "int64" (BigInt) for DistilBERT.
    // input_ids: The numerical IDs of the words.
    const inputIds = new ort.Tensor(
      "int64",
      new BigInt64Array(inputs.input_ids.data),
      inputs.input_ids.dims,
    );
    // attention_mask: Tells the model which tokens are real words vs. padding (0 or 1).
    const attentionMask = new ort.Tensor(
      "int64",
      new BigInt64Array(inputs.attention_mask.data),
      inputs.attention_mask.dims,
    );

    // 3. Execute the Model Session.
    const start = Date.now();
    const output = await _session.run({
      input_ids: inputIds,
      attention_mask: attentionMask,
    });

    if (__DEV__)
      console.log(`[ML] Native inference completed in ${Date.now() - start}ms`);

    // 4. Process the Output.
    // The model returns "logits" (raw numbers). We extract them and run Softmax.
    const logits = (Object.values(output)[0] as any).data as Float32Array;
    const probs = softmax(logits); // Convert to percentages.

    // Find the index of the highest probability (e.g., if index 0 is 0.95, it's 'Urgent').
    const maxIdx = probs.indexOf(Math.max(...probs));

    return {
      category: labelMap[maxIdx] ?? "normal", // Match index to "urgent", "normal", or "noise"
      confidence: probs[maxIdx], // The probability score (e.g., 0.95)
    };
  } catch (e) {
    if (__DEV__) console.warn("[ML] Native inference error:", e);
    return null; // Return null so the system can fall back to the Keyword method.
  }
}

/**
 * Executes inference on Web platforms.
 * Uses the Transformers.js pipeline which abstracts the complexity into a single call.
 */
async function runWebInference(
  body: string,
): Promise<ClassificationResult | null> {
  try {
    // The web pipeline handles tokenization, inference, and softmax in one step.
    // topk: 1 ensures we only get the single most likely result.
    const result = await _webPipeline(body, { topk: 1 });
    const top = Array.isArray(result) ? result[0] : result;

    // Transformers.js labels are usually "LABEL_0", "LABEL_1", ...
    // We strip the text to get the numeric ID.
    const idx = parseInt(top.label.replace("LABEL_", ""), 10);
    const category = labelMap[idx] ?? "normal";

    return {
      category,
      confidence: top.score, // The score is already a probability in the web pipeline.
    };
  } catch (e) {
    if (__DEV__) console.warn("[ML] Web inference error:", e);
    return null;
  }
}

// === MAIN CLASSIFY EXPORT ===

/**
 * Primary Classification Pipeline:
 * 1. Checks Manual Rules (User Preference).
 * 2. Attempts On-Device ML Inference (Our Trained model).
 * 3. Keyword Fallback (Use those kws when fail).
 */
export async function classify(
  appName: string,
  title: string | null,
  body: string,
  rules: Rule[],
): Promise<ClassificationResult> {
  const combined = `${appName} ${title ?? ""} ${body}`.trim();

  // 1. Rule-based Filtering (User Preferences)
  // Without using the model
  for (const rule of rules) {
    const val = rule.value.toLowerCase();
    if (rule.type === "app" && appName.toLowerCase().includes(val))
      return { category: rule.forcedCategory, confidence: 1.0 };
    if (rule.type === "contact" && (title ?? "").toLowerCase().includes(val))
      return { category: rule.forcedCategory, confidence: 1.0 };
  }

  // 2. Classification using our model
  const ready = await initClassifier();
  if (ready) {
    const mlResult =
      Platform.OS === "web"
        ? await runWebInference(body)
        : await runNativeInference(body);
    if (mlResult) return mlResult;
  }

  // 3. Fallback (Keyword matching)
  console.log("[DEBUG] Executing Keyword Fallback...");
  const URGENT_KEYWORDS = [
    "urgent",
    "emergency",
    "critical",
    "immediately",
    "asap",
    "help",
    "alert",
    "warning",
    "danger",
    "important",
  ];
  const NOISE_KEYWORDS = [
    "sale",
    "discount",
    "offer",
    "promo",
    "deal",
    "% off",
    "coupon",
    "subscribe",
    "newsletter",
    "unsubscribe",
    "ad",
    "sponsored",
  ];

  const lower = combined.toLowerCase();
  if (URGENT_KEYWORDS.some((k) => lower.includes(k)))
    return { category: "urgent", confidence: 0.8 };
  if (NOISE_KEYWORDS.some((k) => lower.includes(k)))
    return { category: "noise", confidence: 0.8 };

  return { category: "normal", confidence: 0 };
}

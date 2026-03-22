// when the library asks to use the web browser's ONNX runtime, mobile phones aren't web browsers, so the metro.config will route the request to this file
// so we give the library this fake code so it compiles successfully, but we never actually use it (because we use onnxruntime-react-native instead to do the actual math).
class InferenceSession {
  static async create() {
    throw new Error(
      "onnxruntime-web is not supported in React Native. Use onnxruntime-react-native instead.",
    );
  }
  async run() {
    throw new Error("onnxruntime-web is not supported in React Native.");
  }
  async release() {}
}

class Tensor {
  constructor(type, data, dims) {
    this.type = type;
    this.data = data;
    this.dims = dims;
  }
}

module.exports = {
  InferenceSession,
  Tensor,
  env: {},
  backend: {},
};

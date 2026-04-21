from train import train_model

MODEL_NAME = "microsoft/MiniLM-L12-H384-uncased"
OUTPUT_DIR = "./results_minilm"

train_model(MODEL_NAME, OUTPUT_DIR)
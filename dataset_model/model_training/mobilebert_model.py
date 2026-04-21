from train import train_model

MODEL_NAME = "google/mobilebert-uncased"
OUTPUT_DIR = "./results_mobilebert"

train_model(MODEL_NAME, OUTPUT_DIR)
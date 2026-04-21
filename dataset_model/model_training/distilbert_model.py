from train import train_model

MODEL_NAME = "distilbert-base-uncased"
OUTPUT_DIR = "./results_distilbert"

train_model(MODEL_NAME, OUTPUT_DIR)
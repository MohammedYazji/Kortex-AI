from train import train_model

MODEL_NAME = "microsoft/mpnet-base"
OUTPUT_DIR = "./results_mpnet"

train_model(MODEL_NAME, OUTPUT_DIR)
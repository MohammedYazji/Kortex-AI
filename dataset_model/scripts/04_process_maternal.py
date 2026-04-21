import os
import re
import pandas as pd

# Set up paths relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

INPUT_PATH = os.path.join(PROJECT_ROOT, "raw_data", "maternal", "urgency_detection_maternal_health_synthetic.jsonl")
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "processed", "maternal_labeled.csv")

# === Load Dataset ===

print(f"Loading Maternal Health dataset from: {INPUT_PATH}")
if not os.path.exists(INPUT_PATH):
    print("Error: Dataset file not found!")
    exit()

df = pd.read_json(INPUT_PATH, lines=True)
print(f"Loaded {len(df)} initial messages")

# === Filtering ===

# Keep only extremely high confidence labels (>= 0.95)
df = df[df["confidence"] >= 0.95]

# Remove the NOT URGENT class, as we are gathering these for the 'urgent' label
df = df[df["matching_rule"] != "NOT URGENT"]

# === Clean Text ===

def clean_text(text):
    """Clean the message text by removing URLs and non-ASCII characters."""
    text = str(text)
    text = re.sub(r"http\S+|www\.\S+", "", text)
    text = re.sub(r"[^\x00-\x7F]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

df["message_text"] = df["generated_user_message"].apply(clean_text)

# === Length Filtering and Deduplication ===

df = df[df["message_text"].str.split().str.len() >= 4]
df = df[df["message_text"].str.split().str.len() <= 60]
df = df.drop_duplicates(subset=["message_text"])

print(f"Valid messages after filtering and cleaning: {len(df)}")

# === Sample Data ===

# All these messages represent 'urgent' scenarios
df["label"]          = "urgent"
df["app_source"]     = "health_app"
df["sender_type"]    = "patient"
df["dataset_source"] = "maternal_health"

# We want almost 250 samples maximum, evenly distributed across the different illness 'rules'
rules = df["matching_rule"].unique()
samples_per_rule = max(1, 250 // len(rules))

sampled_frames = []
for rule in rules:
    rule_df = df[df["matching_rule"] == rule]
    amount_to_sample = min(samples_per_rule, len(rule_df))
    sampled_frames.append(rule_df.sample(amount_to_sample, random_state=42))

df_final = pd.concat(sampled_frames, ignore_index=True)

# Cap at exactly 250 if we slightly exceeded it
if len(df_final) > 250:
    df_final = df_final.sample(250, random_state=42)

# === Save ===

df_out = df_final[["message_text", "label", "app_source", "sender_type", "dataset_source"]]
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
df_out.to_csv(OUTPUT_PATH, index=False)

print(f"\nSuccess! Saved {len(df_out)} URGENT messages to: {OUTPUT_PATH}")
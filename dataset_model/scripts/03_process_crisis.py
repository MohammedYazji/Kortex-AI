import os
import re
import pandas as pd

# Set up paths relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

INPUT_PATH = os.path.join(PROJECT_ROOT, "raw_data", "crisis", "crisis.csv")
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "processed", "crisis_labeled.csv")

# === Load Dataset ===

print(f"Loading Crisis dataset from: {INPUT_PATH}")
if not os.path.exists(INPUT_PATH):
    print("Error: Dataset file not found!")
    exit()

df = pd.read_csv(INPUT_PATH)
print(f"Loaded {len(df)} initial tweets")

# We are only interested in High urgency tweets for our 'urgent' class
df = df[df["urgency_label"] == "High"]
print(f"Kept {len(df)} High urgency tweets")

# === Clean Text ===

def clean_text(text):
    """Clean the tweet text by removing URLs, hashtags, mentions, and non-ASCII characters."""
    text = str(text)
    text = re.sub(r"http\S+|www\.\S+", "", text)   # Remove URLs
    text = re.sub(r"#\w+", "", text)               # Remove Hashtags
    text = re.sub(r"@\w+", "", text)               # Remove Mentions (@user)
    text = re.sub(r"[^\x00-\x7F]+", " ", text)     # Remove Non-ASCII
    text = re.sub(r"\s+", " ", text).strip()       # Collapse whitespace
    return text

df["message_text"] = df["text"].apply(clean_text)

# === Filter and Deduplicate ===

# Keep messages of reasonable length
df = df[df["message_text"].str.split().str.len() >= 5]
df = df[df["message_text"].str.split().str.len() <= 60]

# Remove exact duplicate texts
df = df.drop_duplicates(subset=["message_text"])

print(f"Valid tweets after cleaning: {len(df)}")

# === Sample Data ===

# Ensure we sample evenly across all different types of crises (e.g. floods, earthquakes)
crisis_types = df["crisis_type"].unique()
samples_per_type = max(1, 200 // len(crisis_types))

print(f"Sampling {samples_per_type} tweets balanced across {len(crisis_types)} crisis types...")

sampled_frames = []
for ct in crisis_types:
    ct_df = df[df["crisis_type"] == ct]
    amount_to_sample = min(samples_per_type, len(ct_df))
    sampled_frames.append(ct_df.sample(amount_to_sample, random_state=42))

df_final = pd.concat(sampled_frames, ignore_index=True)

# Cap at exactly 200 samples if we slightly exceeded it
if len(df_final) > 200:
    df_final = df_final.sample(200, random_state=42)

# === Add Metadata and Save === 

# All selected tweets are labeled as urgent
df_final["label"]          = "urgent"
df_final["app_source"]     = "social_media"
df_final["sender_type"]    = "public"
df_final["dataset_source"] = "crisis_tweets"

# Save the final dataset
df_out = df_final[["message_text", "label", "app_source", "sender_type", "dataset_source"]]
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
df_out.to_csv(OUTPUT_PATH, index=False)

print(f"\nSuccess! Saved {len(df_out)} URGENT messages to: {OUTPUT_PATH}")
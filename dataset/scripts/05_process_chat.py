import os
import re
import pandas as pd

# Set up paths relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

INPUT_PATH = os.path.join(PROJECT_ROOT, "raw_data", "chat", "human_chat.txt")
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "processed", "humanchat_labeled.csv")

# === Parse Conversations ===

print(f"Loading human chat dataset from: {INPUT_PATH}")
if not os.path.exists(INPUT_PATH):
    print("Error: Dataset file not found!")
    exit()

messages = []
with open(INPUT_PATH, "r", encoding="utf-8") as file:
    for line in file:
        line = line.strip()
        # Look for messages prefixed with "Human number:"
        match = re.match(r"Human \d+:\s*(.+)", line)
        if match:
            text = match.group(1).strip()
            messages.append(text)

print(f"Total raw messages extracted: {len(messages)}")
df = pd.DataFrame({"raw_text": messages})

# === Clean Text ===

def clean_text(text):
    """Clean the chat messages and remove redacted sensitive data markers."""
    text = str(text)
    text = re.sub(r"http\S+|www\.\S+", "", text)  # URLs
    text = re.sub(r"<REDACTED[^>]*>", "", text)  # Masked tokens like <REDACTED_PHONE>
    text = re.sub(r"[^\x00-\x7F]+", " ", text)  # Non-ASCII characters
    text = re.sub(r"\s+", " ", text).strip()  # Collapse whitespace
    return text

df["message_text"] = df["raw_text"].apply(clean_text)

# === Filtering and Deduplicating ===

# Keep reasonable conversational lengths
df = df[df["message_text"].str.split().str.len() >= 4]
df = df[df["message_text"].str.split().str.len() <= 40]
df = df[df["message_text"].str.strip() != ""]

# Drop identical identical messages
df = df.drop_duplicates(subset=["message_text"])

print(f"Valid messages after length filtering: {len(df)}")

# === Add Metadata ===

# This dataset provides our 'normal' conversations.
# This teaches the model that regular conversations are 'normal' even if they contain casual usage of words like "help".
df["label"]          = "normal"
df["app_source"]     = "chat"
df["sender_type"]    = "human"
df["dataset_source"] = "human_chat"

# We don't want 'normal' messages to overwhelm the dataset, so we cap it to 1000
df = df.sample(min(1000, len(df)), random_state=42)

# === Save ===

df_out = df[["message_text", "label", "app_source", "sender_type", "dataset_source"]]
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
df_out.to_csv(OUTPUT_PATH, index=False)

print(f"\nSuccess! Saved {len(df_out)} NORMAL messages to: {OUTPUT_PATH}")
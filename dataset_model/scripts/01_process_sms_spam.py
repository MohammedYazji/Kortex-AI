import pandas as pd
import re
import os

# Set up the paths based on where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

RAW_FILE = os.path.join(PROJECT_ROOT, "raw_data", "sms_spam", "SMSSpamCollection.csv")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "processed", "sms_spam_labeled.csv")

if not os.path.exists(RAW_FILE):
    print(f"Error: Could not find dataset at {RAW_FILE}")
    exit()

print(f"Loading dataset from: {RAW_FILE}")

# Load the dataset
# Skip the first row since it's just the 'v1, v2' header we don't need
df = pd.read_csv(
    RAW_FILE,
    header=0,
    usecols=[0, 1],
    names=["original_label", "message_text"],
    skiprows=1,
    encoding="utf-8",
    on_bad_lines="skip"
)

# Remove any empty or missing messages
df = df.dropna(subset=["message_text"])
df = df[df["message_text"].astype(str).str.strip() != ""]

# Map labels to our custom classes
# If the message is spam, we consider it "noise", otherwise it is "normal"
df["label"] = df["original_label"].apply(lambda x: "noise" if x == "spam" else "normal")

# Clean text formatting
def clean_text(text):
    text = str(text).strip()
    text = re.sub(r"\s+", " ", text)  # Remove any extra spacing
    text = re.sub(r"[^\x00-\x7F]+", " ", text)   # Keep only standard ASCII characters
    return text

df["message_text"] = df["message_text"].apply(clean_text)

# Add our custom metadata fields
df["app_source"] = "sms"
df["sender_type"] = "unknown"
df["dataset_source"] = "sms_spam_uci"

# Keep only the columns we actually want for our final dataset
df = df[["message_text", "label", "app_source", "sender_type", "dataset_source"]]

# Ensure the output directory exists
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

# Save the final processed dataset
df.to_csv(OUTPUT_FILE, index=False)

print(f"Success! Dataset saved to {OUTPUT_FILE}\n")
print("Final Label Distribution:")
print(df["label"].value_counts())
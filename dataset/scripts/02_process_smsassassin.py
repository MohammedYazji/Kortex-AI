import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import re
import pandas as pd

# Set up paths relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

INPUT_PATH = os.path.join(PROJECT_ROOT, "raw_data", "spamassassin", "spamassassin.csv")
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "processed", "spamassassin_labeled.csv")

print(f"Loading SpamAssassin dataset from: {INPUT_PATH}")
if not os.path.exists(INPUT_PATH):
    print("Error: Dataset file not found!")
    exit()

df = pd.read_csv(INPUT_PATH, encoding="utf-8", on_bad_lines="skip")
print(f"Loaded {len(df)} raw emails")

# === Extraction & Cleaning Functions ===
def extract_and_clean_text(raw_text):
    """
    Extracts the subject and body of an email, then cleans up the text using regex
    by removing HTML tags, URLs, and email headers.
    """
    raw_text = str(raw_text)
    
    # 1. Extract Subject
    subject = ""
    subject_match = re.search(r"Subject:\s*(.+?)(?:Message|Return|Received|MIME|Content|X-|From |To:|Date:)", raw_text, re.IGNORECASE)
    if subject_match:
        subject = subject_match.group(1).strip()
        subject = re.sub(r"=\?.*?\?[bq]\?.*?\?=", "", subject, flags=re.IGNORECASE)
        subject = subject[:150]

    # 2. Extract Body (everything after the headers)
    body = ""
    body_match = re.search(r"(?:Content-Transfer-Encoding:[^\s]+\s+|charset=[^\s\"]+\s*)(.{30,})", raw_text, re.IGNORECASE)
    if body_match:
        body = body_match.group(1)[:500]
    else:
        body = raw_text[-500:]

    text = f"{subject} {body}".strip()

    # 3. Clean Text
    text = re.sub(r"http\S+|www\.\S+", "", text)   # Remove URLs
    text = re.sub(r"\S+@\S+\.\S+", "", text)   # Remove Emails
    text = re.sub(r"<[^>]+>", " ", text)   # Remove HTML tags
    text = re.sub(r"=\?.*?\?=", "", text)   # Remove Encoded words
    text = re.sub(r"=[0-9A-Fa-f]{2}", " ", text)   # Remove Quoted-printable
    text = re.sub(r"\b(Content-\w+|X-\w+|MIME-\w+|Return-\w+|Received|Delivered|Message-Id):[^\n]*", "", text, flags=re.IGNORECASE) # Headers
    text = re.sub(r"[^\x00-\x7F]+", " ", text)   # Remove Non-ASCII characters
    text = re.sub(r"\s+", " ", text).strip()                 # Collapse whitespace

    return text[:300]


print("Extracting and cleaning text...")
df["message_text"] = df["text"].apply(extract_and_clean_text)

# === Relabel ===

# We only want to keep the 'spam' (target=1) messages as 'noise'
# We ignore the 'ham' (target=0) completely for this dataset.
df["label"] = df["target"].apply(lambda x: "noise" if int(x) == 1 else None)

# Remove the 'ham' emails
df = df.dropna(subset=["label"])

# === Filter and Deduplicate ===

# Remove empty rows and very short messages
df = df.dropna(subset=["message_text"])
df = df[df["message_text"].str.strip() != ""]
df = df[df["message_text"].str.split().str.len() >= 4]

# Remove duplicates
df = df.drop_duplicates(subset=["message_text"])

print(f"After filtering and cleaning, we have {len(df)} valid NOISE messages.")

# === Save ===

# Add metadata describing the source of this data
df["app_source"] = "email"
df["sender_type"] = "unknown"
df["dataset_source"] = "spamassassin"

# Save the final dataset
df_out = df[["message_text", "label", "app_source", "sender_type", "dataset_source"]]
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
df_out.to_csv(OUTPUT_PATH, index=False)

print(f"\nSuccess! Dataset saved to: {OUTPUT_PATH}")
print("\nSample NOISE messages:")
print(df_out["message_text"].sample(min(3, len(df_out))).to_string())
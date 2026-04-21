import sys
import os
import pandas as pd
from sklearn.utils import shuffle

# Ensure utf-8 output printing
sys.stdout.reconfigure(encoding='utf-8')

# === Paths ===
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

PROCESSED_DIR = os.path.join(PROJECT_ROOT, "processed")
SYNTHETIC_DIR = os.path.join(PROJECT_ROOT, "processed", "synthetic")
FINAL_DIR = os.path.join(PROJECT_ROOT, "final")

# === Step 1: Load Baseline Processed Datasets ===
print("Loading core datasets from previous scripts...")

try:
    sms = pd.read_csv(os.path.join(PROCESSED_DIR, "sms_spam_labeled.csv"))
    spamassassin = pd.read_csv(os.path.join(PROCESSED_DIR, "spamassassin_labeled.csv"))
    maternal = pd.read_csv(os.path.join(PROCESSED_DIR, "maternal_labeled.csv"))
    crisis = pd.read_csv(os.path.join(PROCESSED_DIR, "crisis_labeled.csv"))
    chat = pd.read_csv(os.path.join(PROCESSED_DIR, "humanchat_labeled.csv"))
    new_data2 = pd.read_csv(os.path.join(PROCESSED_DIR, "root_extracted.csv"))
except FileNotFoundError as e:
    print(f"Error: A previously processed file is missing. Please run scripts 01-05 first. Details: {e}")
    exit()

print(f"  - SMS Spam    : {len(sms)} messages")
print(f"  - SpamAssassin: {len(spamassassin)} messages")
print(f"  - Maternal    : {len(maternal)} messages")
print(f"  - Crisis      : {len(crisis)} messages")
print(f"  - Human Chat  : {len(chat)} messages")
print(f"  - Root Extract: {len(new_data2)} messages")

# ── Step 2: Load All Synthetic CSVs ───────────────────────────────────────────
print("\nLoading synthetic datasets...")

# The required synthetic files we expect to find
SYNTHETIC_FILES = [
    # Original 16
    "urgent_health.csv", "urgent_work.csv", "urgent_finance.csv", "urgent_family.csv",
    "urgent_security.csv", "urgent_deadline.csv", "normal_work.csv", "normal_social.csv",
    "normal_delivery.csv", "normal_reminder.csv", "normal_info.csv", "noise_promo.csv",
    "noise_social.csv", "noise_spam.csv", "noise_newsletter.csv",
    
    # Extra 13
    "urgent_work2.csv", "urgent_health2.csv", "urgent_finance2.csv", "urgent_family2.csv",
    "urgent_security2.csv", "urgent_deadline2.csv", "urgent_transport.csv", "urgent_natural.csv",
    "urgent_legal.csv", "urgent_infra.csv", "urgent_device.csv", "urgent_payment.csv", "urgent_mental.csv",
    
    # Extra Noise 6
    "noise_gaming.csv", "noise_ecommerce.csv", "noise_dating.csv", "noise_news.csv",
    "noise_finance.csv", "noise_rewards.csv",

    # Hard Cases
    "urgent_implicit.csv", "urgent_typos.csv", "normal_false_urgent.csv", "noise_fake_urgent.csv",
    "urgent_questions.csv", "normal_delivery2.csv", "normal_transactional.csv", "urgent_security3.csv",
    "noise_fake_security.csv", "normal_friends_family_400.csv", "normal_synthetic_500.csv", "noise_wellness.csv"
]

synthetic_frames = []
missing_files = []

for filename in SYNTHETIC_FILES:
    filepath = os.path.join(SYNTHETIC_DIR, filename)
    if not os.path.exists(filepath):
        missing_files.append(filename)
        continue

    try:
        df_temp = pd.read_csv(filepath, header=None, names=["message_text", "label"], on_bad_lines="skip")
        df_temp["app_source"] = "synthetic"
        df_temp["sender_type"] = "synthetic"
        df_temp["dataset_source"] = filename.replace(".csv", "")
        synthetic_frames.append(df_temp)
    except Exception as e:
        print(f"  Error loading {filename}: {e}")
        missing_files.append(filename)

if missing_files:
    print(f"\nWarning: {len(missing_files)} synthetic files are missing.")
    print("Continuing merge without them...\n")

if not synthetic_frames:
    print("Fatal Error: No synthetic datasets found. Create datasets first!")
    exit()

synthetic_all = pd.concat(synthetic_frames, ignore_index=True)
print(f"Loaded {len(synthetic_all)} synthetic messages in total.")

# === Step 3: Combine Everything ===
print("\nMerging all sub-datasets...")

# Fill missing metadata for `sms` (and any others as a safety measure)
for df in [sms]:
    if "app_source" not in df.columns: df["app_source"] = "unknown"
    if "sender_type" not in df.columns: df["sender_type"] = "unknown"
    if "dataset_source" not in df.columns: df["dataset_source"] = "public"

df_all = pd.concat(
    [sms, spamassassin, maternal, crisis, chat, new_data2, synthetic_all],
    ignore_index=True
)[["message_text", "label", "app_source", "sender_type", "dataset_source"]]

print(f"Total rows before cleaning: {len(df_all)}")

# === Step 4: Remove Known Junk Patterns ===
# Removing remnants of email metadata or strange artifacts that leak into the text.
JUNK_PATTERNS = [
    r"HourAhead", r"Start Date:", r"-----Original Message-----", r"Forwarded by", 
    r"OriginalMessage", r"<CODESITE>", r"Schedule Crawler", r"Var Limits", 
    r"Subject: RE:", r"Subject: FW:", r"X-From:", r"X-To:", r"X-cc:", 
    r"Message-ID:", r"Mime-Version:", r"Content-Type:", r"Content-Transfer-Encoding:", 
    r"Return-Path:", r"X-Mailer:", r"In-Reply-To:", r"References:", r"text/plain", 
    r"text/html", r"charset=", r"Re: FW:", r"Re: Re:", r"something to laugh", 
    r"inbox cleanup", r"brown bag", r"Original Appointment", r"vCard", r"=20", 
    r"=3D", r"DOCTYPE", r"<html>", r"<body>", r"PGL", r"North Shore", r"conv\.", 
    r"placement training", r"Amrita college", r"EOL Transaction", r"Walk-Thru", 
    r"CAL YOU SIR", r"WSCC", r"Diablo Canyon", r"MAAC", r"Indian River", r"MAPP", 
    r"X-Virus-Scanned", r"amavisd-milter", r"E-work orders", r"Cross Correlations", 
    r"Dear all,", r"Dear Dan,", r"trading opportunity", r"natsource checkout", 
    r"\[ILUG\] ASSISTANCE", r"\[SA\] High Email", r"To be removed email:", 
    r"Organizational Announcement", r"Regulatory Update", r"FERC"
]

before_len = len(df_all)
pattern = '|'.join(JUNK_PATTERNS)
df_all = df_all[~df_all["message_text"].str.contains(pattern, case=False, na=False, regex=True)]

print(f"Removed {before_len - len(df_all)} junk-patterned messages")

# === Step 5: Final Cleaning ===
print("Cleaning dataset constraints...")

# Remove blank/corrupt messages
df_all = df_all.dropna(subset=["message_text", "label"])
df_all["message_text"] = df_all["message_text"].astype(str)

# Filter bounds: messages must be at least 2 words, no more than 150
df_all = df_all[df_all["message_text"].str.split().str.len().between(2, 150)]

# Deduplicate
df_all = df_all.drop_duplicates(subset=["message_text"])

# Keep only the valid specific labels
df_all = df_all[df_all["label"].isin(["urgent", "normal", "noise"])]

print(f"Ready for balancing: {len(df_all)} total messages.")

# === Step 6: Ensure Class Balancing ===
print("\nBalancing classes evenly...")

df_urgent = df_all[df_all["label"] == "urgent"]
df_normal = df_all[df_all["label"] == "normal"]
df_noise  = df_all[df_all["label"] == "noise"]

# Find the smallest class size to downsample everyone to match it
TARGET = min(len(df_urgent), len(df_normal), len(df_noise))
print(f"Balancing size target based on smallest class -> {TARGET} items per label")

df_urgent = df_urgent.sample(TARGET, random_state=42)
df_normal = df_normal.sample(TARGET, random_state=42)
df_noise  = df_noise.sample(TARGET,  random_state=42)

df_final = pd.concat([df_urgent, df_normal, df_noise], ignore_index=True)
df_final = shuffle(df_final, random_state=42).reset_index(drop=True)

# === Step 7: Train / Val / Test Splits & Numerical Labeling ===

# Add the numeric label required by the ML pipeline
label_map = {"urgent": 0, "normal": 1, "noise": 2}
df_final["label_id"] = df_final["label"].map(label_map)

# 80/10/10 Split
train = df_final.sample(frac=0.80, random_state=42)
remaining = df_final.drop(train.index)
val = remaining.sample(frac=0.50, random_state=42)
test = remaining.drop(val.index)

print(f"\nFinal dataset sizes:")
print(f"  Train : {len(train)}")
print(f"  Val   : {len(val)}")
print(f"  Test  : {len(test)}")

# === Step 8: Save ===
os.makedirs(FINAL_DIR, exist_ok=True)

df_final.to_csv(os.path.join(FINAL_DIR, "dataset.csv"), index=False)
train.to_csv(os.path.join(FINAL_DIR, "train.csv"), index=False)
val.to_csv(os.path.join(FINAL_DIR, "val.csv"), index=False)
test.to_csv(os.path.join(FINAL_DIR, "test.csv"), index=False)

print(f"\nAll final splits saved to: {FINAL_DIR}")
print("Dataset generation completed.")
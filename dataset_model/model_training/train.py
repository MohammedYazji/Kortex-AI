import torch
import pandas as pd
from datasets import Dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns


def train_model(MODEL_NAME, OUTPUT_DIR):

    # Load dataset (train / validation / test)
    train_df = pd.read_csv("train.csv")
    val_df   = pd.read_csv("val.csv")
    test_df  = pd.read_csv("test.csv")

    # Convert pandas DataFrame into HuggingFace Dataset format
    train_dataset = Dataset.from_pandas(train_df)
    val_dataset   = Dataset.from_pandas(val_df)
    test_dataset  = Dataset.from_pandas(test_df)

    # Load tokenizer for selected transformer model
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    # Tokenization function (applied to all datasets)
    def tokenize(example):
        return tokenizer(
            example["message_text"],
            truncation=True,
            padding="max_length",
            max_length=128
        )

    # Apply tokenization
    train_dataset = train_dataset.map(tokenize, batched=True)
    val_dataset   = val_dataset.map(tokenize, batched=True)
    test_dataset  = test_dataset.map(tokenize, batched=True)

    # Rename label column to match Trainer expectations
    train_dataset = train_dataset.rename_column("label_id", "labels")
    val_dataset   = val_dataset.rename_column("label_id", "labels")
    test_dataset  = test_dataset.rename_column("label_id", "labels")

    # Set PyTorch tensor format for training
    train_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])
    val_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])
    test_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])

    #  Evaluation metrics (Accuracy, Precision, Recall, F1)
    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        preds = logits.argmax(axis=1)

        precision, recall, f1, _ = precision_recall_fscore_support(
            labels, preds, average="macro"
        )
        acc = accuracy_score(labels, preds)

        return {
            "accuracy": acc,
            "f1": f1,
            "precision": precision,
            "recall": recall
        }

    # Load pre-trained transformer model
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=3
    )

    # Training configuration (hyperparameters + saving rules)
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=3,
        per_device_train_batch_size=32,
        per_device_eval_batch_size=64,
        learning_rate=2e-5,
        warmup_steps=100,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="epoch",
        logging_steps=50,
        fp16=torch.cuda.is_available(),
        report_to="none",
        load_best_model_at_end=True,
        metric_for_best_model="f1"
    )

    # Trainer (handles training loop automatically)
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
    )

    # Start training process
    trainer.train()

    # Evaluate model on test set
    results = trainer.evaluate(test_dataset)
    print("Test Results:", results)

    # Get predictions for deeper evaluation
    predictions = trainer.predict(test_dataset)
    y_pred = predictions.predictions.argmax(axis=1)
    y_true = predictions.label_ids

    # Class labels
    labels = ["noise", "normal", "urgent"]

    # Print classification report
    print("\nClassification Report:\n")
    print(classification_report(y_true, y_pred, target_names=labels))

    # Confusion Matrix visualization
    cm = confusion_matrix(y_true, y_pred)

    plt.figure(figsize=(6,5))
    sns.heatmap(cm, annot=True, fmt="d",
                xticklabels=labels,
                yticklabels=labels)

    plt.xlabel("Predicted Label")
    plt.ylabel("True Label")
    plt.title(f"Confusion Matrix - {MODEL_NAME}")
    plt.show()
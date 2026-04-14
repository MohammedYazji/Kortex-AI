# Kortex AI — Focus Filter: Notification Classifier

An intelligent notification management system that classifies incoming mobile notifications into three categories — **Urgent**, **Normal**, and **Noise** — to help users maintain focus without missing critical alerts.

## Overview

Kortex AI uses a fine-tuned language model to silently filter and route notifications in real time:

| Label | Description | Action |
|-------|-------------|--------|
| **URGENT** | Emergencies, crises, critical alerts | Notify immediately, override focus mode |
| **NORMAL** | Work messages, social, deliveries | Queue and deliver when focus session ends |
| **NOISE** | Spam, promotions, irrelevant alerts | Silence completely |

## Model

The primary model is **DistilBERT** (`distilbert-base-uncased`), fine-tuned and evaluated across 5 dataset versions. Additional models (BERT, MiniLM, MPNet, MobileBERT) were benchmarked on the final dataset for comparison.

### Final Results (V5 Dataset)

| Model | Accuracy | F1 Score | Speed (sps) |
|-------|----------|----------|-------------|
| **DistilBERT ★** | **94.00%** | **0.9400** | — |
| MPNet | 92.38% | 0.9240 | 464 |
| MobileBERT | 92.00% | 0.9200 | — |
| BERT | 91.73% | 0.9175 | 555 |
| MiniLM | 90.96% | 0.9099 | 1,982 |

★ **DistilBERT is the recommended production model** — highest accuracy with fast inference (1,061+ samples/sec).

## Dataset

The dataset was built iteratively across 5 versions, always maintaining balanced class distribution (equal samples per class).

| Version | Total | Per Class | Key Change |
|---------|-------|-----------|------------|
| v1 | 4,716 | 1,572 | Baseline: Enron + SMS Spam + Synthetic urgent |
| v2 | 5,652 | 1,884 | Removed Enron, added SpamAssassin + more synthetic |
| v3 | 5,892 | 1,964 | Fix files for delivery, transactional, security failures |
| v4 | 5,892 | 1,964 | Added Maternal Health + CrisisAwareTweets + Human Chat |
| **v5 ★** | **7,741** | **2,580** | Removed app prefixes + Arabic noise, added targeted fixes |

## Report

The full report (`Kortex_AI_Report_.docx`) covers:
- Project overview and classification system design
- Dataset construction methodology across all 5 versions
- Class balancing strategy
- Per-version training and evaluation results (confusion matrices, metrics)
- Multi-model comparison on the final V5 dataset
- Final recommendation and deployment decision

## Conclusion

> **Deploy: DistilBERT trained on V5 dataset (seed=7, epoch=3)**

The V1→V5 progression shows that targeted dataset improvements — removing low-quality sources, adding edge cases, and cleaning synthetic noise — are more effective than simply increasing data volume.

### Try Kortex Now!!

[Try Kortex](https://expo.dev/accounts/mohammed_yazji/projects/kortex/builds/b4c2de5b-7501-4c6c-8d08-aa7c31cd94d7)
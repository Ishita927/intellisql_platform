# from sentence_transformers import SentenceTransformer

# _model = None


# def get_model() -> SentenceTransformer:
#     global _model
#     if _model is None:
#         _model = SentenceTransformer("all-MiniLM-L6-v2")
#     return _model


# def embed_text(text: str) -> list[float]:
#     model = get_model()
#     vector = model.encode(text, normalize_embeddings=True)
#     return vector.tolist()


# EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 output size

import os
import requests

HF_TOKEN = os.getenv("HF_TOKEN")
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
HF_EMBEDDING_URL = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{EMBEDDING_MODEL}"

EMBEDDING_DIM = 384


def embed_text(text: str) -> list[float]:
    if not HF_TOKEN:
        raise RuntimeError("HF_TOKEN not set in .env")

    response = requests.post(
        HF_EMBEDDING_URL,
        headers={"Authorization": f"Bearer {HF_TOKEN}"},
        json={"inputs": text, "options": {"wait_for_model": True}},
        timeout=30,
    )
    response.raise_for_status()
    result = response.json()

    # response is typically a nested list (token-level) or already pooled — normalize to a single vector
    if isinstance(result[0], list):
        # mean-pool across tokens if the API returns per-token embeddings
        import statistics
        cols = list(zip(*result))
        return [statistics.mean(col) for col in cols]
    return result
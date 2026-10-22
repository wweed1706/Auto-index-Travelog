# Auto-Indexing research

**Research question:** How can timestamp, GPS and image features be combined to group trip photos into meaningful events when metadata is incomplete?

## Planned experiments

1. **Baseline A:** chronological gap segmentation (time only).
2. **Baseline B:** time + GPS distance.
3. **Hybrid:** time + GPS + image embeddings.
4. **Ablation:** remove feature families and measure the impact.
5. **Missingness:** hide GPS in 20%, 40%, 60% of labeled photos.
6. **Runtime:** measure processing time on 100, 300 and 500 photos.

Metrics: ARI, NMI, pairwise F1, duplicate detection precision/recall, and processing time.

## Dataset protocol

- Obtain consent and permission before using travel photos.
- Label event boundaries consistently. Revisiting a location later may be another event.
- Split by **trip**, not randomly by photo, to avoid leakage between tuning and evaluation.
- Images without sufficient evidence may remain **Unassigned**.
- Never treat inferred GPS as a confirmed GPS observation.
- Do not upload private images or location-bearing metadata to this public repo.
- Keep anonymized evaluation summaries and reproducibility notes in version control.

The algorithms are **not implemented yet**. Use separate experiments and compare against frozen baselines before making accuracy claims.

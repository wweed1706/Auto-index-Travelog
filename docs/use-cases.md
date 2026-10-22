# Use Case Catalog — ReTrip v1.0

**Actors:** Guest, Registered User, Photo Library/OS, Map Service, AI Service, Public Viewer.  
**Note:** Auto-Indexing Engine and background workers are **internal components**, not external UML actors.

| ID | Use case | Priority |
| --- | --- | --- |
| UC-01 | Register account | P0 |
| UC-02 | Log in / log out | P0 |
| UC-03 | Manage trips | P0 |
| UC-04 | Select multiple photos | P0 |
| UC-05 | Upload and store photos | P0 |
| UC-06 | Extract and normalize metadata | P0 |
| UC-07 | Detect identical/near-duplicate photos | P0 |
| UC-08 | Auto-index and reconstruct travel events | P0 |
| UC-09 | Handle incomplete metadata | P0 |
| UC-10 | Review Unassigned photos | P0 |
| UC-11 | View event timeline | P0 |
| UC-12 | View stops on a map | P0 |
| UC-13 | Edit travel events | P0 |
| UC-14 | Merge/split events | P0 |
| UC-15 | Move photos between events | P0 |
| UC-16 | Confirm/correct inferred fields | P0 |
| UC-17 | Re-run indexing with preserved corrections | P0 |
| UC-18 | Generate grounded AI journal draft | P1 |
| UC-19 | Edit journal | P1 |
| UC-20 | Share trip read-only | P1 |
| UC-21 | Revoke sharing / privacy control | P1 |
| UC-22 | View processing status and retry | P0 |

## High-risk acceptance scenarios

- **UC-08:** Unusable time/GPS leaves a photo Unassigned; the job remains reportable.
- **UC-09:** No GPS does not mean a geographical distance of zero.
- **UC-17:** User-confirmed edits override later inferred results.
- **UC-18:** AI cannot assert unverified place names or activities as facts.
- **UC-20/21:** Private by default; revoked links stop working.

These are high-level use cases. Detailed main/alternate/exception flows belong in the SRS.

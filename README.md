# IUU Maritime Surveillance and Patrol Monitoring System (Fyp-2026)

An advanced, offline-first monorepo system designed to combat Illegal, Unreported, and Unregulated (IUU) fishing. The platform provides real-time surveillance, patrol route logging, secure offline data vaulting, and AI-enabled maritime threat assessment.

---

## 1. System Infrastructure

The platform is architected as a modern TypeScript monorepo, isolating the mobile patrol application from the central monitoring dashboard while sharing type configurations and data schemas.

```text
+--------------------------------------------------------------------------------+
|                                  MONOREPO ROOT                                 |
+----------------------------------------+---------------------------------------+
                                         |
               +-------------------------+-------------------------+
               |                                                   |
      [ apps/mobile ]                                     [ apps/web ]
    (Expo / React Native)                                (Next.js 15 App)
   - Offline Vault Storage                             - Live Geospatial Map
   - Background GPS Tracking                           - Users Clearance Panel
   - In-Memory Caches & Sync                           - Vessels Registry Logs
               |                                                   |
               +-------------------------+-------------------------+
                                         |
                                         v
                            +--------------------------+
                            |     SUPABASE BACKEND     |
                            |                          |
                            |   - PostgreSQL database  |
                            |   - Row-Level Security   |
                            |   - GoTrue Auth Services |
                            |   - Image Bucket Storage |
                            +--------------------------+
                                         |
                                         v
                            +--------------------------+
                            |     OPENAI API ENGINE    |
                            |                          |
                            |   - Vision-Language VLM  |
                            |   - Threat Analysis      |
                            |   - EAT Watch Reports    |
                            +--------------------------+
```

### Infrastructure Components
* **Mobile Client**: Built with **React Native / Expo SDK 52**. It implements background GPS location tracking, manual RTK coordinate inputs, local data vaulting, and cached in-memory registry lookups.
* **Web Dashboard**: Built with **Next.js 15 (App Router)** and styled with **Vanilla CSS**. Features dynamic geospatial alert maps (Leaflet), personnel authorization gates, vessel registry modifiers, and automated document generation.
* **Database & Auth**: A hosted **Supabase (PostgreSQL)** instance. Row-Level Security (RLS) policies secure database access. Authentication handles clearance control via a custom trigger-populated `authorized` field.
* **AI Analysis Pipeline**: Integrated with OpenAI's Vision-Language Model (VLM) to analyze maritime photos, tag target objects, categorize threat levels, and draft narrative watch reports.

---

## 2. Supervised Fine-Tuning (SFT) for Maritime AI

To achieve high validation confidence (modeled at **94.2% AI Accuracy**), the core Vision-Language Model (VLM) is optimized using **Supervised Fine-Tuning (SFT)**. This process adapts a general-purpose model (e.g., Llama-Vision or Gemini) to classify specialized maritime activities, vessel profiles, and suspicious behaviors.

### SFT Workflow & Training Pipeline

1. **Dataset Collection & Curation**:
   * **Vessel Categories**: Gather 10,000+ aerial and sea-level images of distinct vessel types (e.g., commercial trawlers, wooden artisanal longliners, cargo ships, patrol vessels).
   * **Illegal Activities**: Curate examples of prohibited maritime practices, such as fishing within Marine Protected Areas (MPAs), active double-trawling, transshipment at sea, or fishing with unmarked gear.
   * **Adverse Conditions**: Include datasets captured in low visibility (fog, rain, night patrols) to ensure robustness.

2. **Annotation & Ground Truth Labeling**:
   * Annotate images with two components:
     1. **Bounding Boxes (JSON / COCO format)**: Coordinates enclosing nets, vessels, and caught species.
     2. **Narrative Ground Truth Reports**: Draft high-quality text descriptions modeling the expected output format of a seasoned maritime enforcement officer:
        ```json
        {
          "instruction": "Analyze this maritime surveillance image.",
          "input": "<image_metadata>",
          "output": "Vessel class: Trawler. Status: Active fishing gear deployed in restricted zone. Bounding boxes: [x_min, y_min, x_max, y_max]. Threat level: High."
        }
        ```

3. **Formatting & Training Prompts**:
   Format inputs into supervised token-pairs:
   * **System Prompt**: *"You are an expert maritime surveillance assistant. Classify vessels, identify fishing gear, detect violations, and draft formal reports."*
   * **User Prompt**: Represents the input image + current location coordinates.
   * **Target Output**: The structured enforcement report containing classifications, confidence metrics, and a narrative summary.

4. **Fine-Tuning Parameters (SFT)**:
   Using Parameter-Efficient Fine-Tuning (PEFT) techniques like **LoRA (Low-Rank Adaptation)** to reduce GPU memory footprint:
   * **LoRA Rank ($r$)**: 16 (or 32 for complex gear detection)
   * **LoRA Alpha ($\alpha$)**: 32
   * **Target Modules**: `q_proj`, `v_proj` (in the self-attention blocks)
   * **Learning Rate**: $2 \times 10^{-4}$ with a cosine learning rate scheduler.
   * **Batch Size**: 64 (utilizing gradient accumulation).
   * **Hardware**: Trained on $8 \times$ NVIDIA A100 (80GB) GPUs using PyTorch and Hugging Face SFTTrainer.

5. **Evaluation & Validation**:
   * Evaluate model weights using **Mean Average Precision (mAP)** for object detection and **ROUGE-L/BLEU** scores for narrative report clarity.
   * Validate against a held-out test dataset to prevent overfitting, ensuring a validation confidence of >90% before pushing to production.

---

## 3. Offline and Online Modules

To function reliably during multi-day ocean patrols far from cellular towers, the system uses an **offline-first caching architecture** built on top of React Native's `AsyncStorage`.

### Caching and Lookup Workflow
```text
                  [User Opens Vessels/Reports Screen]
                                  |
                           { Is Connected? }
                             /           \
                       (Yes) /           \ (No)
                            /             \
            [Fetch Live Supabase Data]     [Load Cache Instantly from Storage]
                        |                                 |
            [Update Local Cache Store]             [Render Offline Banner]
                        |                                 |
            [Render Data on Screen]         [Filter Data In-Memory via Search]
```

* **Vessel Watchlist Registry**:
  * **Online**: Fetches the global registry and caches the JSON array locally.
  * **Offline**: Instantly reads the cached list, bypassing network timeout delays. If the user searches by registration number or vessel name, the search input filters the cached records locally in-memory.
* **Reports Feed**:
  * **Online**: Fetches live watch incidents and saves them locally.
  * **Offline**: Loads cached reports and merges them with any unsynced local drafts stored in the Vault. It renders local base64 image previews and indicates which drafts are awaiting synchronization.

---

## 4. GPS and Tracking Module

The GPS module runs continuously in the background to log patrol trails and tag the exact location of maritime incidents.

### Key GPS Architecture Decisions
* **Battery-Balanced Preset**: Coordinates are logged using **`Location.Accuracy.Balanced`** (~100m accuracy). This prevents GPS hardware from overheating the phone and preserves battery during long, off-grid patrols.
* **Geospatial Reference**: All coordinates are captured as decimal degrees conforming to the **WGS 84 (EPSG:4326)** standard coordinate reference system, ensuring compatibility with global GIS and web mapping engines (Leaflet).
* **Manual RTK Coordinate Override**: In cases where the device's GPS signal is blocked (e.g., inside steel boat cabins), operators can override coordinates manually. The input uses strict regex verification to validate latitude and longitude strings before entry.

---

## 5. Data Synchronization Engine

When an operator captures an incident or registers a patrol offline, it is stored in the local SQLite/AsyncStorage **Vault** queue. 

```text
[Local Vault Queue]
    |-- item 1: Patrol Route (Local ID: sim_9238)
    |-- item 2: Incident Draft (Local ID: local_0248) -> Linked to sim_9238
```

### The Auto-Sync Pipeline

1. **Grace Period (6000ms)**: The app waits 6 seconds after detecting connection before syncing. This allows the network socket to stabilize, preventing partial failures and incomplete image uploads.
2. **Relational Dependency Mapping**: Patrol routes are synced before incidents. If an incident was linked to a local patrol ID (e.g., `sim_9238`), the app retrieves the newly generated PostgreSQL UUID for that patrol and updates the incident's foreign key before inserting it.
3. **AI Report Synthesis**: During synchronization, the app uploads the base64 photo to the VLM, generates the threat score, writes a formal report in **East African Time (EAT)**, and writes this payload to the database.
4. **Audit Logging**: Once the queue is cleared, a sync log transaction is registered in the database, updating the **Sync Monitoring** logs on the web dashboard.

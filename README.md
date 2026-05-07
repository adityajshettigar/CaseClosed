
<div align="center">

# ⚖️ Case Closed ⚖️ 
**The Next-Generation Legal Intelligence & Practice Management Platform.**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Chakra UI](https://img.shields.io/badge/chakra-%234ED1C5.svg?style=for-the-badge&logo=chakraui&logoColor=white)](https://chakra-ui.com/)
[![Framer Motion](https://img.shields.io/badge/Framer-black?style=for-the-badge&logo=framer&logoColor=blue)](https://www.framer.com/motion/)


</div>

## 📖 Overview
**Case Closed** is an enterprise-grade legal practice management suite designed to replace fragmented legacy tools. Built for modern law firms, it combines highly secure docket tracking, visual conflict-of-interest mapping, compliant IOLTA trust accounting, and automated document assembly into a single, aggressively optimized interface.

---

## ⚡ Core Features & Architecture

### 🗂️ Case Management
* **Smart Case Entry:** A streamlined, multi-step intake wizard designed to capture critical metadata (Judges, Opposing Counsel, Incident Dates) without overwhelming administrative friction.
* **Dynamic Timeline:** An interactive, chronologically sorted ledger of all case events, motions, and hearings, allowing for direct file attachments and summary logs.

### 🏦 Integrated IOLTA Trust Ledger & Ghost Billing
Trust accounting compliance built directly into the case file.
* **Ethics Compliance:** Track Retainer Deposits, Hard Costs, and Expenses in an isolated ledger.
* **Passive Time Capture:** Logging billable hours on the hearing timeline automatically multiplies the time by the firm's hourly rate and deducts it from the available Trust Balance in real-time, preventing ethics violations regarding client funds.

### ⏳ SOL (Statute of Limitations) Warning Engine
Missing a deadline is the #1 cause of legal malpractice. 
* The SOL Engine tracks the "Date of Incident" captured during intake and automatically calculates the 2-year expiration deadline.
* Triggers high-contrast, aggressive UI warnings when an active case enters the 90-day critical filing zone.

### 📄 Automated Document Assembly
Eliminate manual data entry and formatting errors. 
* The built-in Template Engine takes real-time case metadata (Client Names, Case Numbers, Judge details) and instantly injects them into pre-formatted, court-ready legal pleadings.
* Features one-click generation for documents like *Notices of Appearance* and *Subpoenas*.

### 🕸️ Entity Graph (Conflict Checker)
A 2D Force-Directed physics graph that visually maps all entities across a lawyer's entire historical docket. 
* Instantly identify intersections between clients, opposing counsel, and presiding judges.
* Features a HUD legend, real-time node highlighting, and a global entity search bar to prevent malpractice conflicts before taking on a new client.

### 🔍 Evidence Vault (Simulated AI OCR)
A secure dropzone for legal discovery. 
* Upload PDFs or image scans to the vault, where the platform simulates an AI Vision extraction pipeline.
* Indexes documents, making named entities and clauses fully searchable across the firm's database. 
* Features a dedicated, distraction-free reading modal for reviewing extracted text.

### 🏛️ Archival Dossier
* **Case Conclusion:** Successfully litigated cases are marked "Closed" and automatically migrated from the active dashboard to the lawyer's Profile.
* Creates a permanent, searchable historical dossier of career victories while keeping the primary workspace clean.

---

## 🛠️ Technology Stack

* **Frontend Framework:** React 18
* **Routing:** React Router v6
* **UI/UX & Styling:** Chakra UI (Custom Luxury Theme)
* **Animation:** Framer Motion (Spring physics, staggered layouts)
* **Backend & Auth:** Firebase Auth
* **Database:** Cloud Firestore (NoSQL, Real-time listeners)
* **Data Visualization:** `react-force-graph-2d`
* **File Handling:** `react-dropzone`

---

## 🎨 Design System
The platform utilizes a strict, high-contrast editorial aesthetic inspired by tier-1 publications and modern SaaS.
* **Colors:** Deep Off-Black (`#0C0C0C`), Legal Gold (`#C9A84C`), Parchment (`#F7F5F0`).
* **Typography:** `Playfair Display` (Headings), `Syne` (Body), `DM Mono` (Data/Labels).

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v16 or higher)
* A Firebase Project (Spark Plan is sufficient)

### 1. Clone & Install
```bash
git clone [https://github.com/yourusername/case-closed.git](https://github.com/yourusername/case-closed.git)
cd case-closed/client
npm install
```

### 2. Environment Variables
Create a `.env` file in the `client` directory and add your Firebase config:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
# Optional: Silence source map warnings
GENERATE_SOURCEMAP=false
```

### 3. Configure Firestore Security Rules
To ensure the Evidence Vault and Client data remain secure, apply the following rules in your Firebase Firestore console:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Restrict Case Data
    match /cases/{caseId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.lawyerId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.lawyerId;
    }
    // Restrict Evidence Vault
    match /evidence/{documentId} {
      allow read, delete: if request.auth != null && request.auth.uid == resource.data.lawyerId;
      allow create, update: if request.auth != null && request.auth.uid == request.resource.data.lawyerId;
    }
  }
}
```

### 4. Run the Application
```bash
npm start
```

---

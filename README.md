# Testify AI – Live Avatar Coaching & Witness Simulation

## Overview

This project is a full-stack system for running **live AI avatar sessions** for coaching and legal/witness simulations.

- **Frontend:** Next.js app (`testify-nextjs`)
- **Backend:** Node.js/Express API server (`backend`)
- **Optional (legacy):** Flutter client (`testify_app`, kept only as reference)

The system streams a HeyGen avatar over LiveKit, uses voice input (microphone), and drives the avatar’s behavior with LLMs (YTL ILMU with OpenAI fallback) and HeyGen Knowledge Bases.

---

## Project Architecture

### High-level structure

- **Next.js frontend (`testify-nextjs`)**
  - UI for configuring and running live sessions
  - Session lobby and session-config page
  - Live interaction page with streaming avatar, voice input, and transcription
  - Calls backend APIs for HeyGen, LLM processing, and session management

- **Node.js backend (`backend`)**
  - Express routes for:
    - HeyGen session start / streaming
    - LLM processing endpoint using YTL ILMU and OpenAI
    - Session creation and storage
    - HeyGen Knowledge Base integration
  - Encapsulates all calls to external services and knowledge base fetching

- **Data flow (simplified)**
  1. User configures a session in the Next.js app (avatar, language, knowledge base, etc.).
  2. Frontend creates a session via the backend `/api/sessions` endpoint.
  3. Frontend calls backend to create a HeyGen streaming session and connect to LiveKit.
  4. Frontend sends greetings and user messages to the backend LLM endpoint.
  5. Backend uses YTL ILMU/OpenAI plus the selected HeyGen Knowledge Base to generate responses.
  6. Responses are sent back to the frontend and spoken by the avatar via HeyGen.

---

## Session Management

### Session configuration

- Users configure sessions on the **Session Config** page in the Next.js app.
- Key options stored in the session include:
  - **Avatar ID** (which HeyGen avatar to use)
  - **Quality** (e.g., medium)
  - **Language** (e.g., `en-US`)
  - **Knowledge Base ID** (selected HeyGen KB that defines persona/behavior)
- When the user creates a session, the frontend sends these values to the backend `/api/sessions` route, which stores the session data in memory (with a generated session ID).

### Live session

- The **Live** page loads the session by ID using the Next.js API.
- With the session data it:
  - Initializes a HeyGen streaming session through the backend
  - Connects to LiveKit for audio/video
  - Sends an initial greeting request to the backend LLM endpoint
  - Then handles ongoing user messages via the same LLM endpoint

---

## HeyGen Integration

### Streaming avatar

- The backend exposes endpoints that wrap HeyGen’s streaming APIs.
- When the frontend starts a session:
  - It calls a backend route that creates a HeyGen session with:
    - Avatar ID
    - Video quality
    - Language
    - **Knowledge Base ID (knowledge_id)**
  - The backend returns the LiveKit URL and access token.
  - The frontend connects to LiveKit using those credentials and attaches:
    - Video track to the `<video>` element
    - Audio track to the `<audio>` element

### Knowledge Base system

- The backend integrates with HeyGen’s Knowledge Base APIs to:
  - **List** all knowledge bases from the HeyGen account
  - **Fetch details** for a specific knowledge base (including `prompt` / persona instructions)
- The Next.js app fetches the list of knowledge bases and exposes them in a dropdown on the **Session Config** page.
- When the user selects a knowledge base (e.g., **Business Coach**), its ID is stored with the session and passed down to:
  - The backend when creating the HeyGen session (as `knowledge_id`)
  - The backend LLM endpoint when generating the avatar’s greeting and all follow-up responses
- The backend uses the HeyGen knowledge base prompt as the **system prompt** for the LLM so that the avatar’s persona and behavior match the selected knowledge base.

---

## Keyboard Interrupts (ESC to stop avatar)

- The live page listens for the **ESC key** globally when the session is active.
- When the user presses ESC:
  - A request is sent to interrupt/stop the current avatar speech.
  - The backend/HeyGen session is updated so that the avatar stops speaking as soon as possible.
  - The UI updates to show that speech has been interrupted.
- This gives the operator immediate control if the avatar starts saying something long or off-target.

---

## Microphone & Voice Input

### Voice recording

- The frontend uses the browser’s media APIs to access the microphone.
- A record button allows the user to start and stop recording.
- Audio is captured, processed, and then sent for transcription/LLM processing.

### Audio level visualization

- While recording, the UI shows **audio level / volume indicators** so the user can see that their microphone is working and how loud the input is.
- This helps users adjust their speaking volume and troubleshoot mic issues.

### Transcription

- Recorded audio is sent for speech-to-text transcription.
- The resulting text is:
  - Displayed in the UI as the recognized user message
  - Sent to the LLM backend as the user’s input for generating the avatar’s response

---

## Language Support

- Sessions support **multiple languages**.
- On the Session Config page, users can choose a language (e.g., `en-US`).
- That language setting is used for:
  - Creating the HeyGen session (so the avatar speaks the correct language/voice)
  - Passing language information to the LLM backend so the model can respond appropriately
- The system is designed so that greetings and responses respect the selected language as much as possible.

---

## Knowledge Base–Driven Persona

- The selected HeyGen Knowledge Base fully defines the avatar’s **persona and domain**:
  - Example: **Business Coach** – friendly, practical business guidance
  - Example: Legal/witness examination persona – formal, court-oriented questioning
- For each LLM call, the backend:
  1. Checks if a Knowledge Base ID was provided.
  2. If yes, fetches the KB details and uses the KB prompt as the system instructions.
  3. Uses that prompt to generate:
     - The **initial greeting** (first message when the session starts)
     - All **follow-up responses** to the user’s questions
- If no knowledge base is provided, the backend falls back to a default legal/witness-oriented prompt.

---

## LLM Integration (YTL ILMU + OpenAI)

- The backend uses **YTL ILMU** as the primary LLM provider for conversation handling.
- Key behaviors:
  - Uses the knowledge base prompt (when available) as the system prompt.
  - Generates short, speech-friendly responses for the avatar.
- **OpenAI fallback** is available when YTL ILMU is unavailable or errors occur.
- The frontend never talks directly to the LLM providers:
  - It always calls the backend `/api/llm/process` endpoint
  - The backend decides which provider to use and how to apply the knowledge base content

---

## How everything fits together

1. **Configure session** in Next.js (avatar, language, knowledge base).
2. **Create session** via backend; session data (including knowledge base ID) is stored.
3. **Start live session**:
   - Backend creates HeyGen streaming session with the selected avatar, language, and KB ID.
   - Frontend connects to LiveKit and displays the avatar video/audio.
4. **Initial greeting**:
   - Frontend asks the backend LLM endpoint for a greeting.
   - Backend uses the selected knowledge base to generate a persona-correct greeting.
   - Frontend sends the greeting text to HeyGen to be spoken by the avatar.
5. **Ongoing conversation**:
   - User speaks; microphone captures audio.
   - Audio is transcribed to text and sent to the backend LLM endpoint.
   - Backend uses knowledge base + LLM (YTL ILMU/OpenAI) to generate responses.
   - Responses are spoken by the avatar and added to the transcript.
6. **Keyboard interrupt (ESC)** lets the operator stop avatar speech at any time.

This README is intended as a high-level guide for developers. For implementation details, inspect the code in `backend` and `testify-nextjs` (especially the live session page, session APIs, HeyGen service, and LLM routes).

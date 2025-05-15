# VAR Vendetta

VAR Vendetta is a Next.js application that helps record and analyze player decisions in sports. It uses hybrid retrieval methods (BM25 + vector search) to find relevant context from past decisions and generate AI-powered responses to questions.

## Project Structure

The project is split into two main parts:

- **Backend**: Next.js API routes with TypeScript, Prisma, FAISS and BM25 for retrieval
- **Frontend**: Next.js client application with React and TypeScript

## Requirements

- Node.js 16+ and npm/yarn
- HuggingFace API key (for embeddings)
- OpenRouter API key (for AI responses)

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Add your API keys to the `.env` file:
   ```
   HF_API_TOKEN=your_huggingface_api_token_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

5. Initialize the database:
   ```bash
   npx prisma db push
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The backend server will be available at http://localhost:3000.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

4. Adjust the API URL in `.env.local` if needed:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:3001.

## API Endpoints

### `/api/log`
- **Method**: POST
- **Description**: Log text with timestamp
- **Body**:
  ```json
  {
    "text": "This is a sample transcript to be logged.",
    "timestamp": "2023-10-10T12:00:00.000Z"
  }
  ```

### `/api/embed`
- **Method**: POST
- **Description**: Generate embeddings for text
- **Body**:
  ```json
  {
    "text": "This is a sample text to generate embeddings for."
  }
  ```

### `/api/ask-ref`
- **Method**: POST
- **Description**: Question answering with context
- **Body**:
  ```json
  {
    "question": "What was discussed about APIs?"
  }
  ```

### `/api/transcribe` (Placeholder)
- **Method**: POST
- **Description**: Placeholder for transcription (currently handled by frontend)

## Testing with Postman

A Postman collection is available in the backend directory for testing the API endpoints:

```
backend/var-vendetta-api.postman_collection.json
```

Import this collection into Postman to test the API endpoints.

## Features

- Real-time speech-to-text transcription using the Web Speech API
- Logging of transcriptions to a database with timestamps
- Vector search using FAISS for semantic similarity
- Keyword search using BM25 for text retrieval
- Hybrid search combining both approaches
- AI-powered responses to questions using context from past transcriptions
- CORS middleware for cross-origin requests

## License

[MIT](LICENSE)

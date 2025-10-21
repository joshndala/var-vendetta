# CoachDeck 🏀⚽🎾

> **⚠️ Service Status: Currently Disabled**  
> CoachDeck is temporarily disabled as the Supabase instance has been shut down due to inactivity. The frontend has been modified to show a service unavailable message when users try to create sessions.  
>   
> **To reactivate the service:**  
> 1. Restart your Supabase instance  
> 2. Uncomment the session creation code in `frontend/src/app/page.tsx` (lines 18-20, 25-45, 52-56)  
> 3. Deploy the updated frontend  
>   
> **For users interested in using this service:**  
> - Contact me on LinkedIn: [https://www.linkedin.com/in/joshua-ndala/](https://www.linkedin.com/in/joshua-ndala/)  
> - Set it up yourself using this public GitHub repository  

CoachDeck is an AI-powered sports coaching assistant that analyzes conversation transcripts from coaching sessions and provides intelligent insights. It uses advanced hybrid retrieval (BM25 + FAISS) and Cohere's AI models to deliver sport-specific coaching analysis.

## 🚀 Features

- **Multi-Sport Support**: Basketball, Football, Soccer, Tennis, E-sports, and more
- **Hybrid Search**: Combines keyword (BM25) and semantic (FAISS) search for optimal results
- **AI-Powered Analysis**: Sport-specific coaching insights using Cohere's Command-R-Plus
- **Smart Tagging**: Automatic tagging of coaching moments with sport-relevant labels
- **Real-time Processing**: Instant analysis of coaching sessions
- **Vector Embeddings**: 1024-dimensional embeddings for superior semantic understanding
- **Reranking**: Advanced result reranking for more relevant context selection

## 🏗️ Architecture

### **Backend Stack**
- **Framework**: Next.js API routes with TypeScript
- **Database**: Supabase (PostgreSQL) with JSONB support
- **Vector Search**: FAISS for in-memory similarity search
- **AI Services**: Cohere (embeddings, reranking, LLM)
- **Search**: BM25 for keyword-based retrieval

### **Frontend Stack**
- **Framework**: Next.js 14 with React and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks and context
- **Real-time**: Web Speech API for transcription

## 📋 Requirements

- Node.js 18+ and npm/yarn
- Cohere API key
- Supabase account and project

## 🛠️ Getting Started

### **Backend Setup**

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file:**
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Cohere AI Services
   COHERE_API_KEY=your_cohere_api_key
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   ```

5. **Initialize Supabase database:**
   ```bash
   # From project root
   cd ../supabase
   supabase start
   supabase db reset
   ```

6. **Start the development server:**
   ```bash
   cd ../backend
   npm run dev
   ```

The backend server will be available at **http://localhost:3001**

### **Frontend Setup**

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```

4. **Update API URL in `.env.local`:**
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

The frontend will be available at **http://localhost:3000**

## 🔌 API Endpoints

### **Core Endpoints**

#### `POST /api/log`
Log coaching session transcripts with sport-specific context.

**Request Body:**
```json
{
  "text": "Player made an amazing dunk over the defender",
  "timestamp": "2025-07-23T03:25:00Z",
  "sport": "basketball"
}
```

**Response:**
```json
{
  "id": "73a1c8c1-bb75-48f9-b51d-514648bbd8cb",
  "text": "Player made an amazing dunk over the defender",
  "timestamp": "2025-07-23T03:25:00.000Z"
}
```

#### `POST /api/ask-ref`
Get AI-powered coaching analysis with hybrid search and reranking.

**Request Body:**
```json
{
  "question": "How did the player perform defensively?"
}
```

**Response:**
```json
{
  "answer": "Based on the provided transcripts, the player demonstrated excellent defensive positioning...",
  "sources": [
    {
      "id": "snippet-id",
      "text": "Player showed excellent defensive positioning and blocked three shots",
      "score": 1.0,
      "source": "hybrid"
    }
  ]
}
```

#### `POST /api/embed`
Generate 1024-dimensional embeddings using Cohere's embed-english-v3.0 model.

**Request Body:**
```json
{
  "text": "Player executed a perfect pick and roll"
}
```

**Response:**
```json
{
  "embeddings": [0.02684021, 0.00630188, ...]
}
```

#### `POST /api/tag-log`
Automatically tag coaching moments with sport-relevant labels.

**Request Body:**
```json
{
  "text": "Player made an amazing dunk over the defender"
}
```

**Response:**
```json
{
  "tags": ["clutch", "dunk"]
}
```

## 🏀 Supported Sports

CoachDeck supports multiple sports with specialized analysis:

### **Basketball**
- **Tags**: shot, pass, rebound, defense, fast_break, pick_and_roll, three_pointer, layup, dunk, free_throw, assist, steal, block, turnover, foul, timeout, substitution
- **Analysis Focus**: Shooting accuracy, ball movement, defensive positioning, rebounding, transition play

### **Football/Soccer**
- **Tags**: goal, assist, pass, shot, tackle, save, foul, yellow_card, red_card, penalty, corner, free_kick
- **Analysis Focus**: Passing accuracy, defensive positioning, tactical awareness, set-piece execution

### **Tennis**
- **Tags**: ace, serve, volley, forehand, backhand, smash, drop_shot, lob, fault, double_fault, break_point
- **Analysis Focus**: Serve consistency, shot selection, court positioning, mental game

### **E-sports**
- **Tags**: kill, assist, objective, rotation, positioning, communication, strategy, clutch
- **Analysis Focus**: Team coordination, strategic decision-making, mechanical skills

## 🔍 Search & Retrieval

### **Hybrid Search Architecture**
1. **BM25 Search**: Keyword-based retrieval for exact matches
2. **FAISS Search**: Semantic similarity using 1024-dimensional embeddings
3. **Cohere Rerank**: Advanced reranking for optimal result relevance
4. **Result Fusion**: Weighted combination of search methods

### **Vector Search Details**
- **Model**: Cohere embed-english-v3.0
- **Dimensions**: 1024 (vs 384 in previous models)
- **Index**: FAISS IndexFlatL2 for fast similarity search
- **Storage**: Supabase JSONB for persistence

## 🧠 AI Analysis Pipeline

### **Processing Flow**
1. **Input**: User question about coaching session
2. **Search**: Hybrid BM25 + FAISS retrieval
3. **Rerank**: Cohere rerank-english-v3.0 for relevance
4. **Context**: Top 3 reranked results with tags
5. **Analysis**: Cohere Command A with sport-specific prompts
6. **Output**: Detailed coaching analysis and recommendations

### **Sport-Specific Prompts**
Each sport has customized AI prompts that focus on:
- Sport-specific terminology and concepts
- Relevant performance metrics
- Appropriate coaching language
- Contextual analysis patterns

## 📄 License

This project is licensed under the MIT License.
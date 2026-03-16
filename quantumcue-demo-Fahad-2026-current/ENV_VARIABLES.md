# Environment Variables

This document lists all environment variables needed for the QuantumCue application.

## Required Environment Variables

### Backend (.env file in `backend/` directory)

#### Application
- `SECRET_KEY` - Secret key for JWT token signing (required)
  - Example: `your-secret-key-here-minimum-32-characters`

#### LLM Configuration
- `GROQ_API_KEY` - Groq API key (required for dataset labeling chat)
  - Get your API key from: https://console.groq.com/keys
  - Example: `gsk_...`
- `GROQ_MODEL` - Groq model to use (default: `llama-3.1-70b-versatile`)
  - Options: `llama-3.1-70b-versatile`, `mixtral-8x7b-32768`

#### Optional LLM Configuration
- `ANTHROPIC_API_KEY` - Anthropic Claude API key (optional, for job creation chat)
  - Example: `sk-ant-...`
- `LLM_MODEL` - LLM model to use (default: `claude-sonnet-4-20250514`)
- `LLM_TEMPERATURE` - LLM temperature (default: `0.7`)
- `LLM_MAX_TOKENS` - Maximum tokens (default: `2000`)
- `GEMINI_API_KEY` - Google Gemini API key (optional, kept for compatibility)
  - Get your API key from: https://makersuite.google.com/app/apikey
  - Example: `AIzaSy...`
- `GEMINI_MODEL` - Gemini model to use (default: `gemini-2.0-flash`)

#### Database Configuration
- `POSTGRES_USER` - PostgreSQL username (default: `quantumcue`)
- `POSTGRES_PASSWORD` - PostgreSQL password (default: `quantumcue_dev`)
- `POSTGRES_DB` - PostgreSQL database name (default: `quantumcue`)
- `POSTGRES_HOST` - PostgreSQL host (default: `postgres`)

#### MongoDB Configuration (Optional - has defaults)
- `MONGO_USER` - MongoDB username (default: `quantumcue`)
- `MONGO_PASSWORD` - MongoDB password (default: `quantumcue_dev`)
- `MONGO_DB` - MongoDB database name (default: `quantumcue_audit`)
- `MONGODB_URL` - Full MongoDB connection URL (default: auto-generated from above)

#### Redis Configuration (Optional - has defaults)
- `REDIS_URL` - Redis connection URL (default: `redis://redis:6379/0`)
- `REDIS_TTL_SECONDS` - Cache TTL in seconds (default: `3600`)

#### Other Configuration
- `APP_ENV` - Application environment (default: `development`)
- `DEBUG` - Debug mode (default: `True`)
- `LOG_LEVEL` - Logging level (default: `INFO`)
- `CORS_ORIGINS` - CORS allowed origins (default: `http://localhost:3000`)
- `SIGNUP_ENABLED` - Enable/disable end-user signup (default: `False`)
  - For the demo, signup is disabled. To re-enable: set `SIGNUP_ENABLED=true` in `backend/.env`.

### Frontend (.env file in `frontend/` directory)

- `VITE_API_BASE_URL` - Backend API base URL (default: `http://localhost:8000/api/v1`)

## Example .env Files

Example `.env.example` files are provided in both `backend/` and `frontend/` directories. 
Copy these to `.env` and update with your actual values:

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your actual values

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your actual values
```

### Quick Start - Minimum Required Variables

For `backend/.env`, you only need to set:

```bash
SECRET_KEY=your-secret-key-here-minimum-32-characters-long
GROQ_API_KEY=gsk_...
```

All other variables have sensible defaults that work with Docker Compose.

For `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Notes

1. **GROQ_API_KEY is required** for the dataset labeling chat feature to work. Without it, the LLM-powered labeling will fail. Gemini is kept for compatibility but is not used by default.

2. **MongoDB and Redis** have default configurations that work with Docker Compose. You only need to set custom values if you're using external services or different credentials.

3. **MongoDB and Redis are optional** - the application will continue to work without them, but:
   - Without MongoDB: Audit logs won't be saved (warnings will be logged)
   - Without Redis: Conversation context won't be cached (will work but may be slower)

4. All services (PostgreSQL, MongoDB, Redis) are automatically started/stopped with Docker Compose when using `manage-local.sh` or `docker-compose up/down`.


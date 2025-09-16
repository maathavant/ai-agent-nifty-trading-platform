# 🚀 Nifty 50 AI Trading System

## 📋 Repository Structure

This repository contains **only source code** and essential configuration files. Build files, dependencies, and sensitive data are excluded via `.gitignore`.

```
nifty-trading-system/
├── backend/                 # Node.js Express API server
│   ├── src/                # ✅ Source code (included)
│   │   ├── agents/         # AI trading agents
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API endpoints
│   │   └── middleware/     # Express middleware
│   ├── package.json        # ✅ Dependencies config (included)
│   ├── .env.example        # ✅ Environment template (included)
│   └── server.js           # ✅ Main server file (included)
├── frontend/               # React dashboard
│   ├── src/                # ✅ Source code (included)
│   │   ├── components/     # React components
│   │   ├── services/       # API clients
│   │   └── utils/          # Utility functions
│   ├── public/             # ✅ Static assets (included)
│   └── package.json        # ✅ Dependencies config (included)
├── docs/                   # ✅ Documentation (included)
├── .gitignore              # ✅ Git ignore rules (included)
└── README.md               # ✅ This file (included)
```

## 🚫 Excluded from Git (via .gitignore)

- `node_modules/` - Dependencies (install with `npm install`)
- `build/` & `dist/` - Build artifacts
- `.env` - Environment variables with secrets
- `logs/` - Application logs
- `coverage/` - Test coverage reports
- IDE files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)

## 🔐 Security

**⚠️ IMPORTANT**: Never commit sensitive data!

- API keys are stored in `.env` (excluded from git)
- Use `.env.example` as a template
- Secrets are never committed to the repository

## 🛠️ Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd nifty-trading-system
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your actual API keys
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000

# Optional
NODE_ENV=development
LOG_LEVEL=info
```

## 📁 What's Included in Git

### ✅ Source Code Files
- All `.js`, `.jsx`, `.ts`, `.tsx` files
- All `.css`, `.scss`, `.html` files
- React components and services
- Node.js agents and APIs

### ✅ Configuration Files
- `package.json` (dependencies)
- `.env.example` (template)
- Server configuration files
- Build configuration (webpack, babel, etc.)

### ✅ Documentation
- README files
- API documentation
- Code comments and JSDoc

### ✅ Assets
- Images and icons in `public/`
- Static assets needed for the app

## 🚫 What's Excluded from Git

### ❌ Build Artifacts
- `node_modules/`
- `build/` directories
- `dist/` directories
- Compiled files

### ❌ Sensitive Data
- `.env` files with actual secrets
- API keys
- Database credentials
- Private configuration

### ❌ Generated Files
- Log files
- Coverage reports
- Cache directories
- Temporary files

### ❌ IDE & OS Files
- `.vscode/`, `.idea/`
- `.DS_Store`, `Thumbs.db`
- Editor swap files

## 🔄 Development Workflow

### Adding New Files
```bash
# Add source files (will be included)
git add src/components/NewComponent.js

# Add configuration (will be included) 
git add package.json

# Environment variables (will be ignored)
# Modify .env locally, but don't commit it
```

### Building for Production
```bash
# Backend
cd backend && npm run build

# Frontend  
cd frontend && npm run build

# Build files are ignored by git
```

### Deployment
```bash
# Only source code is in git
# Build and deploy from CI/CD or production server
npm install      # Install dependencies
npm run build    # Build application
npm start        # Start production server
```

## 🔧 Available Scripts

### Backend
```bash
npm start        # Start production server
npm run dev      # Start development server
npm test         # Run tests
npm run build    # Build for production
```

### Frontend
```bash
npm start        # Start development server
npm run build    # Build for production
npm test         # Run tests
npm run eject    # Eject from create-react-app
```

## 📊 AI Features Included

- **Technical Analysis Agent** - AI-powered technical indicators
- **Market Sentiment Agent** - AI sentiment analysis
- **Research Agent** - AI news and fundamental analysis  
- **Risk Management Agent** - AI risk assessment
- **Multi-Agent Orchestrator** - Combines all AI insights

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

### Code Standards
- ESLint for JavaScript linting
- Prettier for code formatting
- JSDoc for function documentation
- Environment variables for configuration

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

### Common Issues

1. **Missing dependencies**: Run `npm install` in both backend and frontend
2. **Environment variables**: Copy `.env.example` to `.env` and configure
3. **API key errors**: Ensure valid OpenAI API key in `.env`
4. **Port conflicts**: Check if ports 3000 and 5000 are available

### Getting Help

- Check the documentation in `docs/`
- Review error logs (not committed to git)
- Ensure all environment variables are configured

---

**Built with ❤️ for AI-powered trading**
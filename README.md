# HireFlow - SaaS Hiring Pipeline Platform

A comprehensive SaaS platform that streamlines candidate screening, testing, onboarding, and training for employers. Built with modern JavaScript technologies and designed for scalability.

## 🚀 Features

### Core Functionality
- **User Authentication & Roles**: Multi-role system (Employer, HR Manager, Hiring Manager, Business Dev, Candidate)
- **Job Postings**: Create, manage, and publish job listings with advanced filtering
- **AI-Powered Assessments**: Cognitive tests, English proficiency, and situational judgment assessments
- **CRM Integration**: Lead and partner management with collaborative features
- **Onboarding & Training**: Customizable modules with progress tracking
- **Branding & Culture**: Company customization throughout the platform
- **Real-time Collaboration**: WebSocket-based updates and notifications

### Assessment Features
- **Question Randomization**: Unique question sets for each candidate
- **Proctoring**: Basic webcam monitoring and time tracking
- **Automated Scoring**: Instant results with detailed analytics
- **Multiple Test Types**: Cognitive, English, Situational Judgment, Fit Check

### CRM Features
- **Lead Management**: Track potential clients and partners
- **Partner Database**: Manage relationships with recruiters and vendors
- **Collaborative Notes**: Team-based communication and updates
- **Status Tracking**: Visual pipeline management

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database with Prisma ORM
- **JWT** authentication with bcrypt
- **Socket.io** for real-time features
- **Multer** for file uploads
- **Nodemailer** for email notifications

### Frontend
- **Next.js 14** with App Router
- **React Hook Form** with Zod validation
- **Tanstack Query** for data fetching
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time updates
- **Lucide React** for icons

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd HireFlow
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup
```bash
# Navigate to backend directory
cd backend

# Create a PostgreSQL database
createdb hireflow

# Set up environment variables
cp env.example .env
# Edit .env with your database credentials and other settings
```

### 4. Backend Setup
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start the development server
npm run dev
```

### 5. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Start the development server
npm run dev
```

### 6. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Prisma Studio: http://localhost:5555 (run `npm run db:studio`)

## 🔧 Environment Configuration

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hireflow"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Configuration
PORT=5000
NODE_ENV="development"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Upload Configuration
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📁 Project Structure

```
HireFlow/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Authentication & validation
│   │   ├── utils/           # Helper functions
│   │   └── server.js        # Main server file
│   ├── prisma/              # Database schema & migrations
│   └── package.json
├── frontend/                # Next.js application
│   ├── app/                 # App Router pages
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React contexts
│   ├── lib/                 # Utilities & API client
│   └── package.json
└── package.json             # Root package.json for workspace
```

## 🚀 Deployment

### Backend Deployment (Heroku/Railway)

1. **Prepare for deployment**:
```bash
cd backend
npm run build
```

2. **Set environment variables** on your hosting platform:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - Other required environment variables

3. **Deploy**:
```bash
# For Heroku
heroku create your-app-name
git push heroku main

# For Railway
railway up
```

### Frontend Deployment (Vercel)

1. **Connect your repository** to Vercel
2. **Set environment variables**:
   - `NEXT_PUBLIC_API_URL`
3. **Deploy** automatically on push to main branch

### Database Setup

1. **Create a PostgreSQL database** (Heroku Postgres, Railway, or external provider)
2. **Run migrations**:
```bash
npm run db:migrate
```

## 🔐 Security Features

- **JWT Authentication** with secure token management
- **Password Hashing** using bcrypt
- **Input Validation** with express-validator
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for secure cross-origin requests
- **Helmet.js** for security headers
- **Role-based Access Control** (RBAC)

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Job Management
- `GET /api/jobs` - Get company jobs
- `GET /api/jobs/public` - Get public jobs
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Assessment System
- `POST /api/assessments/create` - Create assessment
- `GET /api/assessments/take/:id` - Get assessment for candidate
- `POST /api/assessments/submit/:id` - Submit assessment results
- `GET /api/assessments/results/:id` - Get assessment results

### CRM Features
- `GET /api/crm/leads` - Get leads
- `POST /api/crm/leads` - Create lead
- `GET /api/crm/partners` - Get partners
- `POST /api/crm/partners` - Create partner

### Onboarding
- `GET /api/onboarding/modules` - Get modules
- `POST /api/onboarding/modules` - Create module
- `GET /api/onboarding/progress` - Get user progress
- `PUT /api/onboarding/progress/:id` - Update progress

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@hireflow.com or create an issue in the repository.

## 🔮 Roadmap

- [ ] Advanced proctoring with AI detection
- [ ] Video interview integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Multi-language support
- [ ] Advanced assessment types
- [ ] Integration with job boards
- [ ] Advanced reporting features

---

Built with ❤️ by the HireFlow team

# LinguaLearn - Language Learning Platform

A comprehensive web-based language learning application inspired by Quizlet, built with Next.js 16, TypeScript, Ant Design, and Tailwind CSS. Learn Japanese and Chinese through interactive flashcards, quizzes, matching games, and step-by-step learning modes.

## Features

### Core Features

- **User Authentication**: Secure signup/login with JWT tokens and HTTP-only cookies
- **Study Sets Management**: Create, edit, and organize flashcard sets
- **Multiple Study Modes**:
  - Flashcard Mode: Flip cards to test your memory
  - Quiz Mode: Multiple-choice questions with instant feedback
  - Match Mode: Interactive matching game between words and translations
  - Learn Mode: Step-by-step learning with examples and pronunciation
- **Progress Tracking**: SM-2 spaced repetition algorithm for optimized learning
- **Analytics Dashboard**: View learning statistics and progress over time
- **User Profiles**: Manage account information and preferences

### Languages Supported

- Japanese (Hiragana, Katakana, Kanji)
- Chinese (Simplified and Traditional characters, Pinyin)

## Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Ant Design 5** - UI component library
- **Tailwind CSS 4** - Utility-first CSS framework
- **Recharts** - Chart library for analytics

### Backend

- **Next.js API Routes** - Serverless functions
- **Prisma ORM** - Database abstraction layer
- **PostgreSQL** - Database (can be configured)

### Authentication & Security

- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **HTTP-only Cookies** - Secure token storage

## Project Structure

```
app/
├── page.tsx                          # Landing page
├── login/page.tsx                    # Login page
├── signup/page.tsx                   # Signup page
├── dashboard/
│   ├── page.tsx                      # Main dashboard
│   ├── sets/
│   │   ├── page.tsx                  # Sets list
│   │   ├── create/page.tsx           # Create set
│   │   └── [id]/
│   │       ├── page.tsx              # Set details
│   │       └── edit/page.tsx         # Edit set
│   ├── study/
│   │   └── [id]/
│   │       ├── page.tsx              # Study mode selector
│   │       ├── flashcard/page.tsx    # Flashcard mode
│   │       ├── quiz/page.tsx         # Quiz mode
│   │       ├── match/page.tsx        # Matching game
│   │       └── learn/page.tsx        # Learn mode
│   ├── progress/page.tsx             # Progress & analytics
│   └── profile/page.tsx              # User profile
├── api/
│   ├── auth/
│   │   ├── signup/route.ts
│   │   └── login/route.ts
│   ├── sets/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── progress/route.ts
│   └── study-sessions/route.ts
├── layout.tsx                        # Root layout
└── globals.css                       # Global styles

components/
├── layout/
│   └── dashboard-layout.tsx          # Dashboard layout wrapper
└── ui/                               # Shadcn UI components

lib/
├── auth.ts                           # Authentication utilities
├── jwt.ts                            # JWT token handling
├── utils.ts                          # Utility functions
└── antd-registry.tsx                 # Ant Design SSR setup

prisma/
├── schema.prisma                     # Database schema
└── seed.ts                           # Database seeding script

middleware.ts                         # Authentication middleware
```

## Database Schema

### User

- Stores user account information and authentication details

### Set

- Flashcard sets for organizing cards by topic and language

### Card

- Individual flashcard items with front (original) and back (translation)

### Progress

- Tracks card learning progress with spaced repetition metrics
- Uses SM-2 algorithm for optimal review scheduling

### StudySession

- Records study sessions including mode, duration, and performance

## Getting Started

### Prerequisites

- Node.js 18+ (with pnpm package manager)
- PostgreSQL database

### Installation

1. **Clone and navigate to project**

   ```bash
   cd vercel/share/v0-project
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your database URL and auth secret:

   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/lingua_learn"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Initialize database**

   ```bash
   pnpm exec prisma migrate dev
   pnpm exec tsx scripts/init-db.ts
   ```

5. **Run development server**

   ```bash
   pnpm dev
   ```

6. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Creating a Study Set

1. Sign up for an account
2. Click "Create New Set" on the dashboard
3. Enter set title, description, and select language
4. Add flashcards with front (original) and back (translation)
5. Save your set

### Studying

1. Select a set from your dashboard
2. Choose a study mode:
   - **Flashcard**: Flip cards and track what you remember
   - **Quiz**: Answer multiple-choice questions
   - **Match**: Connect words with translations
   - **Learn**: Study with examples and pronunciation
3. Track your progress with the spaced repetition algorithm

### Monitoring Progress

- View overall statistics on the dashboard
- Check detailed progress for each set
- Review learning trends in analytics

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - User login

### Sets

- `GET /api/sets` - List user's sets
- `POST /api/sets` - Create new set
- `GET /api/sets/[id]` - Get set details
- `PUT /api/sets/[id]` - Update set
- `DELETE /api/sets/[id]` - Delete set

### Progress

- `GET /api/progress` - Get user's progress records
- `POST /api/progress` - Record card review (updates spaced repetition)

### Study Sessions

- `GET /api/study-sessions` - Get study sessions
- `POST /api/study-sessions` - Record study session

## Learning Algorithm

The platform implements the SM-2 Spaced Repetition algorithm to optimize learning:

- **Correct answers**: Increases review interval (1 → 3 → 10+ days)
- **Incorrect answers**: Resets interval to 1 day, adjusts ease factor
- **Ease factor**: Dynamic difficulty adjustment based on performance
- **Next review date**: Calculated automatically for each card

## Security Features

- JWT-based authentication with HTTP-only cookies
- Password hashing with bcryptjs
- Row-level authorization checks on all API routes
- CSRF protection through SameSite cookies
- Input validation on all endpoints

## Future Enhancements

- [ ] Pronunciation audio files
- [ ] Community shared sets
- [ ] Social features (friends, leaderboards)
- [ ] Mobile app
- [ ] AI-powered hints and explanations
- [ ] Custom themes and dark mode
- [ ] Offline mode with sync
- [ ] Export/import functionality

## Contributing

This is a personal learning project. Feel free to fork and modify for your needs!

## License

MIT License - feel free to use this project as you wish.

## Support

For issues or questions, please create an issue in the repository.

---

**Happy Learning!** Start your journey to master Japanese and Chinese today with LinguaLearn.

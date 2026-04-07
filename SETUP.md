# LinguaLearn Setup Guide

## Quick Start

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database (use SQLite for development or PostgreSQL for production)
DATABASE_URL="sqlite:./dev.db"

# Or for PostgreSQL:
# DATABASE_URL="postgresql://user:password@localhost:5432/lingua_learn"

# Auth Configuration
NEXTAUTH_SECRET="your-secret-key-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Application Settings
NEXT_PUBLIC_APP_NAME="LinguaLearn"
NEXT_PUBLIC_APP_DESCRIPTION="Learn Japanese and Chinese with flashcards"
```

**Generate a secure secret:**

```bash
openssl rand -base64 32
```

### Step 3: Set Up Database

#### Using SQLite (Development)

```bash
# Initialize Prisma with SQLite
pnpm exec prisma migrate dev --name init

# Seed the database with sample data
pnpm exec tsx scripts/init-db.ts
```

#### Using PostgreSQL (Production)

1. Create a PostgreSQL database:

```bash
createdb lingua_learn
```

2. Update `.env.local` with your connection string

3. Run migrations:

```bash
pnpm exec prisma migrate dev --name init
pnpm exec tsx scripts/init-db.ts
```

### Step 4: Run Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Testing the Application

### Demo Credentials (after seeding)

- **Email:** `demo@example.com`
- **Password:** `password123`

### Features to Test

1. **Authentication**
   - Signup at `/signup`
   - Login at `/login`
   - Try logging out

2. **Dashboard**
   - View your learning statistics
   - See existing study sets

3. **Create Study Sets**
   - Go to "My Sets" → "Create New Set"
   - Select Japanese or Chinese
   - Add some flashcards

4. **Study Modes**
   - Select a set and try each study mode:
     - Flashcard: Flip cards to test memory
     - Quiz: Answer multiple-choice questions
     - Match: Connect words with translations
     - Learn: Study step-by-step with examples

5. **Progress Tracking**
   - Visit the "Progress" tab
   - View your learning statistics
   - Check detailed progress by set

## Database Commands

```bash
# View database in Prisma Studio
pnpm exec prisma studio

# Reset database (⚠️ deletes all data)
pnpm exec prisma migrate reset

# Create a new migration
pnpm exec prisma migrate dev --name <migration-name>

# Generate Prisma client
pnpm exec prisma generate
```

## Troubleshooting

### "Database connection failed"

- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env.local`
- Verify database credentials

### "JWT verification failed"

- Make sure NEXTAUTH_SECRET is set and consistent
- Check that cookies are being sent with requests

### "Module not found" errors

- Run `pnpm install` again
- Clear node_modules: `rm -rf node_modules && pnpm install`

### Port 3000 already in use

```bash
# Run on a different port
pnpm dev -- -p 3001
```

## Environment Variables Reference

| Variable                    | Required | Description                               |
| --------------------------- | -------- | ----------------------------------------- |
| DATABASE_URL                | Yes      | Database connection string                |
| NEXTAUTH_SECRET             | Yes      | Secret key for JWT signing (min 32 chars) |
| NEXTAUTH_URL                | Yes      | URL of your application                   |
| NEXT_PUBLIC_APP_NAME        | No       | App name displayed in UI                  |
| NEXT_PUBLIC_APP_DESCRIPTION | No       | App description                           |
| NODE_ENV                    | No       | Set to 'production' for production builds |

## Production Deployment

### Using Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Using Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod

COPY . .
RUN pnpm run build

EXPOSE 3000
CMD ["pnpm", "start"]
```

## Next Steps

1. **Customize the App**
   - Update theme colors in `tailwind.config.ts`
   - Modify Ant Design theme in `lib/antd-registry.tsx`
   - Add your own flashcard sets

2. **Add More Features**
   - User profile customization
   - Sharing sets with friends
   - Community features
   - Mobile app

3. **Improve Learning**
   - Add pronunciation audio
   - Integrate spaced repetition optimization
   - Add mnemonics and memory tricks

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Ant Design Docs**: https://ant.design/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

Good luck with your language learning journey! If you have any questions, refer to the main README.md or check the documentation links above.

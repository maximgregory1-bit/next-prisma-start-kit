## Start Kit Dashboard

Responsive Start Kit dashboard UI built with Next.js, Tailwind CSS, and shadcn/ui.

### Auth

- Credentials-based auth via NextAuth.
- Protected routes: `/dashboard`, `/setting`.

### Environment

Required env vars:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### Database & Migrations

Prisma schema lives in `src/prisma/schema.prisma`.
Prisma config lives in `prisma.config.ts` (required for Prisma 7).
Generated Prisma client lives in `src/generated/prisma`.

Run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Development

```bash
npm run dev
```

Open http://localhost:3000.

### Key Files

- Auth middleware: `src/middleware.ts`
- Dashboard route: `src/app/dashboard/page.tsx`
- Auth config: `src/lib/auth-options.ts`
- Prisma client: `src/lib/prisma.ts`
- Feature components: `src/features/dashboard/components`
- Theme tokens: `src/app/globals.css`

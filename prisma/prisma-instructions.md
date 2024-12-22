- create prisma client `npx prisma generate`
- Build initial migration `npx prisma migrate dev --name init`
- to remove migrations and start fresh, `rm -rf prisma/migrations`
- Generate and apply migrations `npx prisma migrate deploy`
- Force reset everything to match current schema `npx prisma db push --force-reset`

### You need to run prisma generate:

-After changing your schema if you're using Prisma Client in your code
- Before building your application
- After pulling changes that include schema changes
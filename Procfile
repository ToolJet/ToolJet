web: npm run start:prod --prefix server
release: (export NODE_OPTIONS="--max_old_space_size=1024"; echo $DATABASE_URL; cd server && npm run db:migrate && node dist/scripts/seeds.js)

web: npm run start:prod --prefix server
release: (export NODE_OPTIONS="--max_old_space_size=1024"; npm run db:migrate --prefix server && cd server && node dist/scripts/seeds.js)

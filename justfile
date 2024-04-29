_default:
  just -l

# run after cloning the repository
setup:
  npm install

# start local dev
dev:
  npm run start

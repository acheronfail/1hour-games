_default:
  just -l

# run after cloning the repository
setup:
  npm install

# start local dev
dev name:
  ./node_modules/.bin/esbuild \
    --bundle \
    --serve=localhost:8000 \
    --servedir=www \
    --outdir=www/js \
    {{name}}/index.ts

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
    --servedir={{name}}/www \
    --outdir={{name}}/www/js \
    {{name}}/src/index.ts

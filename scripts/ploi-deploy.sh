cd {SITE_DIRECTORY}

# Reset playground build
git reset --hard

# Pull latest changes
git pull origin main

# Install Composer dependencies
composer install --no-interaction --prefer-dist --optimize-autoloader

{RELOAD_PHP_FPM}

# Ensure NVM is loaded
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Enable Corepack and install pnpm
corepack enable

# Install dependencies and build the project
if [ -f package-lock.json ]; then
  npm ci && npm run build
elif [ -f pnpm-lock.yaml ]; then
  pnpm i && pnpm run build:playground
fi

# Clean Kirby cache
rm -rf storage/cache/{SITE_DOMAIN}

echo "🚀 Application deployed!"

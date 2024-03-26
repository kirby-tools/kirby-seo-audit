cd {SITE_DIRECTORY}

# Pull changes
git pull origin main

# Install Composer dependencies
composer install --no-interaction --prefer-dist --optimize-autoloader

{RELOAD_PHP_FPM}

# Build playground plugin
npx pnpm i && npx pnpm run build:playground

echo "🚀 Playground deployed!"

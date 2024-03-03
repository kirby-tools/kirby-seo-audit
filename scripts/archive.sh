# Step 1: Create a ZIP archive from the current Git repository, excluding ignored files.
git archive --format=zip --output=./kirby-seo-audit-$(git describe --tags).zip HEAD

# Step 2: Add the `index.js` file to the ZIP archive.
zip -g ./kirby-seo-audit-$(git describe --tags).zip assets/* index.js index.css

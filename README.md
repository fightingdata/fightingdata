# FightingData.com

UFC Fight Analysis - Data-Driven

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run serve
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

- `_data/` - JSON data files exported from database
- `_includes/` - Reusable templates (header, footer, layout)
- `src/` - Source pages (homepage, events, about)
- `assets/` - Static files (CSS, JS, images)
- `_site/` - Build output (not in git)

## Deployment

Site automatically deploys to Netlify when pushed to main branch.

## Data Updates

1. Run weekly scraper in `scripts/` folder
2. Export data: `python export_to_json.py`
3. Rebuild site: `npm run build`
4. Commit and push to trigger deploy

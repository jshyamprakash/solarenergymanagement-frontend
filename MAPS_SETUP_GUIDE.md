# Google Maps Setup Guide

## Quick Start

Follow these steps to get the Google Maps integration working in your Solar Energy Monitoring System.

## Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Library"
4. Search for and enable "Maps JavaScript API"
5. Go to "APIs & Services" > "Credentials"
6. Click "Create Credentials" > "API Key"
7. Copy your new API key

### Restrict Your API Key (Recommended for Production)

For security, restrict your API key:

1. In the Credentials page, click on your API key
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domains:
     - `http://localhost:5173/*` (for development)
     - `https://yourdomain.com/*` (for production)
3. Under "API restrictions":
   - Select "Restrict key"
   - Check "Maps JavaScript API"
4. Click "Save"

## Step 2: Configure Frontend

1. Open the `.env` file in the `frontend/` directory:
   ```bash
   cd frontend
   nano .env
   ```

2. Add your API key:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
   Replace the value with your actual Google Maps API key.

3. Save the file

## Step 3: Restart Development Server

If your dev server is already running, restart it to load the new environment variable:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 4: Verify Plant Data

The map requires plants to have location data. Check your database:

```sql
-- Connect to PostgreSQL
psql -U postgres -d solar_energy

-- Check plants with location data
SELECT
  id,
  name,
  location->>'latitude' as lat,
  location->>'longitude' as lng,
  location->>'address' as address
FROM solar2.plants
WHERE location IS NOT NULL;
```

If plants don't have location data, update them:

```sql
UPDATE solar2.plants
SET location = jsonb_build_object(
  'latitude', '28.6139',
  'longitude', '77.2090',
  'address', 'New Delhi, India'
)
WHERE id = 1;
```

## Step 5: Access the Map

1. Open your browser and navigate to: `http://localhost:5173/map`
2. You should see:
   - Interactive Google Map
   - Colored markers for each plant
   - Sidebar with plant list and filters
   - Search functionality

## Troubleshooting

### Problem: "Google Maps API key is not configured" error

**Solution:**
- Check that `.env` file has `VITE_GOOGLE_MAPS_API_KEY=your_key`
- Make sure you replaced `YOUR_GOOGLE_MAPS_API_KEY_HERE` with actual key
- Restart the dev server after adding the key
- Environment variables must start with `VITE_` for Vite to expose them

### Problem: Map shows but no markers appear

**Solution:**
- Check browser console for errors
- Verify plants have location data in database
- Ensure latitude/longitude are valid numbers
- Check the sidebar - it shows count of plants with location data

### Problem: "This page can't load Google Maps correctly" error

**Solution:**
- Your API key may be invalid or expired
- Check if Maps JavaScript API is enabled in Google Cloud Console
- Verify API key restrictions (if any)
- Check browser console for specific error messages

### Problem: Map loads slowly or doesn't load at all

**Solution:**
- Check your internet connection
- Verify API key is valid
- Check browser console for CORS or network errors
- Try disabling browser extensions that might block requests

### Problem: Sidebar doesn't show on mobile

**Solution:**
- Click the Filter icon (top right) to open the drawer
- Swipe from left edge to open drawer
- This is normal behavior for responsive design

## Backend Requirements

Ensure your backend is running and accessible:

```bash
cd backend
npm run dev
```

The map fetches data from: `http://localhost:3000/api/plants`

## Testing with Mock Data

If you have mock data seeded, verify it includes location information:

```bash
cd backend
npm run prisma:studio
```

Then navigate to the `plants` table and check the `location` column.

## Environment Variables Summary

Your `frontend/.env` should look like this:

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Mock Data Mode (set to false for production)
VITE_USE_MOCK_DATA=false

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

## Costs and Quotas

Google Maps offers a free tier:
- $200 free credit per month
- Approximately 28,000 map loads per month free
- Monitor usage in [Google Cloud Console](https://console.cloud.google.com/)

For production, consider:
- Setting up billing alerts
- Implementing usage quotas
- Caching map tiles when possible

## Production Deployment

When deploying to production:

1. Update API key restrictions to include production domain
2. Use environment-specific API keys (dev vs production)
3. Set up proper error logging
4. Monitor API usage and costs
5. Consider implementing server-side caching
6. Add analytics to track map usage

## Additional Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [React Google Maps API Library](https://react-google-maps-api-docs.netlify.app/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Pricing Calculator](https://cloud.google.com/maps-platform/pricing)

## Support

If you encounter issues not covered in this guide:

1. Check browser console for error messages
2. Verify all steps were followed correctly
3. Check the main documentation: `GOOGLE_MAPS_INTEGRATION.md`
4. Review Google Maps API documentation
5. Check API key restrictions and quotas

## Next Steps

After setting up the map:

1. Test all functionality (search, filter, markers, info windows)
2. Add real plant location data to your database
3. Customize marker colors/icons if needed
4. Consider implementing marker clustering for many plants
5. Explore additional Google Maps features (directions, street view, etc.)

Enjoy your new interactive plant location map!

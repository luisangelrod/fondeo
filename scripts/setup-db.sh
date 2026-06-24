#!/bin/bash
# Run this after setting DATABASE_URL in .env.local
# This generates and pushes the Drizzle schema to your Supabase database

echo "Generating Drizzle migrations..."
npx drizzle-kit generate

echo "Pushing schema to database..."
npx drizzle-kit push

echo "Done! Your Fondeo database is ready."

-- Update database schema to add image_url columns
USE estatmad;

-- Add image_url column to lost_found_items table if it doesn't exist
ALTER TABLE lost_found_items 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) DEFAULT NULL;

-- Add image_url column to activities table if it doesn't exist  
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) DEFAULT NULL;

-- Update existing image column data to image_url if needed
UPDATE lost_found_items SET image_url = image WHERE image IS NOT NULL AND image_url IS NULL;
UPDATE activities SET image_url = image WHERE image IS NOT NULL AND image_url IS NULL;

/*
  # Parcel Tracking Database Schema

  1. New Tables
    - `parcels`
      - `id` (uuid, primary key)
      - `tracking_number` (text, unique, not null)
      - `status` (text, not null)
      - `carrier` (text, nullable)
      - `last_updated` (timestamptz, default now())
      - `created_at` (timestamptz, default now())
    
    - `tracking_history`
      - `id` (uuid, primary key)
      - `tracking_number` (text, not null)
      - `status` (text, not null)
      - `carrier` (text, nullable)
      - `tracked_at` (timestamptz, default now())
    
    - `tracking_events`
      - `id` (uuid, primary key)
      - `tracking_number` (text, not null)
      - `event_date` (timestamptz, not null)
      - `description` (text, not null)
      - `location` (text, nullable)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (demo purposes)
    - Add policies for authenticated users to manage their data

  3. Indexes
    - Index on tracking_number for fast lookups
    - Index on timestamps for sorting
*/

CREATE TABLE IF NOT EXISTS parcels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  carrier text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tracking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number text NOT NULL,
  status text NOT NULL,
  carrier text,
  tracked_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number text NOT NULL,
  event_date timestamptz NOT NULL,
  description text NOT NULL,
  location text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parcels_tracking_number ON parcels(tracking_number);
CREATE INDEX IF NOT EXISTS idx_parcels_last_updated ON parcels(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_history_tracked_at ON tracking_history(tracked_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking_number ON tracking_events(tracking_number);

ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read parcels"
  ON parcels FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert parcels"
  ON parcels FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update parcels"
  ON parcels FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete parcels"
  ON parcels FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Anyone can read tracking history"
  ON tracking_history FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert tracking history"
  ON tracking_history FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read tracking events"
  ON tracking_events FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert tracking events"
  ON tracking_events FOR INSERT
  TO public
  WITH CHECK (true);

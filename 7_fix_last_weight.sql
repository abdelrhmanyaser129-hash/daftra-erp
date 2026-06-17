-- Add last_weight and follow_up_count to clients for quick display
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_weight DECIMAL(10,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS follow_up_count INT DEFAULT 0;

-- Backfill existing clients with computed values
UPDATE clients c
SET last_weight = sub.latest_weight,
    follow_up_count = sub.cnt
FROM (
  SELECT client_id,
         (array_agg(weight ORDER BY date DESC))[1] AS latest_weight,
         COUNT(*) AS cnt
  FROM weight_records
  GROUP BY client_id
) sub
WHERE c.id = sub.client_id;

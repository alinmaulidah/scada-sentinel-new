-- Jalankan sekali pada database yang sudah ada.
ALTER TABLE sensor_logs
  MODIFY COLUMN segment_id INT UNSIGNED NOT NULL;

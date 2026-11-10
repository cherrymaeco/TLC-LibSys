ALTER TABLE books
    ADD COLUMN copies_total INT NOT NULL DEFAULT 1 AFTER format;

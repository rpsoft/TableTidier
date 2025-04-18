-- CREATE TABLE

CREATE TABLE IF NOT EXISTS public.annotations
(
    annotation json,
    tid bigint NOT NULL,
    CONSTRAINT ann_pkey PRIMARY KEY (tid)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.annotations
    OWNER to admin;

-- ADD INFO
INSERT INTO
  public.annotations 
  (annotation, tid)
VALUES
(
  '{"annotations":[{"location":"Col","content":{"characteristic_level":true},"qualifiers":{"indented":true},"number":"1"},{"location":"Col","content":{"characteristic_name":true},"qualifiers":{"empty_row":true},"number":"1"},{"location":"Row","content":{"characteristic_level":true},"qualifiers":{},"number":"1"},{"location":"Row","content":{"arms":true},"qualifiers":{},"number":"2"},{"location":"Col","content":{"characteristic_name":true,"characteristic_level":true},"qualifiers":{},"number":"1"}]}',
  1
);
-- CREATE TABLE

CREATE SEQUENCE public.table_tid_seq
    AS integer
    START WITH 10
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.table_tid_seq OWNER TO admin;

CREATE TABLE IF NOT EXISTS public."table"
(
    docid character varying COLLATE pg_catalog."default",
    page integer,
    "user" text COLLATE pg_catalog."default",
    notes text COLLATE pg_catalog."default",
    collection_id bigint,
    file_path character varying COLLATE pg_catalog."default",
    "tableType" text COLLATE pg_catalog."default",
    tid bigint NOT NULL DEFAULT nextval('table_tid_seq'::regclass),
    completion character varying COLLATE pg_catalog."default",
    doi character varying COLLATE pg_catalog."default",
    pmid character varying COLLATE pg_catalog."default",
    "url" character varying COLLATE pg_catalog."default",
    CONSTRAINT table_pkey PRIMARY KEY (tid)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."table"
    OWNER to admin;

ALTER SEQUENCE public.table_tid_seq OWNED BY public."table".tid;

-- ADD INFO
INSERT INTO
  public."table" 
  (docid, page, "user", notes, collection_id, file_path, "tableType", tid, completion)
VALUES
   (
    '28905478',
    1,
    'lili@example.com',
    'some testing note',
    1,
    '28905478_1.html',
    'result_table_subgroup',
    1,
    '28905478'
  ),
  (
    '28905478',
    2,
    'lili@example.com',
    '',
    1,
    '28905478_2.html',
    'result_table_subgroup',
    2,
    '28905478'
  ),
  (
    '28905478',
    3,
    'lili@example.com',
    '',
    1,
    '28905478_3.html',
    'result_table_subgroup',
    3,
    '28905478'
  );
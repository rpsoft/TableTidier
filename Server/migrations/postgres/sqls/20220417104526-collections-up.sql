-- CREATE TABLE

CREATE SEQUENCE public.collection_id_seq
    AS integer
    START WITH 10
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.collection_id_seq OWNER TO admin;

CREATE TABLE IF NOT EXISTS public.collection
(
  collection_id bigint NOT NULL DEFAULT nextval('collection_id_seq'::regclass),
  title character varying COLLATE pg_catalog."default",
  description character varying COLLATE pg_catalog."default",
  owner_username character varying COLLATE pg_catalog."default",
  visibility character varying COLLATE pg_catalog."default",
  completion character varying COLLATE pg_catalog."default",
  CONSTRAINT collection_pkey PRIMARY KEY (collection_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.collection
    OWNER to admin;

ALTER SEQUENCE public.collection_id_seq OWNED BY public.collection.collection_id;

-- ADD INFO

INSERT INTO
  public.collection 
  (collection_id, title, description, owner_username, visibility, completion)
VALUES
  (
    1,
    'This is the first collection, testing collection',
    'The testing collection',
    'james@example.com',
    'public',
    'in progress'
  ),
  (
    2,
    'This is the second collection, testing collection',
    'The testing collection 2',
    'lili@example.com',
    'public',
    'in progress'
  );
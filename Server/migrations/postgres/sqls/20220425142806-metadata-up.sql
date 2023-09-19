-- CREATE TABLE

CREATE TABLE IF NOT EXISTS public.metadata
(
    concept_source text COLLATE pg_catalog."default" NOT NULL,
    concept_root text COLLATE pg_catalog."default" NOT NULL,
    concept text COLLATE pg_catalog."default" NOT NULL,
    cuis text COLLATE pg_catalog."default",
    qualifiers text COLLATE pg_catalog."default",
    cuis_selected text COLLATE pg_catalog."default",
    qualifiers_selected text COLLATE pg_catalog."default",
    istitle boolean,
    labeller text COLLATE pg_catalog."default",
    tid bigint NOT NULL,
    CONSTRAINT meta_pkey PRIMARY KEY (concept, concept_root, tid, concept_source)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.metadata
    OWNER to admin;

-- ADD INFO

INSERT INTO
  public.metadata
  (
    concept_source,
    concept_root,
    concept,
    cuis,
    
    qualifiers,
    cuis_selected,
    qualifiers_selected,
    istitle,

    labeller,
    tid
  )
VALUES
(
  '',
  '',
  '£90 ml/minute',
  'C0439232;C0700321;C0702093;C1282918;C2347166;C0439083;C0439526;C1705224;C3887665;C0439087;C3842582',
  
  '',
  'C0439232;C0700321',
  '',
  false,

  'lili@example.com',
  1
),
(
  '',
  '',
  'Factor V Leiden or prothrombin mutation',
  'C0584960;C1610621',

  '',
  'C0584960;C1610621',
  '',
  false,

  'lili@example.com',
  1
),
(
  '',
  'Factor V Leiden or prothrombin mutation',
  'Present',
  'C0150312',

  '',
  'C0150312',
  '',
  false,

  'lili@example.com',
  1
);

-- CREATE TABLE
CREATE TABLE IF NOT EXISTS public.cuis_index
(
    cui character varying COLLATE pg_catalog."default" NOT NULL,
    preferred character varying COLLATE pg_catalog."default",
    "hasMSH" boolean,
    user_defined boolean,
    admin_approved boolean,
    CONSTRAINT cuis_pkey PRIMARY KEY (cui)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.cuis_index
    OWNER to admin;

-- ADD INFO

INSERT INTO
  public.cuis_index
  (
    cui,
    preferred,
    "hasMSH",
    user_defined,
    admin_approved
  )
VALUES
(
  'C0001551',
  'Immunologic Adjuvants',
  true,
  false,
  false
), (
  'C0001552',
  'Pharmaceutical Adjuvants',
  true,
  false,
  false
), (
  'C0001613',
  'Adrenal Cortex',
  true,
  false,
  false
)

-- CREATE TABLE
CREATE TABLE IF NOT EXISTS public.cuis_recommend
(
    concept character varying COLLATE pg_catalog."default",
    cuis character varying COLLATE pg_catalog."default",
    rep_cuis character varying COLLATE pg_catalog."default",
    excluded_cuis character varying COLLATE pg_catalog."default",
    cc integer
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.cuis_recommend
    OWNER to admin;

-- ADD INFO 

INSERT INTO
  public.cuis_recommend
  (
    concept,
    cuis,
    rep_cuis,
    excluded_cuis,
    cc
  )
VALUES
(
  'aminosalicylate',
  'C0368663;C2825094',
  'C0368663',
  '',
  1691
),
(
  'oral diabetic agent',
  'C0241863;C0442027;C0450442;C1254351;C1521826;C4521986',
  'C0020616',
  ';C0013227;C3244316;C4284232;C0450442;C1254351;C1515187;C1521826;C2826257',
  33
)
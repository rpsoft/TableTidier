-- CREATE TABLE
CREATE TABLE IF NOT EXISTS cuis_index
(
    cui character varying NOT NULL,
    preferred character varying,
    "hasMSH" boolean,
    user_defined boolean,
    admin_approved boolean,
    CONSTRAINT cuis_pkey PRIMARY KEY (cui)
);

-- ADD INFO

INSERT INTO
  cuis_index
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
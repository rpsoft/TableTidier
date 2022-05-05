-- CREATE TABLE

CREATE TABLE IF NOT EXISTS metadata
(
    concept_source text NOT NULL,
    concept_root text NOT NULL,
    concept text NOT NULL,
    cuis text,
    qualifiers text,
    cuis_selected text,
    qualifiers_selected text,
    istitle boolean,
    labeller text,
    tid bigint NOT NULL,
    CONSTRAINT meta_pkey PRIMARY KEY (concept, concept_root, tid, concept_source)
);

-- ADD INFO

INSERT INTO
  metadata
  (concept_source, concept_root, concept, cuis, cuis_selected, istitle, labeller, tid)
VALUES
(
  '',
  '',
  '£90 ml/minute',
  'C0439232;C0700321;C0702093;C1282918;C2347166;C0439083;C0439526;C1705224;C3887665;C0439087;C3842582',
  'C0439232;C0700321',
  false,
  'lili@example.com',
  1
);

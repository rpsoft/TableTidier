-- CREATE TABLE
CREATE TABLE IF NOT EXISTS cuis_recommend
(
    concept character varying,
    cuis character varying,
    rep_cuis character varying,
    excluded_cuis character varying,
    cc integer
);

-- ADD INFO

INSERT INTO
  cuis_recommend
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

-- CREATE TABLES
CREATE TABLE IF NOT EXISTS users
(
    id integer,
    username character varying,
    password character varying,
    "displayName" character varying,
    email character varying,
    registered bigint,
    role character varying,
    groups bigint[],
    CONSTRAINT users_pkey PRIMARY KEY (username)
);

-- ADD INFO
INSERT INTO
    users 
    (id, username, password, "displayName", email, registered, role, groups)
VALUES
    (1, 'admin', 'hashpassword', 'admin', 'admin@example.com', 1599088842332, 'admin', '{1,2}'),
    (2, 'james', 'hashpassword', 'James', 'james@example.com', 1599088842332, 'standard', '{1}'),
    (3, 'lili', 'hashpassword', 'Lili', 'lili@example.com', 1599088842332, 'standard', '{1}');

-- CREATE TABLES

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 10
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.users_id_seq OWNER TO admin;

CREATE TABLE IF NOT EXISTS public.users
(
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    username character varying COLLATE pg_catalog."default" NOT NULL,
    password character varying COLLATE pg_catalog."default",
    "displayName" character varying COLLATE pg_catalog."default",
    email character varying COLLATE pg_catalog."default" NOT NULL,
    registered bigint,
    role character varying COLLATE pg_catalog."default",
    groups bigint[],
    CONSTRAINT users_pkey PRIMARY KEY (email)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to admin;

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

-- ADD INFO
INSERT INTO
    public.users 
    (id, username, password, "displayName", email, registered, role, groups)
VALUES
    (1, 'admin', 'hashpassword', 'admin', 'admin@example.com', 1599088842332, 'admin', '{1,2}'),
    (2, 'james', 'hashpassword', 'James', 'james@example.com', 1599088842332, 'standard', '{1}'),
    (3, 'lili', 'hashpassword', 'Lili', 'lili@example.com', 1599088842332, 'standard', '{1}');

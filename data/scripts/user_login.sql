CREATE TABLE session
(
  id bigserial NOT NULL,
  ext_id uuid NOT NULL,
  user_id integer NOT NULL,
  date_created timestamp without time zone NOT NULL,
  date_refreshed timestamp without time zone NOT NULL,
  date_closed timestamp without time zone,
  CONSTRAINT session_pkey PRIMARY KEY (id),
  CONSTRAINT session_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES "user" (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT session_ext_id_key UNIQUE (ext_id)
);

CREATE TABLE "user"
(
  id serial NOT NULL,
  ext_id uuid NOT NULL,
  email VARCHAR(320) NOT NULL,
  username VARCHAR(30) NOT NULL,
  password_hash VARCHAR(30) NOT NULL,
  password_salt VARCHAR(10) NOT NULL,
  firstname VARCHAR(50),
  lastname VARCHAR(50),
  is_suspended boolean NOT NULL DEFAULT false,
  date_created timestamp without time zone NOT NULL,
  date_modified timestamp without time zone NOT NULL,
  date_deleted timestamp without time zone,
  CONSTRAINT user_pkey PRIMARY KEY (id),
  CONSTRAINT user_ext_id_key UNIQUE (ext_id),
  CONSTRAINT user_username_key UNIQUE (username)
);
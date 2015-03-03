CREATE INDEX CONCURRENTLY appstore_app_dev_id ON appstore_app (dev_id);

-- Table: related_category

CREATE TABLE related_category
(
	id serial NOT NULL,
	category_id integer NOT NULL,
	related_category_id integer NOT NULL,
	"position" integer NOT NULL,
	app_count integer NOT NULL,
	score double precision NOT NULL,
	date_created timestamp without time zone NOT NULL,
	CONSTRAINT related_category_pkey PRIMARY KEY (id),
	CONSTRAINT related_category_category_id_fkey FOREIGN KEY (category_id)
	REFERENCES category (id) MATCH SIMPLE
	ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT related_category_related_category_id_fkey FOREIGN KEY (related_category_id)
	REFERENCES category (id) MATCH SIMPLE
	ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT related_category_unique UNIQUE (category_id, related_category_id),
	CONSTRAINT related_category_position_unique UNIQUE (category_id, "position")
);


-- Function: reset_related_categories(double precision, double precision, integer)

CREATE OR REPLACE FUNCTION reset_related_categories(position_factor double precision, related_position_factor double precision, maxrelated integer)
	RETURNS boolean AS
	$BODY$
BEGIN
	delete from related_category;

	INSERT INTO related_category(category_id, related_category_id, "position", app_count, score, date_created)

	select category_id, related_category_id, position, total, score, NOW() at time zone 'utc'
	from (
		select category_id, related_category_id, row_number() OVER (PARTITION BY category_id order by score desc) as position, total, score, NOW() at time zone 'utc'
		from (
			select ca1.category_id , ca2.category_id as related_category_id, count(1) as total, sum(1/pow(ca1.position, position_factor) * 1/pow(ca2.position, related_position_factor)) as score
			from category_app ca1
			join category_app ca2 on ca1.app_id = ca2.app_id
			join category c1 on ca1.category_id = c1.id
			join category c2 on ca2.category_id = c2.id
			where ca1.category_id != ca2.category_id
			and c1.date_deleted is null
			and c2.date_deleted is null
			group by ca1.category_id, ca2.category_id
		) t
	) t
	where position <= maxRelated
	order by category_id, position;

        RETURN true;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;


-- Function: reset_related_category(integer, double precision, double precision, integer)

CREATE OR REPLACE FUNCTION reset_related_category(cat_id integer, position_factor double precision, related_position_factor double precision, max_related integer)
	RETURNS boolean AS
	$BODY$
BEGIN
	delete from related_category
	where category_id = cat_id;

	INSERT INTO related_category(category_id, related_category_id, "position", app_count, score, date_created)

	select cat_id, related_category_id, position, total, score, NOW() at time zone 'utc'
	from (
		select related_category_id, row_number() OVER (order by score desc) as position, total, score, NOW() at time zone 'utc'
		from (
			select ca2.category_id as related_category_id, count(1) as total, sum(1/pow(ca1.position, position_factor) * 1/pow(ca2.position, related_position_factor)) as score
			from category_app ca1
			join category_app ca2 on ca1.app_id = ca2.app_id
			join category c2 on ca2.category_id = c2.id
			where ca1.category_id = cat_id
			and ca1.category_id != ca2.category_id
			and c2.date_deleted is null
			group by ca2.category_id
		) t
	) t
	where position <= max_related;

        RETURN true;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;


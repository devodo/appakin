CREATE TABLE category_genre
(
  id serial NOT NULL,
  category_id integer NOT NULL,
  appstore_category_id integer NOT NULL,
  total integer NOT NULL,
  percent double precision NOT NULL,
  date_created timestamp without time zone NOT NULL,
  CONSTRAINT category_genre_pkey PRIMARY KEY (id),
  CONSTRAINT category_genre_appstore_category_id_fkey FOREIGN KEY (appstore_category_id)
  REFERENCES appstore_category (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT category_genre_category_id_fkey FOREIGN KEY (category_id)
  REFERENCES category (id) MATCH SIMPLE
  ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE INDEX category_genre_appstore_category_id_idx
ON category_genre (appstore_category_id);

CREATE INDEX category_popularity_idx
ON category_popularity (popularity);


CREATE OR REPLACE FUNCTION fix_genres(text[])
  RETURNS text[] AS
  $BODY$
DECLARE
  genre text;
  result_genres text[];
  is_newsstand boolean;
  is_game boolean;
  sports_count int := 0;
  entertainment_count int := 0;
  music_count int := 0;
BEGIN
  FOREACH genre IN ARRAY $1
  LOOP
    IF genre = 'Games' THEN
      is_game := true;
      ELSIF genre = 'Newsstand' THEN
        is_newsstand := true;
      ELSIF genre = 'Sports' THEN
        sports_count := sports_count + 1;
      ELSIF genre = 'Entertainment' THEN
        entertainment_count := entertainment_count + 1;
      ELSIF genre = 'Music' THEN
        music_count := music_count + 1;
    END IF;
  END LOOP;

  FOREACH genre IN ARRAY $1
  LOOP
    CONTINUE WHEN genre = 'Sports';
    CONTINUE WHEN genre = 'Entertainment';
    CONTINUE WHEN genre = 'Music';
    genre := replace(regexp_replace(replace(lower(genre), '&', 'and'), '[^a-z ]', ''), ' ','_');
    result_genres := array_append(result_genres, genre);
  END LOOP;

  IF sports_count > 0 THEN
    IF is_game THEN
      result_genres := array_append(result_genres, 'sports_games');
      IF sports_count = 2 THEN
	result_genres := array_append(result_genres, 'sports');
      END IF;

      ELSE
        result_genres := array_append(result_genres, 'sports');
    END IF;
  END IF;

  IF music_count > 0 THEN
    IF is_game THEN
      result_genres := array_append(result_genres, 'music_games');
      IF music_count = 2 THEN
	result_genres := array_append(result_genres, 'music');
      END IF;

      ELSE
        result_genres := array_append(result_genres, 'music');
    END IF;
  END IF;

  IF entertainment_count > 0 THEN
    IF is_newsstand THEN
      result_genres := array_append(result_genres, 'entertainment_newsstand');
      IF entertainment_count = 2 THEN
	result_genres := array_append(result_genres, 'entertainment');
      END IF;

      ELSE
        result_genres := array_append(result_genres, 'entertainment');
    END IF;
  END IF;

  RETURN result_genres;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;



CREATE OR REPLACE FUNCTION reset_category_popularity()
  RETURNS boolean AS
  $BODY$
BEGIN
	delete from category_popularity;

	INSERT INTO category_popularity(category_id, popularity)
	select category_id, score/max_score
	from (
		select category_id, score, max(score) over() as max_score
		from (
			select t.category_id, ln(1 + t.popularity) * (CASE WHEN xm.id is null THEN 1.0 ELSE 0.1 END) as score
			from (
				select ca.category_id, sum(ap.popularity) as popularity
				from category_app ca
				join app_popularity ap on ca.app_id = ap.app_id
				join category c on ca.category_id = c.id
				where c.date_deleted is null
				and ap.popularity > 0
				and ca.position <= 50
				group by ca.category_id
			) t
			left join xyo_category_map xm on t.category_id = xm.category_id
		) t
	) t
	order by category_id;

        RETURN true;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;


CREATE OR REPLACE FUNCTION reset_category_genre()
  RETURNS boolean AS
  $BODY$
BEGIN
	delete from category_genre;

	INSERT INTO category_genre(category_id, appstore_category_id, total, percent, date_created)
	select t.category_id, ac.id, t.total, t.percent, now()
	from (
		select t.category_id, t.genre, count(1) as total, count(1)::double precision / max(t.cat_total)::double precision as percent
		from (
			select ca.category_id, unnest(fix_genres(a.genres)) as genre, count(1) over(PARTITION BY ca.category_id) as cat_total
			from appstore_app a
			join category_app ca on a.app_id = ca.app_id
			join category c on ca.category_id = c.id
			where c.date_deleted is null
			and ca.position <= 200
		) t
		group by t.category_id, t.genre
	) t
	join appstore_category ac on t.genre = ac.url_name
	where t.percent >= 0.2
	order by t.category_id, total desc;

        RETURN true;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;



alter table appstore_category add column url_name character varying(64);

CREATE UNIQUE INDEX appstore_category_url_name_idx ON appstore_category (url_name);

update appstore_category
set url_name = 'music_games'
where id = 18;

update appstore_category
set url_name = 'entertainment_newsstand'
where id = 43;

update appstore_category
set url_name = 'sports_games'
where id = 23;

update appstore_category
set url_name = replace(regexp_replace(replace(lower(name), '&', 'and'), '[^a-z ]', ''), ' ','_')
where url_name is null;

alter table appstore_category alter column url_name set not null;

update appstore_category
set parent_id = 33
where url_name in ('arts_and_photography',
                   'automotive',
                   'brides_and_weddings',
                   'business_and_investing',
                   'childrens_magazines',
                   'computers_and_internet',
                   'cooking_food_and_drink',
                   'crafts_and_hobbies',
                   'electronics_and_audio',
                   'entertainment_newsstand',
                   'fashion_and_style',
                   'health_mind_and_body',
                   'history',
                   'home_and_garden',
                   'literary_magazines_and_journals',
                   'mens_interest',
                   'movies_and_music',
                   'news_and_politics',
                   'outdoors_and_nature',
                   'parenting_and_family',
                   'pets',
                   'professional_and_trade',
                   'regional_news',
                   'science',
                   'sports_and_leisure',
                   'teens',
                   'travel_and_regional',
                   'womens_interest');

update appstore_category
set parent_id = 8
where url_name in ('action',
                   'adventure',
                   'arcade',
                   'board',
                   'card',
                   'casino',
                   'dice',
                   'educational',
                   'family',
                   'music_games',
                   'puzzle',
                   'racing',
                   'role_playing',
                   'simulation',
                   'sports_games',
                   'strategy',
                   'trivia',
                   'word');

-- Find these functions to initialise/reset data
select reset_app_popularity();

select reset_category_popularity();

select reset_category_genre();
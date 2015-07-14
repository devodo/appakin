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
			select t.category_id, (log(1 + t.ranking) / power(t.length, 0.1)) * (CASE WHEN xm.id is null THEN 1.0 ELSE 0.1 END) as score
			from (
				select c.category_id, c.ranking, ca.length
				from (
					select ca.category_id, sum(log(1 + ar.ranking)) as ranking
					from category_app ca
					join app_ranking ar on ca.app_id = ar.app_id and ar.country_code = 'USA'
					join category c on ca.category_id = c.id
					where c.date_deleted is null
					and ar.ranking > 0
					and ca.position <= 200
					group by ca.category_id
				) c
				join (
					select category_id, count(1) as length
					from category_app
					group by category_id
				) ca on c.category_id = ca.category_id
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
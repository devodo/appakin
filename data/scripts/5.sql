truncate table app_analysis;

alter table app_analysis rename column english_description to desc_english_score;
alter table app_analysis rename column description_length to desc_length;
alter table app_analysis add column desc_valid_term_count integer NOT NULL;
alter table app_analysis add column desc_english_term_count integer NOT NULL;
alter table app_analysis add column desc_english_position integer NOT NULL;
alter table app_analysis add column desc_is_english boolean NOT NULL;

'use strict';

exports.constants = {
    appIndex: {
        alias: "appakin_app",
        docType: "app",
        template: {
            categoryFacetSearch: "category_facet_search",
            categoryExpandSearch: "category_expand_search"
        }
    }
};

exports.settings = {
    "number_of_shards":   1,
    "number_of_replicas": 0,
    "analysis": {
        "filter": {
            "index_delimiter": {
                "type": "word_delimiter",
                "generate_word_parts": true,
                "generate_number_parts": true,
                "catenate_words": true,
                "catenate_numbers": true,
                "catenate_all": false,
                "split_on_case_change": true,
                "preserve_original": false,
                "split_on_numerics": true,
                "stem_english_possessive": true,
                "protected_words": []
            },
            "search_delimiter": {
                "type": "word_delimiter",
                "generate_word_parts": true,
                "generate_number_parts": true,
                "catenate_words": false,
                "catenate_numbers": false,
                "catenate_all": false,
                "split_on_case_change": true,
                "preserve_original": false,
                "split_on_numerics": true,
                "stem_english_possessive": true,
                "protected_words": []
            },
            "manual_stem": {
                "type": "stemmer_override",
                "rules": [
                    "skies=>sky",
                    "mice=>mouse",
                    "feet=>foot",
                    "terminators=>terminator"
                ]
            },
            "no_stem": {
                "type": "keyword_marker",
                "keywords": [ "terminator" ]
            },
            "rule_stem" : {
                "type" : "stemmer",
                "name" : "porter2"
            },
            "index_common_grams": {
                "type":         "common_grams",
                "common_words": "_english_"
            },
            "search_common_grams": {
                "type":         "common_grams",
                "common_words": "_english_",
                "query_mode":   true
            },
            "shingle_filter": {
                "type": "shingle",
                "min_shingle_size": 2,
                "max_shingle_size": 5
            }
        },
        "analyzer": {
            "index_stem_text": {
                "tokenizer": "standard",
                "filter": [
                    "index_delimiter",
                    "lowercase",
                    "index_common_grams",
                    "no_stem",
                    "manual_stem",
                    "rule_stem"
                ]
            },
            "search_stem_text": {
                "tokenizer": "standard",
                "filter": [
                    "search_delimiter",
                    "lowercase",
                    "no_stem",
                    "manual_stem",
                    "rule_stem"
                ]
            },
            "search_grams": {
                "tokenizer": "standard",
                "filter": [
                    "search_delimiter",
                    "lowercase",
                    "search_common_grams",
                    "no_stem",
                    "manual_stem",
                    "rule_stem"
                ]
            },
            "standard_text": {
                "tokenizer": "standard",
                "filter": [
                    "lowercase"
                ]
            },
            "shingle_text": {
                "tokenizer": "standard",
                "filter": [
                    "lowercase",
                    "shingle_filter"
                ]
            }
        },
        "similarity": {
            "bm25_no_length": {
                "type": "BM25",
                "b":    0
            },
            "bm25_title": {
                "type": "BM25",
                "b":    0.25
            }
        }
    }
};

exports.mappings = {
    "_default_": {
        "_all": {"enabled": false},
        "_source": {"enabled": true}
    },
    "app": {
        "_source": {
            "includes": [
                "ext_id",
                "name",
                "image_url",
                "price",
                "rating"
            ],
            "excludes": ["nothing"]
        },
        "properties": {
            "ext_id": {"type": "string", "index": "no", "store": false},
            "name": {
                "type": "string",
                "analyzer": "standard_text",
                "similarity": "bm25_title",
                "copy_to": ["name_stem", "all", "spell"],
                "store": false
            },
            "name_stem": {
                "type": "string",
                "analyzer": "index_stem_text",
                "search_analyzer": "search_stem_text",
                "similarity": "bm25_title",
                "term_vector": "with_positions_offsets",
                "store": true
            },
            "name_alt": {
                "type": "string",
                "analyzer": "standard_text",
                "similarity": "bm25_title",
                "copy_to": "all",
                "store": false
            },
            "desc": {
                "type": "string",
                "analyzer": "standard_text",
                "copy_to": ["desc_stem", "all"],
                "store": false
            },
            "desc_stem": {
                "type": "string",
                "analyzer": "index_stem_text",
                "search_analyzer": "search_stem_text",
                "term_vector": "with_positions_offsets",
                "store": true
            },
            "filter_include": {
                "type": "string",
                "index": "no",
                "copy_to": "all",
                "position_offset_gap": 100,
                "store": false
            },
            "all": {
                "type": "string",
                "analyzer": "index_stem_text",
                "search_analyzer": "search_stem_text",
                "position_offset_gap": 100,
                "store": false
            },
            "boost": {"type": "float", "index": "not_analyzed"},
            "price": {"type": "integer", "index": "no", "store": false},
            "rating": {"type": "float", "index": "no", "store": false},
            "image_url": {"type": "string", "index": "no", "store": false},
            "is_free": {"type": "boolean", "index": "not_analyzed", "store": false},
            "is_iphone": {"type": "boolean", "index": "not_analyzed", "store": false},
            "is_ipad": {"type": "boolean", "index": "not_analyzed", "store": false},
            "is_cat": {"type": "boolean", "index": "not_analyzed", "store": false},
            "suggest" : {
                "type": "completion",
                "analyzer": "simple",
                "search_analyzer": "simple",
                "payloads": false,
                "preserve_separators": true,
                "preserve_position_increments": true
            },
            "spell" : {
                "type": "string",
                "analyzer": "shingle_text",
                "store": false
            },
            "categories": {
                "type": "nested",
                "include_in_parent": true,
                "properties": {
                    "cat_id": {"type": "integer", "index": "not_analyzed"},
                    "position": {"type": "integer", "index": "not_analyzed"},
                    "app_boost": {"type": "float", "index": "not_analyzed"},
                    "facet_boost": {"type": "float", "index": "not_analyzed"},
                    "max_boost": {"type": "float", "index": "not_analyzed"}
                }
            }
        }
    }
};


json.data_queries do 
    json.array! @data_queries do |data_query|
        json.id data_query.id
        json.name data_query.name
        json.kind data_query.kind
        json.options data_query.options.as_json
        json.data_source_id data_query.data_source_id
    end
end

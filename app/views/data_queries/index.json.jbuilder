json.data_queries do 
    json.array! @data_queries do |data_query|
        json.id data_query.id
        json.name data_query.name
        json.kind data_query.kind
        json.options data_query.options.as_json
    end
end

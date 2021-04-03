json.data_sources do 
    json.array! @data_sources do |data_source|
        json.id data_source.id
        json.name data_source.name
        json.kind data_source.kind
        json.options data_source.options.as_json
    end
end

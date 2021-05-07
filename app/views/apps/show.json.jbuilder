json.id @app.id
json.name @app.name
json.definition @app.current_version.definition if @app.current_version
json.definition {} unless @app.current_version
json.current_version_id @app.current_version_id
json.is_public @app.is_public

json.data_queries do
  json.array! @app.data_queries do |data_query|
    json.id data_query.id
    json.name data_query.name
    json.kind data_query.kind
    json.options data_query.options.as_json
    json.data_source_id data_query.data_source_id
  end
end

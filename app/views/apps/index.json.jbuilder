json.apps do
  json.array! @apps do |app|
    json.id app.id
    json.slug app.slug
    json.name app.name
    json.created_at time_ago_in_words(app.created_at)
    json.user app.user || {}
  end
end

json.meta @meta.as_json

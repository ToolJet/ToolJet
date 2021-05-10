json.apps do
  json.array! @apps do |app|
    json.id app.id
    json.name app.name
    json.created_at time_ago_in_words(app.created_at)
    json.user app.user || {}
  end
end

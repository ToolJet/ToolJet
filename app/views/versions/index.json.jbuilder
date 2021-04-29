json.versions do
  json.array! @versions do |version|
    json.id version.id
    json.name version.name
  end
end

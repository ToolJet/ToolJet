json.folders do
  json.array! @folders do |folder|
    json.id folder.id
    json.name folder.name
    json.count folder.apps.count
  end
end

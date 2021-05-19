json.folders do
  json.array! @folders do |folder|
    json.name folder.name
  end
end

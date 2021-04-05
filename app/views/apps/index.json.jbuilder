json.apps do 
    json.array! @apps do |app|
        json.id app.id
        json.name app.name
    end
end

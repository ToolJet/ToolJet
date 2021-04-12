json.users do 
    json.array! @app_users do |app_user|
        json.id app_user.id
        json.name "#{app_user.user.first_name} #{app_user.user.last_name}"
        json.email app_user.user.email
        json.role app_user.role
    end
end

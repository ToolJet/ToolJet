json.users do
  json.array! @org_users do |org_user|
    json.id org_user.id
    json.name "#{org_user.user.first_name} #{org_user.user.last_name}"
    json.email org_user.user.email
    json.role org_user.role
    json.status org_user.status
  end
end

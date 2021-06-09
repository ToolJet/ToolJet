
org = Organization.create(name: 'My organization')
user = User.create(first_name: 'The', last_name: 'Developer', email: 'dev@tooljet.io', password: 'password', organization: org)
OrganizationUser.create(user: user, organization: org, role: 'admin')
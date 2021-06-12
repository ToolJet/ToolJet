require 'test_helper'

class AppUsersControllerTest < ActionDispatch::IntegrationTest
  def setup
    @org = Organization.create({ name: 'ToolJet Test' })
    @org_admin = User.create({ first_name: 'Admin', email: 'admin@example.com', password: 'password',
                               organization: @org })
    @org_developer = User.create({ first_name: 'Dev', email: 'dev@example.com', password: 'password',
                                   organization: @org })
    @org_viewer = User.create({ first_name: 'Viewer', email: 'viewer@example.com', password: 'password',
                                organization: @org })

    @org_user_admin = OrganizationUser.create(organization: @org, user: @org_admin, role: 'admin', status: 'active')
    @org_user_developer = OrganizationUser.create(organization: @org, user: @org_developer, role: 'developer')
    @org_user_viewer = OrganizationUser.create(organization: @org, user: @org_viewer, role: 'viewer', status: 'active')

    @another_org = Organization.create({ name: 'Another ToolJet Test' })
    @another_org_admin = User.create({ first_name: 'Admin', email: 'admin@domain.com', password: 'password',
                                       organization: @another_org })
    @org_another_org_admin = OrganizationUser.create(organization: @another_org, user: @another_org_admin,
                                                     role: 'admin')

    @first_app = App.create({
                              name: 'Test App',
                              organization: @org_admin.organization
                            })
  end

  test 'org admins can create app users' do
    assert_difference 'AppUser.count', 1 do
      post '/app_users/', params: {
        org_user_id: @org_user_admin.id,
        app_id: @first_app.id,
        role: 'admin'
      }, as: :json, headers: auth_header(@org_admin)
    end
  end

  test 'non org-admins cannot create app users' do
    assert_no_difference 'AppUser.count' do
      post '/app_users/', params: {
        org_user_id: @org_user_developer.id,
        app_id: @first_app.id,
        role: 'admin'
      }, as: :json, headers: auth_header(@org_developer)
    end
  end

  test 'app admins can create app users' do
    AppUser.create(user: @org_viewer, app: @first_app, role: 'admin')

    assert_difference 'AppUser.count', 1 do
      post '/app_users/', params: {
        org_user_id: @org_user_developer.id,
        app_id: @first_app.id,
        role: 'admin'
      }, as: :json, headers: auth_header(@org_viewer)
    end
  end

  test 'admin of another org cannot create app users' do
    assert_no_difference 'AppUser.count' do
      post '/app_users/', params: {
        org_user_id: @org_user_admin.id,
        app_id: @first_app.id,
        role: 'admin'
      }, as: :json, headers: auth_header(@another_org_admin)
    end
  end
end

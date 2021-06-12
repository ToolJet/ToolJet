require 'test_helper'

class AppsControllerTest < ActionDispatch::IntegrationTest
  def setup
    @org = Organization.create({ name: 'ToolJet Test' })
    @admin = User.create({ first_name: 'Admin', email: 'admin@example.com', password: 'password',
                           organization: @org })
    @developer = User.create({ first_name: 'Dev', email: 'dev@example.com', password: 'password',
                               organization: @org })
    @viewer = User.create({ first_name: 'Viewer', email: 'viewer@example.com', password: 'password',
                            organization: @org })
    OrganizationUser.create(organization: @org, user: @admin, role: 'admin', status: 'active')
    OrganizationUser.create(organization: @org, user: @developer, role: 'developer', status: 'active')
    OrganizationUser.create(organization: @org, user: @viewer, role: 'viewer', status: 'active')

    @another_org = Organization.create({ name: 'Another ToolJet Test' })
    @another_org_admin = User.create({ first_name: 'Admin', email: 'admin@domain.com', password: 'password',
                                       organization: @another_org })
    OrganizationUser.create(organization: @another_org, user: @another_org_admin, role: 'admin', status: 'active')
  end

  test 'admins can create apps' do
    assert_difference 'App.count', 1 do
      post apps_url, params: { name: 'Test App' }, as: :json, headers: auth_header(@admin)
    end

    assert_response 200

    get apps_url, headers: { 'Content-Type': 'application/json' }.merge(auth_header(@admin)), xhr: true
    assert_response 200
    assert_equal 1, JSON.parse(response.body)['apps'].count
  end

  test 'developers cannot create apps' do
    assert_no_difference 'App.count' do
      post apps_url, params: { name: 'Test App' }, as: :json, headers: auth_header(@developer)
    end

    assert_response 403
  end

  test 'viewers cannot create apps' do
    assert_no_difference 'App.count' do
      post apps_url, params: { name: 'Test App' }, as: :json, headers: auth_header(@viewer)
    end

    assert_response 403
  end

  test 'all org users can GET app' do
    app = App.create(name: 'Test App', organization: @org)

    get app_url(app.id), headers: { 'Content-Type': 'application/json' }.merge(auth_header(@admin)), xhr: true
    assert_response 200

    get app_url(app.id), headers: { 'Content-Type': 'application/json' }.merge(auth_header(@developer)), xhr: true
    assert_response 200

    get app_url(app.id), headers: { 'Content-Type': 'application/json' }.merge(auth_header(@viewer)), xhr: true
    assert_response 200
  end

  test 'non org users cannot GET app' do
    app = App.create(name: 'Test App', organization: @org)

    get app_url(app.id), headers: { 'Content-Type': 'application/json' }.merge(auth_header(@another_org_admin)),
                         xhr: true
    assert_response 403
  end

  test 'users cannot list another orgs apps' do
    app = App.create(name: 'Test App', organization: @org)

    get apps_url, headers: { 'Content-Type': 'application/json' }.merge(auth_header(@another_org_admin)), xhr: true
    assert_response 200
    assert_equal 0, JSON.parse(response.body)['apps'].size
  end

  test 'org users can list orgs apps' do
    app = App.create(name: 'Test App', organization: @org)

    get apps_url, headers: { 'Content-Type': 'application/json' }.merge(auth_header(@admin)), xhr: true
    assert_response 200
    assert_equal 1, JSON.parse(response.body)['apps'].size

    get apps_url, headers: { 'Content-Type': 'application/json' }.merge(auth_header(@developer)), xhr: true
    assert_response 200
    assert_equal 1, JSON.parse(response.body)['apps'].size

    get apps_url, headers: { 'Content-Type': 'application/json' }.merge(auth_header(@viewer)), xhr: true
    assert_response 200
    assert_equal 1, JSON.parse(response.body)['apps'].size
  end

  test 'anyone can view public apps' do
    app = App.create(name: 'Test App', organization: @org, is_public: true)
    get app_url(app.id), headers: { 'Content-Type': 'application/json' },
                         xhr: true
    assert_response 200
  end
end

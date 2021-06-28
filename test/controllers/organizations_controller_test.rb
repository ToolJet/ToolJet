require "test_helper"

class OrganizationsControllerTest < ActionDispatch::IntegrationTest
  def setup
    @org = Organization.create({ name: "ToolJet Test" })
    @admin = User.create({ first_name: "Admin", email: "admin@example.com", password: "password",
                           organization: @org })
    @developer = User.create({ first_name: "Dev", email: "dev@example.com", password: "password",
                               organization: @org })
    @viewer = User.create({ first_name: "Viewer", email: "viewer@example.com", password: "password",
                            organization: @org })
    OrganizationUser.create(organization: @org, user: @admin, role: "admin", status: "active")
    OrganizationUser.create(organization: @org, user: @developer, role: "developer", status: "active")
    OrganizationUser.create(organization: @org, user: @viewer, role: "viewer", status: "active")

    @another_org = Organization.create({ name: "Another ToolJet Test" })
    @another_org_admin = User.create({ first_name: "Admin", email: "admin@domain.com", password: "password",
                                       organization: @another_org })
    OrganizationUser.create(organization: @another_org, user: @another_org_admin, role: "admin", status: "active")
  end

  test "org users can list users of the org" do
    get organization_users_url(@org.id), headers: { "Content-Type": "application/json" }.merge(auth_header(@admin)),
                                         xhr: true
    assert_response 200
    assert_equal 3, JSON.parse(response.body)["users"].size

    get organization_users_url(@org.id),
        headers: { "Content-Type": "application/json" }.merge(auth_header(@developer)), xhr: true
    assert_response 200
    assert_equal 3, JSON.parse(response.body)["users"].size

    get organization_users_url(@org.id), headers: { "Content-Type": "application/json" }.merge(auth_header(@viewer)),
                                         xhr: true
    assert_response 200
    assert_equal 3, JSON.parse(response.body)["users"].size

    get organization_users_url(@another_org.id),
        headers: { "Content-Type": "application/json" }.merge(auth_header(@another_org_admin)), xhr: true
    assert_response 200
    assert_equal 1, JSON.parse(response.body)["users"].size

    # Even if org id is given, current user's org's users are returned
    get organization_users_url(@org.id),
        headers: { "Content-Type": "application/json" }.merge(auth_header(@another_org_admin)), xhr: true
    assert_response 200
    assert_equal 1, JSON.parse(response.body)["users"].size
  end
end

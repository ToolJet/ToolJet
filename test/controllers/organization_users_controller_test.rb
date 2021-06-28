require "test_helper"

class OrganizationUsersControllerTest < ActionDispatch::IntegrationTest
  def setup
    @org = Organization.create({ name: "ToolJet Test" })
    @admin = User.create({ first_name: "Admin", email: "admin@example.com", password: "password",
                           organization: @org })
    @developer = User.create({ first_name: "Dev", email: "dev@example.com", password: "password",
                               organization: @org })
    @viewer = User.create({ first_name: "Viewer", email: "viewer@example.com", password: "password",
                            organization: @org })
    @org_user_admin = OrganizationUser.create(organization: @org, user: @admin, role: "admin", status: "active")
    @org_user_developer = OrganizationUser.create(organization: @org, user: @developer, role: "developer", status: "active")
    @org_user_viewer = OrganizationUser.create(organization: @org, user: @viewer, role: "viewer", status: "active")

    @another_org = Organization.create({ name: "Another ToolJet Test" })
    @another_org_admin = User.create({ first_name: "Admin", email: "admin@domain.com", password: "password",
                                       organization: @another_org })
    @org_another_org_admin = OrganizationUser.create(organization: @another_org, user: @another_org_admin,
                                                     role: "admin", status: "active")
  end

  # POST /create tests

  test "org admins can create org users" do
    assert_difference "OrganizationUser.count", 1 do
      post "/organization_users", params: org_user_params, as: :json, headers: auth_header(@admin)
    end
  end

  test "cannot create org users if not admin" do
    assert_no_difference "OrganizationUser.count" do
      post "/organization_users", params: org_user_params, as: :json, headers: auth_header(@developer)
    end

    assert_no_difference "OrganizationUser.count" do
      post "/organization_users", params: org_user_params, as: :json, headers: auth_header(@viewer)
    end
  end

  # POST /change_role tests

  test "org admins can change role of org users" do
    assert_equal "developer", @org_user_developer.role
    post organization_user_change_role_url(@org_user_developer.id), params: { role: "viewer" }, as: :json,
                                                                    headers: auth_header(@admin)
    assert_response 204
    assert_equal "viewer", @org_user_developer.reload.role
  end

  test "cannot change role of org users if not org admin" do
    assert_equal "developer", @org_user_developer.role
    post organization_user_change_role_url(@org_user_developer.id), params: { role: "viewer" }, as: :json,
                                                                    headers: auth_header(@viewer)
    assert_response 403
    assert_equal "developer", @org_user_developer.reload.role

    assert_equal "viewer", @org_user_viewer.role
    post organization_user_change_role_url(@org_user_viewer.id), params: { role: "viewer" }, as: :json,
                                                                 headers: auth_header(@developer)
    assert_response 403
    assert_equal "viewer", @org_user_viewer.reload.role
  end

  test "org users of one org cannot change role of users of another org" do
    assert_equal "admin", @org_another_org_admin.role
    post organization_user_change_role_url(@org_another_org_admin.id), params: { role: "viewer" }, as: :json,
                                                                       headers: auth_header(@admin)
    assert_response 403
    assert_equal "admin", @org_another_org_admin.reload.role
  end

  ## POST /archive tests

  test "org admins can archive org users" do
    assert_equal "active", @org_user_developer.status
    post organization_user_archive_url(@org_user_developer.id), as: :json, headers: auth_header(@admin)

    assert_response 204
    assert_equal "archived", @org_user_developer.reload.status
  end

  test "cannot archive user if not org admin" do
    assert_equal "active", @org_user_developer.status
    post organization_user_archive_url(@org_user_developer.id), as: :json, headers: auth_header(@viewer)
    assert_response 403
    assert_equal "active", @org_user_developer.reload.status

    assert_equal "active", @org_user_viewer.status
    post organization_user_archive_url(@org_user_viewer.id), as: :json, headers: auth_header(@developer)
    assert_response 403
    assert_equal "active", @org_user_viewer.reload.status
  end

  test "cannot archive user of another org" do
    assert_equal "active", @org_another_org_admin.status
    post organization_user_change_role_url(@org_another_org_admin.id), as: :json, headers: auth_header(@admin)
    assert_response 403
    assert_equal "active", @org_another_org_admin.reload.status
  end

  private

    def org_user_params
      {
        first_name: "test",
        last_name: "user",
        email: "user@example.com",
        role: "admin"
      }
    end
end

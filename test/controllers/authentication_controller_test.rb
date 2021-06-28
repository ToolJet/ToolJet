require "test_helper"

class AuthenticationControllerTest < ActionDispatch::IntegrationTest
  def setup
    @org = Organization.create({ name: "ToolJet Test" })
    @org_admin = User.create({ first_name: "Admin", email: "admin@example.com", password: "password",
                               organization: @org })
    @admin_org_user = OrganizationUser.create(organization: @org, user: @org_admin, role: "admin", status: "active")
  end

  test "can login if org user is active" do
    post "/authenticate/", params: {
      email: "admin@example.com",
      password: "password",
    }, as: :json

    assert_equal "200", response.code
  end

  test "cannot login if org user is not active" do

    @admin_org_user.update(status: "archived")
    @admin_org_user.reload

    post "/authenticate/", params: {
      email: "admin@example.com",
      password: "password",
    }, as: :json

    assert_equal "401", response.code
  end

end

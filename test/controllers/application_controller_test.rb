# frozen_string_literal: true

require "test_helper"

class ApplicationControllerTest < ActionDispatch::IntegrationTest
  def setup
    @org = Organization.create({ name: "ToolJet Test" })
    @org_admin = User.create({ first_name: "Admin", email: "admin@example.com", password: "password",
                               organization: @org })
    @admin_org_user = OrganizationUser.create(organization: @org, user: @org_admin, role: "admin", status: "active")
  end

  test "active users can access authenticated routes" do
    app = App.create(name: "Test App", organization: @org)
    get apps_url, headers: { "Content-Type": "application/json" }.merge(auth_header(@org_admin)), xhr: true
    assert_response 200
  end

  test "archived users cannot access authenticated routes" do

    @admin_org_user.update(status: "archived")
    @admin_org_user.reload

    app = App.create(name: "Test App", organization: @org)
    get apps_url, headers: { "Content-Type": "application/json" }.merge(auth_header(@org_admin)), xhr: true
    assert_response 401
  end
end

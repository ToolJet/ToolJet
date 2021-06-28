require "test_helper"

class FolderAppsControllerTest < ActionDispatch::IntegrationTest
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
    OrganizationUser.create(organization: @another_org, user: @another_org_admin, role: "admin")

    @folder = Folder.create(name: "Test Folder", organization: @org)
  end

  test "org admins can add apps to folders" do
    app = App.create(name: "Test App", organization: @org)
    assert_difference "FolderApp.count", 1 do
      get "/folder_apps", params: { app_id: app.id, folder_id: @folder.id }, as: :json, headers: auth_header(@admin)
    end
  end

  test "admins of a different org cannot add apps to folders" do
    app = App.create(name: "Test App", organization: @org)
    assert_difference "FolderApp.count", 0 do
      get "/folder_apps", params: { app_id: app.id, folder_id: @folder.id }, as: :json, headers: auth_header(@another_org_admin)
    end
  end

  test "only admins & developers can add apps to folders" do
    app = App.create(name: "Test App", organization: @org)
    assert_difference "FolderApp.count", 1 do
      get "/folder_apps", params: { app_id: app.id, folder_id: @folder.id }, as: :json, headers: auth_header(@developer)
    end

    assert_difference "FolderApp.count", 0 do
      get "/folder_apps", params: { app_id: app.id, folder_id: @folder.id }, as: :json, headers: auth_header(@viewer)
    end
  end
end

class AppPolicy < ApplicationPolicy
  attr_reader :user, :app

  def initialize(user, app)
    @user = user
    @app = app
  end

  def index?
    true
  end

  def create?
    user.org_admin?
  end

  def update?
    (user.organization_id === app.organization_id) && user.org_admin? || user.org_developer?
  end

  def show?
    (user.organization_id === app.organization_id) && (user.org_admin? || user.org_developer? || user.org_viewer?)
  end
end

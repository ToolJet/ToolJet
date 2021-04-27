class AppUserPolicy < ApplicationPolicy
    attr_reader :user, :app_user

    def initialize(user, app_user)
        @user = user
        @app_user = app_user
    end

    def create?
        (user.org_admin? || user.app_admin?(app_user.app))  && app_user.app.organization_id === user.organization_id
    end
end

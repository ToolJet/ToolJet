class OrganizationsController < ApplicationController

    def users
        @org_users = OrganizationUser.where(organization: @current_user.organization)
    end
end

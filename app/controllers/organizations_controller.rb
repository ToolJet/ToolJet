class OrganizationsController < ApplicationController
  def users
    @org_users = OrganizationUser.where(organization: @current_user.organization).includes(:user)
  end
end

# frozen_string_literal: true

class OrganizationsController < ApplicationController
  def users
    @org_users = OrganizationUser.not_archived.where(organization: @current_user.organization).includes(:user)
  end
end

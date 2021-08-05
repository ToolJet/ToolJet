# frozen_string_literal: true

class OrganizationUserPolicy < ApplicationPolicy
  attr_reader :user, :organization_user

  def initialize(user, organization_user)
    @user = user
    @organization_user = organization_user
  end

  def create?
    user.org_admin?
  end

  def change_role?
    (user.organization_id === organization_user.organization_id) && user.org_admin?
  end

  def archive?
    change_role?
  end
end

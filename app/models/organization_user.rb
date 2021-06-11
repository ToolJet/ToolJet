# frozen_string_literal: true

class OrganizationUser < ApplicationRecord
  belongs_to :organization
  belongs_to :user

  enum status: { active: "active", archived: "archived", invited: "invited" }

  def admin?
    role == "admin"
  end

  def developer?
    role == "developer"
  end

  def viewer?
    role == "viewer"
  end
end

class OrganizationUser < ApplicationRecord
  belongs_to :organization
  belongs_to :user

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

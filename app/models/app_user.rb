class AppUser < ApplicationRecord
  belongs_to :app
  belongs_to :user
  validates_uniqueness_of :app_id, :scope => [:user_id]

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

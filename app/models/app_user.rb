# frozen_string_literal: true

class AppUser < ApplicationRecord
  belongs_to :app
  belongs_to :user
  validates :app_id, uniqueness: { scope: [:user_id] }

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

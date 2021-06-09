# frozen_string_literal: true

# == Schema Information
#
# Table name: app_users
#
#  id         :uuid             not null, primary key
#  role       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  app_id     :uuid             not null
#  user_id    :uuid             not null
#
# Indexes
#
#  index_app_users_on_app_id   (app_id)
#  index_app_users_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (app_id => apps.id)
#  fk_rails_...  (user_id => users.id)
#
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

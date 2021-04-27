class AppUser < ApplicationRecord
  belongs_to :app
  belongs_to :user
  validates_uniqueness_of :app_id, :scope => [:user_id]
end

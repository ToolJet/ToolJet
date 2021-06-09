# frozen_string_literal: true

# == Schema Information
#
# Table name: organization_users
#
#  id              :uuid             not null, primary key
#  role            :string
#  status          :string           default("invited")
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  organization_id :uuid             not null
#  user_id         :uuid             not null
#
# Indexes
#
#  index_organization_users_on_organization_id  (organization_id)
#  index_organization_users_on_user_id          (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (organization_id => organizations.id)
#  fk_rails_...  (user_id => users.id)
#
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

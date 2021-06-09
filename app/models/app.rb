# frozen_string_literal: true

# == Schema Information
#
# Table name: apps
#
#  id                 :uuid             not null, primary key
#  definition         :json
#  is_public          :boolean          default(FALSE)
#  name               :string
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  current_version_id :uuid
#  organization_id    :uuid             not null
#  user_id            :uuid
#
# Indexes
#
#  index_apps_on_current_version_id  (current_version_id)
#  index_apps_on_organization_id     (organization_id)
#  index_apps_on_user_id             (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (current_version_id => app_versions.id)
#  fk_rails_...  (organization_id => organizations.id)
#  fk_rails_...  (user_id => users.id)
#
class App < ApplicationRecord
  belongs_to :organization
  has_many :data_queries
  has_many :app_users
  has_many :app_versions
  belongs_to :current_version, class_name: "AppVersion", optional: true
  belongs_to :user, optional: true
end

# frozen_string_literal: true

# == Schema Information
#
# Table name: folders
#
#  id              :uuid             not null, primary key
#  name            :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  organization_id :uuid             not null
#
# Indexes
#
#  index_folders_on_organization_id  (organization_id)
#
# Foreign Keys
#
#  fk_rails_...  (organization_id => organizations.id)
#
class Folder < ApplicationRecord
  belongs_to :organization
  has_many :folder_apps
  has_many :apps, through: :folder_apps
end

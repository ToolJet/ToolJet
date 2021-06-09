# frozen_string_literal: true

# == Schema Information
#
# Table name: folder_apps
#
#  id         :uuid             not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  app_id     :uuid             not null
#  folder_id  :uuid             not null
#
# Indexes
#
#  index_folder_apps_on_app_id     (app_id)
#  index_folder_apps_on_folder_id  (folder_id)
#
# Foreign Keys
#
#  fk_rails_...  (app_id => apps.id)
#  fk_rails_...  (folder_id => folders.id)
#
class FolderApp < ApplicationRecord
  belongs_to :folder
  belongs_to :app
  validates :app_id, uniqueness: { scope: [:folder_id] }
end

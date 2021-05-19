class FolderApp < ApplicationRecord
  belongs_to :folder
  belongs_to :app
  validates_uniqueness_of :app_id, scope: [:folder_id]
end

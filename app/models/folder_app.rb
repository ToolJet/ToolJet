# frozen_string_literal: true

class FolderApp < ApplicationRecord
  belongs_to :folder
  belongs_to :app
  validates :app_id, uniqueness: { scope: [:folder_id] }
end

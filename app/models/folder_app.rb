class FolderApp < ApplicationRecord
  belongs_to :folder
  belongs_to :app
end

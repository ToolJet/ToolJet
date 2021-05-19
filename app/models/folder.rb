class Folder < ApplicationRecord
  belongs_to :organization
  has_many :folder_apps
  has_many :apps, :through => :folder_apps
end

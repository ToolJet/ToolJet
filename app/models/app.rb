class App < ApplicationRecord
    belongs_to :organization
    has_many :data_queries
    has_many :app_users
    has_many :app_versions
    belongs_to :current_version, class_name: 'AppVersion', optional: true
end

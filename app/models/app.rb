class App < ApplicationRecord
    belongs_to :organization
    has_many :data_queries
    has_many :app_users
end

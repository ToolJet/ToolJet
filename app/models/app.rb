class App < ApplicationRecord
    belongs_to :organization
    has_many :data_queries
end

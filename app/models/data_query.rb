class DataQuery < ApplicationRecord
  belongs_to :app
  belongs_to :data_source, optional: true
  validates_uniqueness_of :name, scope: [:app_id]
end

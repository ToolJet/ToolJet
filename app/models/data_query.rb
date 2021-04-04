class DataQuery < ApplicationRecord
  belongs_to :app
  belongs_to :data_source, optional: true
end

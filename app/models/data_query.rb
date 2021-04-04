class DataQuery < ApplicationRecord
  belongs_to :app
  belongs_to :data_source
end

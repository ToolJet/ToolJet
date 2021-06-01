# frozen_string_literal: true

class DataQuery < ApplicationRecord
  belongs_to :app
  belongs_to :data_source, optional: true
  validates :name, uniqueness: { scope: [:app_id] }
end

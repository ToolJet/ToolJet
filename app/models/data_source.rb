# frozen_string_literal: true

# == Schema Information
#
# Table name: data_sources
#
#  id         :uuid             not null, primary key
#  kind       :string
#  name       :string
#  options    :json
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  app_id     :uuid             not null
#
# Indexes
#
#  index_data_sources_on_app_id  (app_id)
#
# Foreign Keys
#
#  fk_rails_...  (app_id => apps.id)
#
class DataSource < ApplicationRecord
  belongs_to :app
  has_many :data_queries
end

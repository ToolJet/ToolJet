# == Schema Information
#
# Table name: data_queries
#
#  id             :uuid             not null, primary key
#  kind           :string
#  name           :string
#  options        :json
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  app_id         :uuid             not null
#  data_source_id :uuid
#
# Indexes
#
#  index_data_queries_on_app_id          (app_id)
#  index_data_queries_on_data_source_id  (data_source_id)
#
# Foreign Keys
#
#  fk_rails_...  (app_id => apps.id)
#  fk_rails_...  (data_source_id => data_sources.id)
#
require 'test_helper'

class DataQueryTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end

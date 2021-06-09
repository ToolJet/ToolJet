# == Schema Information
#
# Table name: app_versions
#
#  id         :uuid             not null, primary key
#  definition :json
#  name       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  app_id     :uuid             not null
#
# Indexes
#
#  index_app_versions_on_app_id  (app_id)
#
# Foreign Keys
#
#  fk_rails_...  (app_id => apps.id)
#
require 'test_helper'

class AppVersionTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end

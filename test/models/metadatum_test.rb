# == Schema Information
#
# Table name: metadata
#
#  id         :uuid             not null, primary key
#  data       :json
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
require "test_helper"

class MetadatumTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end

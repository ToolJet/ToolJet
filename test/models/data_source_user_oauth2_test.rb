# == Schema Information
#
# Table name: data_source_user_oauth2s
#
#  id                 :uuid             not null, primary key
#  encrypted_options  :text
#  options_ciphertext :text
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  data_source_id     :uuid             not null
#  user_id            :uuid             not null
#
# Indexes
#
#  index_data_source_user_oauth2s_on_data_source_id  (data_source_id)
#  index_data_source_user_oauth2s_on_user_id         (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (data_source_id => data_sources.id)
#  fk_rails_...  (user_id => users.id)
#
require 'test_helper'

class DataSourceUserOauth2Test < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end

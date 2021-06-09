# == Schema Information
#
# Table name: credentials
#
#  id               :uuid             not null, primary key
#  encrypted_value  :text
#  value_ciphertext :text
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#
require 'test_helper'

class CredentialTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end

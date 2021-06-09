# frozen_string_literal: true

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
class Credential < ApplicationRecord
  encrypts :value
end

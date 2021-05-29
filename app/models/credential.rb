class Credential < ApplicationRecord
  encrypts :value

  include Encryptable

  attr_encrypted :value, migrating: true
end

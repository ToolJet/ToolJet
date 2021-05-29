class Credential < ApplicationRecord
  encrypts :value, migrating: true

  include Encryptable

  attr_encrypted :value
end

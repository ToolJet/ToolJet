class Credential < ApplicationRecord
  include Encryptable

  attr_encrypted :value
end

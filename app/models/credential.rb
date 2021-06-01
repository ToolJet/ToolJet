# frozen_string_literal: true

class Credential < ApplicationRecord
  encrypts :value

end

# frozen_string_literal: true

class Organization < ApplicationRecord
  has_many :users
  has_many :apps
  has_many :organization_users
end

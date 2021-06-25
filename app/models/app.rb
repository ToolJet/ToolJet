# frozen_string_literal: true

class App < ApplicationRecord
  belongs_to :organization
  has_many :data_queries, dependent: :destroy
  has_many :data_sources, dependent: :destroy
  has_many :app_users, dependent: :destroy
  has_many :app_versions, dependent: :destroy
  has_many :folder_apps, dependent: :destroy
  belongs_to :current_version, class_name: "AppVersion", optional: true
  belongs_to :user, optional: true

  validates :slug, uniqueness: { scope: :organization }

  after_save :set_default_slug_as_id, if: -> { self.slug.blank? }

  private

  def set_default_slug_as_id
    self.update_attribute(:slug, self.id)
  end
end

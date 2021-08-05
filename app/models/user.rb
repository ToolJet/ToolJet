# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password
  has_many :organization_users
  belongs_to :organization
  has_many :app_users
  has_many :apps

  validates :email, presence: true, uniqueness: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }

  def org_admin?
    organization_users.find_by(organization_id: organization_id).admin?
  end

  def org_developer?
    organization_users.find_by(organization_id: organization_id).developer?
  end

  def org_viewer?
    organization_users.find_by(organization_id: organization_id).viewer?
  end

  def app_admin?(app)
    app_users.find_by(app_id: app.id)&.admin?
  end

  def app_developer?(app)
    app_users.find_by(app_id: app.id)&.developer?
  end

  def app_viewer?(app)
    app_users.find_by(app_id: app.id)&.viewer?
  end

  def send_password_reset
    self.forgot_password_token = generate_base64_token
    self.forgot_password_token_sent_at = Time.zone.now
    save!
    UserMailer.password_reset(self).deliver_now
  end

  def forgot_password_token_valid?
    (self.forgot_password_token_sent_at + 1.hour) > Time.zone.now
  end

  def reset_password(password)
    self.forgot_password_token = nil
    self.password = password
    save!
  end

  private

    def generate_base64_token
      SecureRandom.urlsafe_base64
    end
end

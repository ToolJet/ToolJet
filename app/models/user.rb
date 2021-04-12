class User < ApplicationRecord
    has_secure_password
    belongs_to :organization
    has_many :app_users
  
    validates :email, presence: true, uniqueness: true
    validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }

    def admin?
        role == "admin"
    end

    def developer?
        role == "developer"
    end

    def viewer?
        role == "viewer"
    end
end

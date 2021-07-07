# frozen_string_literal: true

class AuthorizeApiRequest
  prepend SimpleCommand

  def initialize(headers = {})
    @headers = headers
    @user = nil
  end

  def call
    find_and_validate_user
    return nil if errors.present?

    @user
  end

  private

  attr_reader :headers

  def find_and_validate_user
    if decoded_auth_token.present?
      @user = User.find(decoded_auth_token[:user_id])
      org_user = OrganizationUser.where(user: @user, organization: @user.organization).first
      return if org_user&.active?

      errors.add(:token, "Archived user")
    else
      errors.add(:token, "Invalid token")
    end
  end

  def decoded_auth_token
    @decoded_auth_token ||= JsonWebToken.decode(http_auth_header)
  end

  def http_auth_header
    if headers["Authorization"].present?
      return headers["Authorization"].split(" ").last
    else
      errors.add(:token, "Missing token")
    end

    nil
  end
end

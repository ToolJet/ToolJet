class AuthenticateUser
  prepend SimpleCommand

  def initialize(email, password)
    @email = email
    @password = password
  end

  def call
    JsonWebToken.encode(user_id: user.id) if user
  end

  private

  attr_accessor :email, :password

  def user
    user = User.find_by_email(email)
    org_user = OrganizationUser.where(user: user, organization: user.organization)&.first

    return user if user && user.authenticate(password) && org_user.active?

    errors.add :user_authentication, 'invalid credentials'
    nil
  end
end

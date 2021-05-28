class AuthenticationController < ApplicationController
  skip_before_action :authenticate_request

  def authenticate
    command = AuthenticateUser.call(params[:email], params[:password])

    if command.success?
      user = User.find_by_email params[:email]
      render json: { auth_token: command.result, first_name: user.first_name, last_name: user.last_name,
                     email: user.email }
    else
      render json: { error: command.errors }, status: :unauthorized
    end
  end

  def signup
    # Check if the installation allows user signups
    if(ENV['DISABLE_SIGNUPS'] === "true")
      render json: {}, status: 500
    else
      email = params[:email]
      password = SecureRandom.uuid
      org = Organization.create(name: 'new org')
      user = User.create(email: email, password: password, organization: org, invitation_token: SecureRandom.uuid)

      org_user = OrganizationUser.create(user: user, organization: org, role: 'admin')

      UserMailer.with(user: user, sender: @current_user).new_signup_email.deliver if org_user.save
    end
  end
end

class UsersController < ApplicationController
  skip_before_action :authenticate_request

  def set_password_from_token
    user = User.where(invitation_token: params[:token]).first

    if user
      user.update(first_name: params[:first_name], last_name: params[:last_name], password: params[:password], invitation_token: nil)
      user.organization_users.first.update(status: 'active')

      if params[:new_signup]
        user.organization.update(name: params[:organization])
      end
    else
      render json: { message: 'Invalid Invitation Token' }, status: :bad_request
    end
  end
end

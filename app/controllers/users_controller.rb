class UsersController < ApplicationController
    skip_before_action :authenticate_request
    
    def set_password_from_token
        user = User.where(invitation_token: params[:token]).first

        if user
            user.update(password: params[:password], invitation_token: nil)
        else
            render json: { message: 'Invalid Invitation Token' }, status: :bad_request
        end
    end
end

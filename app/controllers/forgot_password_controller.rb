class ForgotPasswordController < ApplicationController
  skip_before_action :authenticate_request

  def forgot
    user = User.find_by(email: params[:_json])
    if user.present?
      user.send_password_reset
      render json: {message: 'We have sent you a password reset email'}, status: :ok
    else
      render json: {error: 'Email address not found. Please check the email'}, status: :not_found
    end
  end

  def reset
    user = User.find_by(forgot_password_token: params[:token])
    if user.present? && user.forgot_password_token_valid?
      if user.reset_password(params[:password])
        render json: {message: 'Your password has been successfuly reset!'}, status: :ok
      else
        render json: {error: user.errors.full_messages}, status: :unprocessable_entity
      end
    else
      render json: {error: 'Link not valid or expired.'}, status: :not_found
    end
  end
end

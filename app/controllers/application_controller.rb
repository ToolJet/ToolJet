class ApplicationController < ActionController::API
  include Pundit
  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  before_action :authenticate_request
  attr_reader :current_user

  private

  def authenticate_request
    @current_user = AuthorizeApiRequest.call(request.headers).result
    render json: { error: 'Not Authorized' }, status: 401 unless @current_user
  end

  def user_not_authorized
    render json: { error: 'Access denied' }, status: :forbidden
  end
end

# frozen_string_literal: true

class ApplicationController < ActionController::API
  include Pundit
  rescue_from Pundit::NotAuthorizedError, with: :render_user_not_authorized

  before_action :authenticate_request


  def current_user
    @current_user ||= AuthorizeApiRequest.call(request.headers).result
  end

  def render_not_authenticated
    render json: { error: 'Not Authorized' }, status: :unauthorized
  end

  private

  def authenticate_request
    render_not_authenticated if current_user.blank?
  end

  def render_user_not_authorized
    render json: { error: 'Access denied' }, status: :forbidden
  end
end

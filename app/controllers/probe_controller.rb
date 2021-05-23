class ProbeController < ApplicationController
  skip_before_action :authenticate_request

  def health_check
      render json: { works: 'yeah' }
  end
end

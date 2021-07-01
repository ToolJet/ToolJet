# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: "ToolJet <#{ENV.fetch('DEFAULT_FROM_EMAIL', 'hello@tooljet.io')}>"
  layout "mailer"
end

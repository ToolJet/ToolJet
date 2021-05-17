class ApplicationMailer < ActionMailer::Base
  default from: "ToolJET <#{ENV.fetch('DEFAULT_FROM_EMAIL', 'hello@tooljet.io')}>"
  layout 'mailer'
end

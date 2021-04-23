class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch('DEFAULT_FROM_EMAIL', 'hello@tooljet.io')
  layout 'mailer'
end

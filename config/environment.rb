# Load the Rails application.
require_relative 'application'

# Initialize the Rails application.
Rails.application.initialize!

ActionMailer::Base.smtp_settings = {
  user_name: ENV.fetch('SMTP_USERNAME', ''),
  password: ENV.fetch('SMTP_PASSWORD', ''),
  domain: ENV.fetch('SMTP_DOMAIN', ''),
  address: ENV.fetch('SMTP_ADDRESS', ''),
  port: 587,
  authentication: :plain,
  enable_starttls_auto: true
}

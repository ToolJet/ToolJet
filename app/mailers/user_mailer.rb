class UserMailer < ApplicationMailer
  def invitation_email
    @user = params[:user]
    @sender = params[:sender]
    @url = "#{ENV.fetch('TOOLJET_HOST')}/invitations/#{@user.invitation_token}"
    mail(to: @user.email, subject: 'ToolJet Invitation')
  end

  def new_signup_email
    @user = params[:user]
    @url = "#{ENV.fetch('TOOLJET_HOST')}/invitations/#{@user.invitation_token}?signup=true"
    mail(to: @user.email, subject: 'ToolJet Invitation')
  end
end

class OrganizationUsersController < ApplicationController
    
    def create

        first_name = params[:first_name]
        last_name = params[:last_name]
        email = params[:email]
        role = params[:role]
        password = SecureRandom.uuid
        org = @current_user.organization

        user = User.create(
            first_name: first_name,
            last_name: last_name,
            email: email,
            password: password,
            password_confirmation: password,
            organization: org,
            invitation_token: SecureRandom.uuid
        )

        org_user = OrganizationUser.new(
            role: role, 
            user: user,
            organization: org
        )

        if org_user.save
            UserMailer.with(user: user, sender: @current_user).invitation_email.deliver
        end

    end
end

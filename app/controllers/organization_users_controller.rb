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
            organization: org
        )

        OrganizationUser.create(
            role: role, 
            user: user,
            organization: org
        )
    end
end

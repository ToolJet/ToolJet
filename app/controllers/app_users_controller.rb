class AppUsersController < ApplicationController

    def create

        org_user_id = params[:org_user_id]
        app_id = params[:app_id]
        role = params[:role]

        org_user = OrganizationUser.find org_user_id
        app = App.find app_id

        app_user = AppUser.new(
            role: role, 
            app: app,
            user_id: org_user.user_id,
        )

        authorize app_user

        if app_user.save
            render json: { success: true }
        else
            render json: { message: 'Could not create user' }, status: 500
        end
    end
end

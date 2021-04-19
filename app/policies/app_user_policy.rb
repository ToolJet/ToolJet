class AppUserPolicy < ApplicationPolicy
    attr_reader :user, :record

    def initialize(user, record)
      @user = user
      @record = record
    end

    class Scope
      attr_reader :user, :scope

      def initialize(user, scope)
        @user = user
        @scope = scope
      end

      def resolve
        if @user.admin?
          scope.all
        else
          scope.where(organization: current_organization)
        end
      end
    end
  end
